/**
 * Typed client for the MonsoonCover backend.
 *
 * Visual components must not talk to services directly (FRONTEND_PLAN.md
 * §11) — routes and feature modules call these functions and pass typed
 * data down.
 */

import type {
  AuditEvent,
  CurrentUser,
  InsurerDecision,
  InsurerDecisionOutcome,
  InsurerRequest,
  LenderPosting,
  Payout,
  ReconciliationRecord,
  TriggerEvaluation,
  TriggerEvaluationDetail,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const TOKEN_STORAGE_KEY = 'monsooncover.access_token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string | null): void {
  try {
    if (token === null) localStorage.removeItem(TOKEN_STORAGE_KEY)
    else localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // A blocked storage API must not break the session in progress.
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (typeof body?.detail === 'string') detail = body.detail
      else if (Array.isArray(body?.detail) && body.detail[0]?.msg) detail = body.detail[0].msg
    } catch {
      // Keep the status-based message.
    }
    throw new ApiError(detail, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function login(email: string, password: string): Promise<string> {
  const body = new URLSearchParams({ username: email, password })
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new ApiError(
      response.status === 401 ? 'Incorrect email or password' : 'Sign-in failed',
      response.status,
    )
  }

  const { access_token } = (await response.json()) as { access_token: string }
  return access_token
}

export const api = {
  getCurrentUser: () => request<CurrentUser>('/api/v1/auth/me'),

  listTriggerEvaluations: () => request<TriggerEvaluation[]>('/api/v1/triggers'),

  getTriggerEvaluation: (id: string) => request<TriggerEvaluationDetail>(`/api/v1/triggers/${id}`),

  runReplay: (snapshotReference: string, correlationId: string) =>
    request<TriggerEvaluationDetail>('/api/v1/triggers/replay', {
      method: 'POST',
      body: JSON.stringify({ snapshot_reference: snapshotReference, correlation_id: correlationId }),
    }),

  listInsurerRequests: () => request<InsurerRequest[]>('/api/v1/settlement/insurer-requests'),

  submitToInsurer: (evaluationId: string) =>
    request<InsurerRequest>(`/api/v1/settlement/insurer-requests/${evaluationId}`, { method: 'POST' }),

  recordInsurerDecision: (
    requestId: string,
    payload: {
      outcome: InsurerDecisionOutcome
      reason: string
      approved_amount?: string
      currency?: string
    },
  ) =>
    request<InsurerDecision>(`/api/v1/settlement/insurer-requests/${requestId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createPayout: (decisionId: string) =>
    request<Payout>(`/api/v1/settlement/payouts/${decisionId}`, { method: 'POST' }),

  listPayouts: () => request<Payout[]>('/api/v1/settlement/payouts'),

  createPosting: (payoutId: string) =>
    request<LenderPosting>(`/api/v1/settlement/postings/${payoutId}`, { method: 'POST' }),

  listPostings: () => request<LenderPosting[]>('/api/v1/settlement/postings'),

  runReconciliation: (payoutId: string) =>
    request<ReconciliationRecord>(`/api/v1/settlement/reconciliations/${payoutId}`, { method: 'POST' }),

  listReconciliations: () => request<ReconciliationRecord[]>('/api/v1/settlement/reconciliations'),

  listAuditEvents: (correlationId?: string) =>
    request<AuditEvent[]>(
      correlationId ? `/api/v1/audit?correlation_id=${encodeURIComponent(correlationId)}` : '/api/v1/audit',
    ),
}
