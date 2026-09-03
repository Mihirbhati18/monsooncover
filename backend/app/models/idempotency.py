from sqlalchemy import JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class IdempotencyRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Enforces MONSOONCOVER_SPEC.md §13: every insurer submission, callback,
    payout event, and lender posting requires an idempotency key, and a
    database uniqueness constraint — not application checks alone — must
    enforce the duplicate rule. A replayed (scope, idempotency_key) pair
    must return the original stored response rather than repeat the effect."""

    __tablename__ = "idempotency_records"
    __table_args__ = (UniqueConstraint("scope", "idempotency_key", name="uq_idempotency_scope_key"),)

    scope: Mapped[str] = mapped_column(String(128), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False)
    response_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
