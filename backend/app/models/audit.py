from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, utcnow


class AuditEvent(UUIDPrimaryKeyMixin, Base):
    """Append-only audit trail (MONSOONCOVER_SPEC.md §15.2). Field names match
    the spec exactly. No API/service in this codebase updates or deletes a
    row here — corrections must be recorded as additional events."""

    __tablename__ = "audit_events"

    correlation_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    actor_type: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_id: Mapped[str] = mapped_column(String(255), nullable=False)
    occurred_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    source_system: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(255), nullable=False)
    previous_state: Mapped[str | None] = mapped_column(String(255), nullable=True)
    new_state: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    request_or_evidence_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    classification: Mapped[str] = mapped_column(String(32), nullable=False)
    application_version: Mapped[str] = mapped_column(String(64), nullable=False)
