"""HTTP surface for the Risk Engine and the Eligibility/Policy-Matching
Engine.

MONSOONCOVER_SPEC.md §7 requires these concepts stay separate "in data
models, services, APIs, tests, and UI language". They are therefore two
distinct endpoints returning two distinct shapes, and the eligibility
endpoint does not read the risk assessment.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.borrower import Borrower
from app.models.climate import ClimateDataset, ClimateObservation
from app.models.policy import PolicyState, PolicyVersion
from app.models.risk import PolicyEligibility, RiskAssessment
from app.models.user import Role, User
from app.modules.audit.service import record_audit_event
from app.modules.auth.deps import require_role
from app.modules.policy_matching.engine import BorrowerFacts, match
from app.modules.risk_engine.engine import assess
from app.schemas.risk import EligibilityRequest, PolicyEligibilityRead, RiskAssessmentRead

router = APIRouter(tags=["risk"])

OPERATORS = require_role(Role.LENDER, Role.ADMIN)
VIEWERS = require_role(Role.LENDER, Role.ADMIN, Role.INSURER)

DEFAULT_PERIL = "EXTREME_RAINFALL"


@router.post("/risk/assessments/{borrower_id}", response_model=RiskAssessmentRead, status_code=201)
def assess_borrower(
    borrower_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(OPERATORS),
):
    """Advisory climate exposure only. It does not approve, deny or price
    credit, and it does not make any policy applicable (§7.1)."""

    borrower = db.get(Borrower, borrower_id)
    if borrower is None:
        raise HTTPException(status_code=404, detail="Borrower not found")

    dataset = db.scalar(select(ClimateDataset).where(ClimateDataset.dataset_code == "DS-MC-RAIN-2026-01"))
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered climate dataset. Run a replay from Events & triggers first.",
        )

    observations = list(
        db.scalars(select(ClimateObservation).where(ClimateObservation.zone_id == borrower.zone_id))
    )

    result = assess(
        zone_id=borrower.zone_id,
        peril=DEFAULT_PERIL,
        sector=borrower.sector,
        observations=observations,
    )

    assessment = RiskAssessment(
        borrower_id=borrower.id,
        zone_id=borrower.zone_id,
        peril=DEFAULT_PERIL,
        sector=borrower.sector,
        exposure_band=result.exposure_band,
        max_daily_value=result.max_daily_value,
        total_value=result.total_value,
        heavy_day_count=result.heavy_day_count,
        observation_count=result.observation_count,
        normalized_unit=result.normalized_unit,
        methodology_version=result.methodology_version,
        methodology_steps=result.methodology_steps,
        dataset_code=dataset.dataset_code,
        assessed_at_utc=result.assessed_at_utc,
        classification="DERIVED",
    )
    db.add(assessment)
    db.flush()

    record_audit_event(
        db,
        correlation_id=f"RISK-{borrower.id}",
        event_type="CLIMATE_RISK_ASSESSED",
        actor_type="user",
        actor_id=current_user.id,
        source_system="monsooncover-backend",
        entity_type="RiskAssessment",
        entity_id=assessment.id,
        classification="DERIVED",
        previous_state="LOAN_CREATED",
        new_state="CLIMATE_ASSESSED",
        reason=(
            f"Advisory exposure {result.exposure_band.value} from {result.observation_count} "
            f"observation(s). Not a credit or pricing decision."
        ),
        request_or_evidence_reference=dataset.dataset_code,
    )

    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/risk/assessments", response_model=list[RiskAssessmentRead])
def list_assessments(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    return list(db.scalars(select(RiskAssessment).order_by(RiskAssessment.assessed_at_utc)))


@router.post("/policies/eligibility/{borrower_id}", response_model=PolicyEligibilityRead, status_code=201)
def check_eligibility(
    borrower_id: str,
    payload: EligibilityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(OPERATORS),
):
    """Matches explicit policy constraints. Note what is absent: this
    handler never loads a RiskAssessment. §7.2 — a risk score alone never
    creates eligibility."""

    borrower = db.get(Borrower, borrower_id)
    if borrower is None:
        raise HTTPException(status_code=404, detail="Borrower not found")

    version = db.scalar(select(PolicyVersion).where(PolicyVersion.product_code == payload.product_code))
    if version is None:
        raise HTTPException(status_code=404, detail="Policy version not found")

    result = match(
        borrower=BorrowerFacts(
            zone_id=borrower.zone_id,
            sector=borrower.sector,
            requested_peril=payload.requested_peril,
        ),
        trigger_rule=version.trigger_rule,
        cover_start_local=payload.cover_start_local,
        cover_end_local=payload.cover_end_local,
        policy_state=PolicyState.ACTIVE.value,
    )

    existing = db.scalar(
        select(PolicyEligibility).where(
            PolicyEligibility.borrower_id == borrower.id,
            PolicyEligibility.policy_version_id == version.id,
        )
    )
    if existing is not None:
        existing.is_eligible = result.is_eligible
        existing.reasons = result.reasons
        existing.matching_version = result.matching_version
        existing.evaluated_at_utc = result.evaluated_at_utc
        eligibility = existing
    else:
        eligibility = PolicyEligibility(
            borrower_id=borrower.id,
            policy_version_id=version.id,
            is_eligible=result.is_eligible,
            reasons=result.reasons,
            matching_version=result.matching_version,
            evaluated_at_utc=result.evaluated_at_utc,
        )
        db.add(eligibility)
    db.flush()

    record_audit_event(
        db,
        correlation_id=f"ELIGIBILITY-{borrower.id}",
        event_type="POLICY_ELIGIBILITY_EVALUATED",
        actor_type="user",
        actor_id=current_user.id,
        source_system="monsooncover-backend",
        entity_type="PolicyEligibility",
        entity_id=eligibility.id,
        classification="DERIVED",
        new_state="ELIGIBLE" if result.is_eligible else "NOT_ELIGIBLE",
        reason="Matched against explicit policy constraints; climate exposure was not consulted.",
        request_or_evidence_reference=payload.product_code,
    )

    db.commit()
    db.refresh(eligibility)
    return eligibility


@router.get("/policies/eligibility", response_model=list[PolicyEligibilityRead])
def list_eligibility(db: Session = Depends(get_db), _user: User = Depends(VIEWERS)):
    return list(db.scalars(select(PolicyEligibility).order_by(PolicyEligibility.evaluated_at_utc)))
