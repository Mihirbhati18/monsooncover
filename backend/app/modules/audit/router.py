"""Read-only audit surface.

MONSOONCOVER_SPEC.md §15.2: audit records must not be silently edited or
deleted through ordinary UI/API operations. This router exposes GET only —
there is deliberately no PUT, PATCH or DELETE here, and no service
function exists that could back one.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit import AuditEvent
from app.models.user import Role, User
from app.modules.auth.deps import require_role
from app.schemas.workflow import AuditEventRead

router = APIRouter(prefix="/audit", tags=["audit"])

VIEWERS = require_role(Role.LENDER, Role.ADMIN, Role.INSURER)


@router.get("", response_model=list[AuditEventRead])
def list_audit_events(
    correlation_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _user: User = Depends(VIEWERS),
):
    """The shared correlation ID follows one business event through
    ingestion, evaluation, insurer decision, payout, posting and
    reconciliation (§15.2)."""

    query = select(AuditEvent).order_by(AuditEvent.occurred_at_utc)
    if correlation_id is not None:
        query = query.where(AuditEvent.correlation_id == correlation_id)
    return list(db.scalars(query))
