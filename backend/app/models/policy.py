import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class PolicyState(str, enum.Enum):
    """Policy aggregate states from MONSOONCOVER_SPEC.md §10.3."""

    PENDING_ISSUANCE = "PENDING_ISSUANCE"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class PolicyVersion(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A versioned reference/demo parametric product configuration.

    `trigger_rule` holds the executable rule (peril, parameter, unit,
    aggregation, window, strike and near-trigger thresholds, zone, risk
    period, policy timezone, required settlement provider). Per §6.1 the
    required provider matters: only the source the policy specifies may
    support a settlement-oriented trigger candidate."""

    __tablename__ = "policy_versions"
    __table_args__ = (UniqueConstraint("product_code", "version", name="uq_policy_product_version"),)

    product_code: Mapped[str] = mapped_column(String(128), nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    trigger_rule: Mapped[dict] = mapped_column(JSON, nullable=False)
    disclosure_version: Mapped[str] = mapped_column(String(32), nullable=False)

    # REAL / DERIVED / SIMULATED. Commercial values are SIMULATED unless an
    # applicable registered source supports them (§4, §8.3).
    classification: Mapped[str] = mapped_column(String(32), nullable=False)


class BorrowerPolicySnapshot(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """An immutable, borrower-specific copy of the exact terms accepted
    (MONSOONCOVER_SPEC.md §10.4: "Policy activation requires evidence-gated
    validation and an immutable snapshot").

    Nothing in this codebase updates `trigger_rule_snapshot` or
    `accepted_at_utc` after creation — later configuration changes to the
    PolicyVersion must not alter an accepted snapshot. The Trigger Engine
    reads the rule from here, never from the live PolicyVersion."""

    __tablename__ = "borrower_policy_snapshots"

    snapshot_reference: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    borrower_id: Mapped[str] = mapped_column(ForeignKey("borrowers.id"), nullable=False)
    loan_id: Mapped[str] = mapped_column(ForeignKey("loans.id"), nullable=False)
    policy_version_id: Mapped[str] = mapped_column(ForeignKey("policy_versions.id"), nullable=False)

    trigger_rule_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    disclosure_version: Mapped[str] = mapped_column(String(32), nullable=False)
    consent_recorded_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    snapshot_checksum: Mapped[str] = mapped_column(String(64), nullable=False)

    state: Mapped[PolicyState] = mapped_column(
        Enum(PolicyState, name="policy_state"), default=PolicyState.PENDING_ISSUANCE, nullable=False
    )
