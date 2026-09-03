/**
 * TypeScript mirrors of the backend Pydantic schemas in
 * `backend/app/schemas/`.
 *
 * These are hand-written and therefore CAN DRIFT from the backend. If you
 * change a Pydantic schema, change the matching type here. The backend's
 * OpenAPI document at `GET /openapi.json` is the source of truth; a
 * generator (openapi-typescript) would remove the drift risk and is worth
 * adding once the schema settles.
 */

export type Role = 'lender' | 'insurer' | 'borrower' | 'admin'

export type TriggerOutcome = 'NO_TRIGGER' | 'NEAR_TRIGGER' | 'TRIGGER_CANDIDATE'

export type InsurerDecisionOutcome = 'PENDING' | 'NEEDS_MORE_DATA' | 'APPROVED' | 'REJECTED'

export type ReconciliationState = 'NOT_READY' | 'PENDING' | 'RECONCILED' | 'MISMATCH'

export type DataClassification = 'REAL' | 'DERIVED' | 'SIMULATED'

export type CurrentUser = {
  id: string
  email: string
  display_name: string
  role: Role
  is_active: boolean
}

export type TraceStep = {
  step: string
  description: string
  value: unknown
}

export type TriggerEvaluation = {
  id: string
  evaluation_key: string
  correlation_id: string
  outcome: TriggerOutcome
  observed_value: string
  strike_threshold: string
  normalized_unit: string
  window_start_local: string
  window_end_local: string
  evaluation_version: string
  evaluated_at_utc: string
}

export type TriggerEvaluationDetail = TriggerEvaluation & {
  trace_steps: TraceStep[]
  inputs_digest: string
  observation_count: number
}

export type InsurerRequest = {
  id: string
  external_request_id: string
  correlation_id: string
  evaluation_id: string
  submitted_at_utc: string
  adapter_name: string
}

export type InsurerDecision = {
  id: string
  correlation_id: string
  outcome: InsurerDecisionOutcome
  reason: string
  decided_by: string
  decided_at_utc: string
  approved_amount: string | null
  currency: string | null
}

export type Payout = {
  id: string
  correlation_id: string
  payout_reference: string
  amount: string
  currency: string
  state: 'NOT_APPLICABLE' | 'APPROVED' | 'INITIATED' | 'PAID' | 'FAILED'
}

export type LenderPosting = {
  id: string
  correlation_id: string
  external_posting_id: string
  payout_reference: string
  amount: string
  currency: string
  state: 'NOT_REQUESTED' | 'PENDING' | 'RECEIVED' | 'POSTED' | 'FAILED'
}

export type ReconciliationRecord = {
  id: string
  correlation_id: string
  state: ReconciliationState
  insurer_amount: string | null
  lender_amount: string | null
  difference_reason: string | null
}

export type ExceptionCase = {
  id: string
  correlation_id: string
  case_reference: string
  entity_type: string
  entity_id: string
  summary: string
  detail: string
  state: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CANCELLED'
  opened_at_utc: string
}

export type AuditEvent = {
  id: string
  correlation_id: string
  event_type: string
  actor_type: string
  actor_id: string
  occurred_at_utc: string
  entity_type: string
  entity_id: string
  previous_state: string | null
  new_state: string | null
  reason: string | null
  classification: DataClassification
}
