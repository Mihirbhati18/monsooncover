from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.risk import ExposureBand


class MethodologyStep(BaseModel):
    step: str
    description: str
    value: object | None = None


class RiskAssessmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    borrower_id: str
    zone_id: str
    peril: str
    sector: str
    exposure_band: ExposureBand
    max_daily_value: Decimal
    total_value: Decimal
    heavy_day_count: int
    observation_count: int
    normalized_unit: str
    methodology_version: str
    methodology_steps: list[MethodologyStep]
    dataset_code: str
    assessed_at_utc: datetime
    classification: str


class EligibilityReason(BaseModel):
    constraint: str
    satisfied: bool
    detail: str


class PolicyEligibilityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    borrower_id: str
    policy_version_id: str
    is_eligible: bool
    reasons: list[EligibilityReason]
    matching_version: str
    evaluated_at_utc: datetime


class EligibilityRequest(BaseModel):
    product_code: str = Field(default="MC-DEMO-POL-RAIN-01")
    requested_peril: str = Field(default="EXTREME_RAINFALL")
    cover_start_local: str = Field(default="2026-06-15")
    cover_end_local: str = Field(default="2026-09-30")
