import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class QualityStatus(str, enum.Enum):
    """Immutable processing stages from MONSOONCOVER_SPEC.md §6.2. Only
    VERIFIED_REFERENCE_DATA may support a settlement-oriented trigger
    candidate (§6.2, final line)."""

    RAW = "RAW"
    NORMALIZED = "NORMALIZED"
    VALIDATED = "VALIDATED"
    VERIFIED_REFERENCE_DATA = "VERIFIED_REFERENCE_DATA"
    REJECTED = "REJECTED"


class ClimateDataset(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A frozen, checksummed historical dataset (MONSOONCOVER_SPEC.md §6.4).
    The principal demo must run from one of these with no internet access."""

    __tablename__ = "climate_datasets"

    dataset_code: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    source_organization: Mapped[str] = mapped_column(String(255), nullable=False)
    source_uri_or_document: Mapped[str] = mapped_column(String(1024), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    accessed_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    geographic_coverage: Mapped[str] = mapped_column(String(512), nullable=False)
    temporal_coverage: Mapped[str] = mapped_column(String(255), nullable=False)
    parameter_definitions: Mapped[str] = mapped_column(String(1024), nullable=False)
    original_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    transformation_version: Mapped[str] = mapped_column(String(64), nullable=False)
    known_gaps_or_caveats: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    license_notes: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # REAL / DERIVED / SIMULATED, per the evidence rules in §4.
    source_classification: Mapped[str] = mapped_column(String(32), nullable=False)


class ClimateObservation(UUIDPrimaryKeyMixin, Base):
    """One observation, retaining the full provenance field set required by
    MONSOONCOVER_SPEC.md §6.3. The (provider, provider_record_id) uniqueness
    constraint enforces the duplicate-ingest rule from §13."""

    __tablename__ = "climate_observations"
    __table_args__ = (
        UniqueConstraint("provider", "provider_record_id", name="uq_observation_provider_record"),
    )

    dataset_id: Mapped[str] = mapped_column(ForeignKey("climate_datasets.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(128), nullable=False)
    provider_record_id: Mapped[str] = mapped_column(String(255), nullable=False)
    source_classification: Mapped[str] = mapped_column(String(32), nullable=False)
    source_uri_or_file: Mapped[str] = mapped_column(String(1024), nullable=False)
    ingested_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    observed_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source_timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    policy_local_date: Mapped[str] = mapped_column(String(10), nullable=False)
    latitude: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    zone_id: Mapped[str] = mapped_column(String(128), nullable=False)
    parameter: Mapped[str] = mapped_column(String(64), nullable=False)
    raw_value: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    raw_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    normalized_value: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    normalized_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    quality_status: Mapped[QualityStatus] = mapped_column(
        Enum(QualityStatus, name="observation_quality_status"), nullable=False
    )
    processing_version: Mapped[str] = mapped_column(String(64), nullable=False)
    checksum_or_source_hash: Mapped[str] = mapped_column(String(128), nullable=False)
