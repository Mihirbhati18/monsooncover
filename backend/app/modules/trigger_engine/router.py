"""HTTP surface for historical replay and trigger evaluations.

§6.7: replay must process frozen observations through the same
normalization, validation and trigger code as ordinary monitoring. This
router therefore calls the same engine the tests exercise — it does not
set a trigger state directly.
"""

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.climate.historical_csv import DatasetIntegrityError, ingest
from app.core.database import get_db
from app.models.climate import ClimateDataset, ClimateObservation
from app.models.policy import BorrowerPolicySnapshot
from app.models.trigger import CalculationTrace, TriggerEvaluation
from app.models.user import Role, User
from app.modules.audit.service import record_audit_event
from app.modules.auth.deps import require_role
from app.modules.trigger_engine.engine import TriggerRuleError, evaluate
from app.schemas.workflow import ReplayRequest, TriggerEvaluationDetail, TriggerEvaluationRead

router = APIRouter(prefix="/triggers", tags=["triggers"])

OPERATORS = require_role(Role.LENDER, Role.ADMIN)
VIEWERS = require_role(Role.LENDER, Role.ADMIN, Role.INSURER)

REPO_ROOT = Path(__file__).resolve().parents[4]
CSV_PATH = REPO_ROOT / "data" / "historical" / "raw" / "surat_rainfall_2026.csv"
MANIFEST_PATH = REPO_ROOT / "data" / "manifests" / "surat_rainfall_2026.json"


@router.post("/replay", response_model=TriggerEvaluationDetail, status_code=201)
def run_historical_replay(
    payload: ReplayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(OPERATORS),
):
    snapshot = db.scalar(
        select(BorrowerPolicySnapshot).where(
            BorrowerPolicySnapshot.snapshot_reference == payload.snapshot_reference
        )
    )
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Policy snapshot not found")

    dataset = db.scalar(select(ClimateDataset).where(ClimateDataset.dataset_code == "DS-MC-RAIN-2026-01"))
    if dataset is None:
        raise HTTPException(status_code=404, detail="Registered climate dataset not found; run the demo seed first.")

    # The engine reads the rule from the immutable accepted snapshot, never
    # from the live PolicyVersion (§10.4).
    rule = snapshot.trigger_rule_snapshot

    try:
        observations = ingest(
            csv_path=CSV_PATH, manifest_path=MANIFEST_PATH, dataset_id=dataset.id, trigger_rule=rule
        )
    except DatasetIntegrityError as error:
        # §6.4: unverified settlement-reference data stops the pipeline.
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    for observation in observations:
        if not db.scalar(
            select(ClimateObservation).where(
                ClimateObservation.provider == observation.provider,
                ClimateObservation.provider_record_id == observation.provider_record_id,
            )
        ):
            db.add(observation)
    db.flush()

    try:
        result = evaluate(
            snapshot_reference=snapshot.snapshot_reference, trigger_rule=rule, observations=observations
        )
    except TriggerRuleError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    existing = db.scalar(
        select(TriggerEvaluation).where(TriggerEvaluation.evaluation_key == result.evaluation_key)
    )
    if existing is not None:
        # §13: one evaluation per deterministic key; replay returns the original.
        trace = db.scalar(select(CalculationTrace).where(CalculationTrace.evaluation_id == existing.id))
        db.commit()
        return _detail(existing, trace)

    evaluation = TriggerEvaluation(
        evaluation_key=result.evaluation_key,
        snapshot_id=snapshot.id,
        correlation_id=payload.correlation_id,
        outcome=result.outcome,
        observed_value=result.observed_value,
        strike_threshold=result.strike_threshold,
        normalized_unit=result.normalized_unit,
        window_start_local=result.window_start_local,
        window_end_local=result.window_end_local,
        evaluated_at_utc=result.evaluated_at_utc,
        evaluation_version=result.evaluation_version,
        observation_ids=result.observation_ids,
    )
    db.add(evaluation)
    db.flush()

    trace = CalculationTrace(
        evaluation_id=evaluation.id, steps=result.steps, inputs_digest=result.inputs_digest
    )
    db.add(trace)

    record_audit_event(
        db,
        correlation_id=payload.correlation_id,
        event_type="TRIGGER_EVALUATED",
        actor_type="user",
        actor_id=current_user.id,
        source_system="monsooncover-backend",
        entity_type="TriggerEvaluation",
        entity_id=evaluation.id,
        classification="DERIVED",
        previous_state="CLIMATE_MONITORING",
        new_state=result.outcome.value,
        reason=f"Historical replay produced {result.outcome.value} at {result.observed_value} {result.normalized_unit}.",
        request_or_evidence_reference=dataset.dataset_code,
    )

    db.commit()
    db.refresh(evaluation)
    db.refresh(trace)
    return _detail(evaluation, trace)


@router.get("", response_model=list[TriggerEvaluationRead])
def list_evaluations(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    return list(db.scalars(select(TriggerEvaluation).order_by(TriggerEvaluation.evaluated_at_utc)))


@router.get("/{evaluation_id}", response_model=TriggerEvaluationDetail)
def get_evaluation(evaluation_id: str, db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    evaluation = db.get(TriggerEvaluation, evaluation_id)
    if evaluation is None:
        raise HTTPException(status_code=404, detail="Trigger evaluation not found")

    trace = db.scalar(select(CalculationTrace).where(CalculationTrace.evaluation_id == evaluation.id))
    return _detail(evaluation, trace)


def _detail(evaluation: TriggerEvaluation, trace: CalculationTrace | None) -> dict:
    return {
        "id": evaluation.id,
        "evaluation_key": evaluation.evaluation_key,
        "correlation_id": evaluation.correlation_id,
        "outcome": evaluation.outcome,
        "observed_value": evaluation.observed_value,
        "strike_threshold": evaluation.strike_threshold,
        "normalized_unit": evaluation.normalized_unit,
        "window_start_local": evaluation.window_start_local,
        "window_end_local": evaluation.window_end_local,
        "evaluation_version": evaluation.evaluation_version,
        "evaluated_at_utc": evaluation.evaluated_at_utc,
        "trace_steps": trace.steps if trace else [],
        "inputs_digest": trace.inputs_digest if trace else "",
        "observation_count": len(evaluation.observation_ids or []),
    }
