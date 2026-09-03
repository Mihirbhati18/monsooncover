from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EvidenceRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_id: str
    subject_type: str
    subject_field: str
    value_or_claim: str
    classification: str
    source_title: str | None
    source_organization: str | None
    source_type: str | None
    source_url_or_local_path: str | None
    publication_or_effective_date: str | None
    accessed_or_verified_at: str | None
    geographic_scope: str | None
    applicability_scope: str | None
    units: str | None
    transformation_or_formula: str | None
    simulation_reason: str | None
    checksum_sha256: str | None
    used_by: str | None
    review_status: str
    reviewer: str | None
    notes: str | None
    registered_at_utc: datetime


class EvidenceRecordCreate(BaseModel):
    evidence_id: str = Field(min_length=1, max_length=64)
    subject_type: str = Field(min_length=1, max_length=128)
    subject_field: str = Field(min_length=1, max_length=128)
    value_or_claim: str = Field(min_length=1, max_length=1024)
    classification: str = Field(pattern="^(REAL|DERIVED|SIMULATED)$")
    source_title: str | None = None
    source_organization: str | None = None
    source_type: str | None = None
    source_url_or_local_path: str | None = None
    publication_or_effective_date: str | None = None
    accessed_or_verified_at: str | None = None
    geographic_scope: str | None = None
    applicability_scope: str | None = None
    units: str | None = None
    transformation_or_formula: str | None = None
    simulation_reason: str | None = None
    checksum_sha256: str | None = None
    used_by: str | None = None
    review_status: str = "DRAFT"
    reviewer: str | None = None
    notes: str | None = None


class ActivationGateRead(BaseModel):
    """§4.3: missing evidence is a blocking validation error, never a
    warning that can be ignored."""

    product_code: str
    can_activate: bool
    summary: str
    satisfied_fields: list[str]
    blocking_errors: list[str]
