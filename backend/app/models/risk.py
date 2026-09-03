import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class ExposureBand(str, enum.Enum):
    """Risk Engine output (MONSOONCOVER_SPEC.md §7.1): an interpretable
    exposure label, never a credit decision or a price."""

    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"


class RiskAssessment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """How exposed is this MSME/location to a peril (§7.1)?

    This answers exposure only. It must not approve or deny a loan, set an
    insurance price, or decide a claim, and a band here never by itself
    creates policy eligibility — that is the separate engine in §7.2.
    """

    __tablename__ = "risk_assessments"

    borrower_id: Mapped[str] = mapped_column(ForeignKey("borrowers.id"), nullable=False)
    zone_id: Mapped[str] = mapped_column(String(128), nullable=False)
    peril: Mapped[str] = mapped_column(String(64), nullable=False)
    sector: Mapped[str] = mapped_column(String(255), nullable=False)

    exposure_band: Mapped[ExposureBand] = mapped_column(Enum(ExposureBand, name="exposure_band"), nullable=False)
    max_daily_value: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    total_value: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    heavy_day_count: Mapped[int] = mapped_column(nullable=False)
    observation_count: Mapped[int] = mapped_column(nullable=False)
    normalized_unit: Mapped[str] = mapped_column(String(32), nullable=False)

    methodology_version: Mapped[str] = mapped_column(String(64), nullable=False)
    methodology_steps: Mapped[list] = mapped_column(JSON, nullable=False)
    dataset_code: Mapped[str] = mapped_column(String(128), nullable=False)
    assessed_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # DERIVED: reproducibly calculated from documented observations (§4).
    classification: Mapped[str] = mapped_column(String(32), nullable=False)


class PolicyEligibility(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Is an approved/reference product applicable to this borrower, peril,
    geography and period (MONSOONCOVER_SPEC.md §7.2)?

    Matching is against explicit policy constraints only. `reasons` records
    every constraint that was checked and how it resolved, so an ineligible
    result is explainable rather than a bare false."""

    __tablename__ = "policy_eligibilities"
    __table_args__ = (
        UniqueConstraint("borrower_id", "policy_version_id", name="uq_eligibility_borrower_policy"),
    )

    borrower_id: Mapped[str] = mapped_column(ForeignKey("borrowers.id"), nullable=False)
    policy_version_id: Mapped[str] = mapped_column(ForeignKey("policy_versions.id"), nullable=False)

    is_eligible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reasons: Mapped[list] = mapped_column(JSON, nullable=False)
    matching_version: Mapped[str] = mapped_column(String(64), nullable=False)
    evaluated_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
