from sqlalchemy.orm import Session

from app.models.audit import AuditEvent

APPLICATION_VERSION = "0.1.0"


def record_audit_event(
    db: Session,
    *,
    correlation_id: str,
    event_type: str,
    actor_type: str,
    actor_id: str,
    source_system: str,
    entity_type: str,
    entity_id: str,
    classification: str,
    previous_state: str | None = None,
    new_state: str | None = None,
    reason: str | None = None,
    request_or_evidence_reference: str | None = None,
) -> AuditEvent:
    """Appends one audit event (MONSOONCOVER_SPEC.md §15.2). This is the only
    way audit rows are written in this codebase — no router or service
    updates or deletes an AuditEvent; corrections must call this again."""

    event = AuditEvent(
        correlation_id=correlation_id,
        event_type=event_type,
        actor_type=actor_type,
        actor_id=actor_id,
        source_system=source_system,
        entity_type=entity_type,
        entity_id=entity_id,
        previous_state=previous_state,
        new_state=new_state,
        reason=reason,
        request_or_evidence_reference=request_or_evidence_reference,
        classification=classification,
        application_version=APPLICATION_VERSION,
    )
    db.add(event)
    db.flush()
    return event
