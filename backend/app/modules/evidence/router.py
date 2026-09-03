"""Evidence Registry and the policy activation gate.

§4.5: "The admin/evidence view must let a reviewer trace a policy field or
critical metric to its evidence." These endpoints preserve the full §4.4
provenance field set even where a demo screen shows only a badge.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.evidence import EvidenceRecord
from app.models.policy import PolicyVersion
from app.models.user import Role, User
from app.modules.audit.service import record_audit_event
from app.modules.auth.deps import require_role
from app.modules.evidence.gate import evaluate_activation_gate
from app.schemas.evidence import ActivationGateRead, EvidenceRecordCreate, EvidenceRecordRead

router = APIRouter(prefix="/evidence", tags=["evidence"])

ADMINS = require_role(Role.ADMIN)
VIEWERS = require_role(Role.LENDER, Role.ADMIN, Role.INSURER)


@router.get("", response_model=list[EvidenceRecordRead])
def list_evidence(
    classification: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _user: User = Depends(VIEWERS),
):
    query = select(EvidenceRecord).order_by(EvidenceRecord.evidence_id)
    if classification is not None:
        query = query.where(EvidenceRecord.classification == classification)
    return list(db.scalars(query))


@router.post("", response_model=EvidenceRecordRead, status_code=201)
def register_evidence(
    payload: EvidenceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMINS),
):
    """Registering evidence is an administrative act (§4.3 requires an
    approving admin identity), so it is restricted to the admin role."""

    record = EvidenceRecord(
        **payload.model_dump(),
        registered_at_utc=datetime.now(timezone.utc),
    )
    db.add(record)

    try:
        db.flush()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Evidence id '{payload.evidence_id}' is already registered.",
        ) from error

    record_audit_event(
        db,
        correlation_id=f"EVIDENCE-{record.evidence_id}",
        event_type="EVIDENCE_REGISTERED",
        actor_type="user",
        actor_id=current_user.id,
        source_system="monsooncover-backend",
        entity_type="EvidenceRecord",
        entity_id=record.id,
        classification=record.classification,
        new_state=record.review_status,
        reason=f"Registered evidence for {record.subject_type}.{record.subject_field}.",
        request_or_evidence_reference=record.evidence_id,
    )

    db.commit()
    db.refresh(record)
    return record


@router.get("/activation-gate/{product_code}", response_model=ActivationGateRead)
def check_activation_gate(
    product_code: str,
    db: Session = Depends(get_db),
    _user: User = Depends(VIEWERS),
):
    """§4.3: a policy configuration cannot become ACTIVE unless every
    settlement-critical field carries evidence.

    There is deliberately no override parameter. The specification calls
    missing evidence "a blocking validation error, not a warning that can
    be ignored", so this endpoint cannot be asked to skip the check."""

    version = db.scalar(select(PolicyVersion).where(PolicyVersion.product_code == product_code))
    if version is None:
        raise HTTPException(status_code=404, detail="Policy version not found")

    records = list(
        db.scalars(
            select(EvidenceRecord).where(EvidenceRecord.subject_type == "policy_version")
        )
    )
    result = evaluate_activation_gate(trigger_rule=version.trigger_rule, evidence_records=records)

    return ActivationGateRead(
        product_code=product_code,
        can_activate=result.can_activate,
        summary=result.summary,
        satisfied_fields=result.satisfied_fields,
        blocking_errors=result.blocking_errors,
    )
