import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class TriggerOutcome(str, enum.Enum):
    """The only outcomes the Trigger Engine may produce (MONSOONCOVER_SPEC.md
    §7.3). There is deliberately no CLAIM_APPROVED member: the engine never
    approves a claim, and the type system should make that impossible rather
    than merely discouraged."""

    NO_TRIGGER = "NO_TRIGGER"
    NEAR_TRIGGER = "NEAR_TRIGGER"
    TRIGGER_CANDIDATE = "TRIGGER_CANDIDATE"


class TriggerEvaluation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One deterministic evaluation of a policy snapshot against verified
    reference data.

    `evaluation_key` is the deterministic key required by §13 — derived from
    the policy snapshot, zone, risk period, peril/index and evaluation
    version. It is unique, so re-running the same evaluation cannot create a
    second trigger event for the same policy and covered phase."""

    __tablename__ = "trigger_evaluations"

    evaluation_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("borrower_policy_snapshots.id"), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)

    outcome: Mapped[TriggerOutcome] = mapped_column(Enum(TriggerOutcome, name="trigger_outcome"), nullable=False)
    observed_value: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    strike_threshold: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    normalized_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    window_start_local: Mapped[str] = mapped_column(String(10), nullable=False)
    window_end_local: Mapped[str] = mapped_column(String(10), nullable=False)

    evaluated_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    evaluation_version: Mapped[str] = mapped_column(String(64), nullable=False)
    observation_ids: Mapped[list] = mapped_column(JSON, nullable=False)

    trace: Mapped["CalculationTrace"] = relationship(back_populates="evaluation", uselist=False)


class CalculationTrace(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """The inspectable proof that an outcome was computed, not asserted
    (MONSOONCOVER_SPEC.md §17 step 9). `steps` is an ordered list of
    {step, description, value} entries a reviewer can read end to end."""

    __tablename__ = "calculation_traces"

    evaluation_id: Mapped[str] = mapped_column(ForeignKey("trigger_evaluations.id"), nullable=False)
    steps: Mapped[list] = mapped_column(JSON, nullable=False)
    inputs_digest: Mapped[str] = mapped_column(String(64), nullable=False)

    evaluation: Mapped["TriggerEvaluation"] = relationship(back_populates="trace")
