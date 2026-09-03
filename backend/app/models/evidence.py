from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class EvidenceRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One entry in the Evidence Registry (MONSOONCOVER_SPEC.md §4.4).

    Field names follow the specification's required registry fields exactly,
    so `evidence/evidence_registry.csv` and this table stay in step. §4.5
    requires the database to preserve full provenance even where a demo
    screen shows only a concise badge.
    """

    __tablename__ = "evidence_records"

    evidence_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    subject_type: Mapped[str] = mapped_column(String(128), nullable=False)
    subject_field: Mapped[str] = mapped_column(String(128), nullable=False)
    value_or_claim: Mapped[str] = mapped_column(String(1024), nullable=False)

    # REAL | DERIVED | SIMULATED (§4.2)
    classification: Mapped[str] = mapped_column(String(32), nullable=False)

    source_title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    source_organization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    source_url_or_local_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    publication_or_effective_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    accessed_or_verified_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    geographic_scope: Mapped[str | None] = mapped_column(String(255), nullable=True)
    applicability_scope: Mapped[str | None] = mapped_column(String(512), nullable=True)
    units: Mapped[str | None] = mapped_column(String(64), nullable=True)
    transformation_or_formula: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # §4.1: anything unavailable in reality must be simulated transparently.
    # A SIMULATED record without a reason is treated as incomplete evidence.
    simulation_reason: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    checksum_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    used_by: Mapped[str | None] = mapped_column(String(512), nullable=True)
    review_status: Mapped[str] = mapped_column(String(64), nullable=False, default="DRAFT")
    reviewer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    registered_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
