from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.policy import PolicyState


class PolicyVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_code: str
    version: str
    display_name: str
    trigger_rule: dict
    disclosure_version: str
    classification: str


class PolicySnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    snapshot_reference: str
    borrower_id: str
    loan_id: str
    policy_version_id: str
    trigger_rule_snapshot: dict
    disclosure_version: str
    consent_recorded_at_utc: datetime
    accepted_at_utc: datetime
    snapshot_checksum: str
    state: PolicyState


class ClimateDatasetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_code: str
    source_organization: str
    source_uri_or_document: str
    original_filename: str
    geographic_coverage: str
    temporal_coverage: str
    parameter_definitions: str
    original_sha256: str
    transformation_version: str
    known_gaps_or_caveats: str | None
    license_notes: str | None
    source_classification: str
