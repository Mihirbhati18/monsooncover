from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.settlement import (
    ExceptionState,
    InsurerDecisionOutcome,
    LenderPostingState,
    PayoutState,
    ReconciliationState,
)
from app.models.trigger import TriggerOutcome


class TraceStep(BaseModel):
    step: str
    description: str
    value: object | None = None


class TriggerEvaluationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evaluation_key: str
    correlation_id: str
    outcome: TriggerOutcome
    observed_value: Decimal
    strike_threshold: Decimal
    normalized_unit: str
    window_start_local: str
    window_end_local: str
    evaluation_version: str
    evaluated_at_utc: datetime


class TriggerEvaluationDetail(TriggerEvaluationRead):
    trace_steps: list[TraceStep]
    inputs_digest: str
    observation_count: int


class ReplayRequest(BaseModel):
    snapshot_reference: str
    correlation_id: str = Field(min_length=3, max_length=255)


class InsurerRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    external_request_id: str
    correlation_id: str
    evaluation_id: str
    submitted_at_utc: datetime
    adapter_name: str


class InsurerDecisionCreate(BaseModel):
    """A decision reason is mandatory (MONSOONCOVER_SPEC.md §15.3)."""

    outcome: InsurerDecisionOutcome
    reason: str = Field(min_length=12, max_length=1024)
    approved_amount: Decimal | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)


class InsurerDecisionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    correlation_id: str
    outcome: InsurerDecisionOutcome
    reason: str
    decided_by: str
    decided_at_utc: datetime
    approved_amount: Decimal | None
    currency: str | None


class ExceptionCaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    correlation_id: str
    case_reference: str
    entity_type: str
    entity_id: str
    summary: str
    detail: str
    state: ExceptionState
    opened_at_utc: datetime


class PayoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    correlation_id: str
    payout_reference: str
    amount: Decimal
    currency: str
    state: PayoutState


class LenderPostingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    correlation_id: str
    external_posting_id: str
    payout_reference: str
    amount: Decimal
    currency: str
    state: LenderPostingState


class ReconciliationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    correlation_id: str
    state: ReconciliationState
    insurer_amount: Decimal | None
    lender_amount: Decimal | None
    difference_reason: str | None


class AuditEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    correlation_id: str
    event_type: str
    actor_type: str
    actor_id: str
    occurred_at_utc: datetime
    entity_type: str
    entity_id: str
    previous_state: str | None
    new_state: str | None
    reason: str | None
    classification: str
