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

export type DryRunResult = {
  outcome: TriggerOutcome
  observed_value: string
  strike_threshold: string
  near_trigger_threshold: string
  normalized_unit: string
  window_start_local: string
  window_end_local: string
  eligible_observation_count: number
  excluded_observation_count: number
  inputs_digest: string
  trace_steps: TraceStep[]
  persisted: boolean
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

export type Loan = {
  id: string
  borrower_id: string
  loan_type: string
  principal_amount: string
  emi_amount: string
  outstanding_amount: string
  currency: string
}

export type PolicyVersion = {
  id: string
  product_code: string
  version: string
  display_name: string
  trigger_rule: Record<string, string>
  disclosure_version: string
  classification: DataClassification
}

export type PolicySnapshot = {
  id: string
  snapshot_reference: string
  borrower_id: string
  loan_id: string
  policy_version_id: string
  trigger_rule_snapshot: Record<string, string>
  disclosure_version: string
  consent_recorded_at_utc: string
  accepted_at_utc: string
  snapshot_checksum: string
  state: 'PENDING_ISSUANCE' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED'
}

export type ClimateDataset = {
  id: string
  dataset_code: string
  source_organization: string
  source_uri_or_document: string
  original_filename: string
  geographic_coverage: string
  temporal_coverage: string
  parameter_definitions: string
  original_sha256: string
  transformation_version: string
  known_gaps_or_caveats: string | null
  license_notes: string | null
  source_classification: DataClassification
}

export type EvidenceRecord = {
  id: string
  evidence_id: string
  subject_type: string
  subject_field: string
  value_or_claim: string
  classification: DataClassification
  source_title: string | null
  source_organization: string | null
  source_url_or_local_path: string | null
  simulation_reason: string | null
  transformation_or_formula: string | null
  units: string | null
  geographic_scope: string | null
  checksum_sha256: string | null
  used_by: string | null
  review_status: string
  reviewer: string | null
  notes: string | null
  registered_at_utc: string
}

export type ActivationGate = {
  product_code: string
  can_activate: boolean
  summary: string
  satisfied_fields: string[]
  blocking_errors: string[]
}

export type ExposureBand = 'LOW' | 'MODERATE' | 'HIGH'

export type MethodologyStep = {
  step: string
  description: string
  value: unknown
}

export type RiskAssessment = {
  id: string
  borrower_id: string
  zone_id: string
  peril: string
  sector: string
  exposure_band: ExposureBand
  max_daily_value: string
  total_value: string
  heavy_day_count: number
  observation_count: number
  normalized_unit: string
  methodology_version: string
  methodology_steps: MethodologyStep[]
  dataset_code: string
  assessed_at_utc: string
  classification: DataClassification
}

export type EligibilityReason = {
  constraint: string
  satisfied: boolean
  detail: string
}

export type PolicyEligibility = {
  id: string
  borrower_id: string
  policy_version_id: string
  is_eligible: boolean
  reasons: EligibilityReason[]
  matching_version: string
  evaluated_at_utc: string
}

export type Borrower = {
  id: string
  name: string
  sector: string
  city: string
  state: string
  zone_id: string
  latitude: string | null
  longitude: string | null
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
