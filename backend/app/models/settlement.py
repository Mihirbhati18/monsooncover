import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class InsurerDecisionOutcome(str, enum.Enum):
    """Insurer decision states from MONSOONCOVER_SPEC.md §10.3. The insurer
    decides — MonsoonCover only carries the request and records the answer."""

    PENDING = "PENDING"
    NEEDS_MORE_DATA = "NEEDS_MORE_DATA"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PayoutState(str, enum.Enum):
    NOT_APPLICABLE = "NOT_APPLICABLE"
    APPROVED = "APPROVED"
    INITIATED = "INITIATED"
    PAID = "PAID"
    FAILED = "FAILED"


class LenderPostingState(str, enum.Enum):
    NOT_REQUESTED = "NOT_REQUESTED"
    PENDING = "PENDING"
    RECEIVED = "RECEIVED"
    POSTED = "POSTED"
    FAILED = "FAILED"


class ReconciliationState(str, enum.Enum):
    NOT_READY = "NOT_READY"
    PENDING = "PENDING"
    RECONCILED = "RECONCILED"
    MISMATCH = "MISMATCH"


class ExceptionState(str, enum.Enum):
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"


class InsurerRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A trigger candidate submitted to the insurer sandbox for independent
    review (§12.2). Submission is not approval."""

    __tablename__ = "insurer_requests"

    evaluation_id: Mapped[str] = mapped_column(ForeignKey("trigger_evaluations.id"), nullable=False)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("borrower_policy_snapshots.id"), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    external_request_id: Mapped[str] = mapped_column(String(255), nullable=False)
    submitted_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    adapter_name: Mapped[str] = mapped_column(String(128), nullable=False)
    adapter_version: Mapped[str] = mapped_column(String(32), nullable=False)


class InsurerDecision(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """The insurer sandbox's recorded answer. A mandatory reason accompanies
    every decision (§3, §15.3)."""

    __tablename__ = "insurer_decisions"

    request_id: Mapped[str] = mapped_column(ForeignKey("insurer_requests.id"), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    outcome: Mapped[InsurerDecisionOutcome] = mapped_column(
        Enum(InsurerDecisionOutcome, name="insurer_decision_outcome"), nullable=False
    )
    reason: Mapped[str] = mapped_column(String(1024), nullable=False)
    decided_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    decided_by: Mapped[str] = mapped_column(String(255), nullable=False)
    approved_amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(3), nullable=True)


class Payout(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """An illustrative payout event. §10.4: payout initiation requires
    insurer approval — enforced in the orchestrator, not just documented."""

    __tablename__ = "payouts"

    decision_id: Mapped[str] = mapped_column(ForeignKey("insurer_decisions.id"), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    payout_reference: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    state: Mapped[PayoutState] = mapped_column(Enum(PayoutState, name="payout_state"), nullable=False)
    initiated_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class LenderPosting(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """The lender sandbox's record of the credit against the demo loan.
    §10.4: lender posting requires a payout reference and routing
    instruction."""

    __tablename__ = "lender_postings"

    payout_id: Mapped[str] = mapped_column(ForeignKey("payouts.id"), nullable=False)
    loan_id: Mapped[str] = mapped_column(ForeignKey("loans.id"), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    external_posting_id: Mapped[str] = mapped_column(String(255), nullable=False)
    payout_reference: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    state: Mapped[LenderPostingState] = mapped_column(
        Enum(LenderPostingState, name="lender_posting_state"), nullable=False
    )
    posted_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ReconciliationRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """§14: compares both sides and preserves both source records. A
    mismatch is never "fixed" by overwriting either side."""

    __tablename__ = "reconciliation_records"

    correlation_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    payout_id: Mapped[str] = mapped_column(ForeignKey("payouts.id"), nullable=False)
    posting_id: Mapped[str | None] = mapped_column(ForeignKey("lender_postings.id"), nullable=True)
    state: Mapped[ReconciliationState] = mapped_column(
        Enum(ReconciliationState, name="reconciliation_state"), nullable=False
    )
    insurer_amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    lender_amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    difference_reason: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    reconciled_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ExceptionCase(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """§10.2 EXCEPTION_OPEN → MANUAL_REVIEW. Invalid or conflicting data
    creates one of these; it never disappears silently (§6.5, §13)."""

    __tablename__ = "exception_cases"

    correlation_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    case_reference: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(String(512), nullable=False)
    detail: Mapped[str] = mapped_column(String(2048), nullable=False)
    state: Mapped[ExceptionState] = mapped_column(Enum(ExceptionState, name="exception_state"), nullable=False)
    opened_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolution_method: Mapped[str | None] = mapped_column(String(512), nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resolved_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
