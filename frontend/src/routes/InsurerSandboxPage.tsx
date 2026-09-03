import { useCallback, useEffect, useState } from 'react'
import {
  CanonicalStateBadge,
  DataClassificationBadge,
  DemoDataBadge,
} from '../components/data-integrity/Badges'
import { useAuth } from '../features/auth/useAuth'
import { api } from '../services/api'
import type {
  InsurerDecision,
  InsurerDecisionOutcome,
  InsurerRequest,
  TriggerEvaluationDetail,
} from '../services/types'

const DECISIONS: InsurerDecisionOutcome[] = ['APPROVED', 'REJECTED', 'NEEDS_MORE_DATA']
const MIN_REASON_LENGTH = 12

export function InsurerSandboxPage() {
  const { user } = useAuth()
  const [request, setRequest] = useState<InsurerRequest | null>(null)
  const [evidence, setEvidence] = useState<TriggerEvaluationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [decision, setDecision] = useState<InsurerDecisionOutcome | null>(null)
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('40000.00')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recorded, setRecorded] = useState<InsurerDecision | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const requests = await api.listInsurerRequests()
      if (requests.length === 0) {
        setRequest(null)
        setEvidence(null)
        return
      }
      const latest = requests[requests.length - 1]
      setRequest(latest)
      setEvidence(await api.getTriggerEvaluation(latest.evaluation_id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load insurer requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const needsAmount = decision === 'APPROVED'
  const canSubmit =
    request !== null &&
    decision !== null &&
    reason.trim().length >= MIN_REASON_LENGTH &&
    confirmed &&
    (!needsAmount || Number(amount) > 0)

  async function submitDecision() {
    if (request === null || decision === null) return
    setSubmitting(true)
    setError(null)
    try {
      setRecorded(
        await api.recordInsurerDecision(request.id, {
          outcome: decision,
          reason: reason.trim(),
          ...(needsAmount ? { approved_amount: amount, currency: 'INR' } : {}),
        }),
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Decision could not be recorded')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="role-hero role-hero--insurer rounded-2xl border border-white/10 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex gap-2">
              <DemoDataBadge />
              <span className="rounded-md border border-violet-300/25 bg-violet-300/8 px-2 py-1 text-[0.62rem] font-bold tracking-[0.12em] text-violet-200">
                INSURER SANDBOX
              </span>
            </div>
            <p className="section-kicker mt-5">Independent decision workspace</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
              Candidate review
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Review the evidence packet and record a sandbox decision. MonsoonCover presents the
              packet but cannot make this decision.
            </p>
          </div>
          <CanonicalStateBadge state={recorded?.outcome ?? 'PENDING'} />
        </div>
      </header>

      {user && user.role !== 'insurer' && user.role !== 'admin' ? (
        <section className="rounded-2xl border border-amber/25 bg-amber/7 p-5" role="note">
          <p className="text-sm font-semibold text-amber">
            You are signed in as “{user.role}”, not the insurer
          </p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">
            You can read this packet, but the server will refuse a decision from your role. Sign in
            as the insurer sandbox account to approve or reject.
          </p>
        </section>
      ) : null}

      {error ? (
        <section role="alert" className="rounded-2xl border border-danger/25 bg-danger/7 p-5">
          <p className="text-sm font-semibold text-danger">Decision not recorded</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{error}</p>
        </section>
      ) : null}

      {recorded ? (
        <section className="rounded-2xl border border-teal/25 bg-teal/7 p-6" role="status">
          <p className="font-semibold text-teal">Sandbox decision recorded: {recorded.outcome}</p>
          <p className="mt-2 text-sm text-slate-400">
            Decided by {recorded.decided_by}
            {recorded.approved_amount ? ` · ${recorded.approved_amount} ${recorded.currency}` : ''}
          </p>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">{recorded.reason}</p>
        </section>
      ) : null}

      {loading ? (
        <div role="status" aria-label="Loading candidate" className="surface-card h-56 animate-pulse" />
      ) : null}

      {!loading && !request ? (
        <section className="surface-card p-8 text-center">
          <p className="text-sm font-medium text-slate-300">No candidate awaiting review</p>
          <p className="mt-2 text-xs text-slate-500">
            A lender must run a replay and submit a trigger candidate before it appears here.
          </p>
        </section>
      ) : null}

      {request && evidence ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="surface-card p-5 sm:p-6" aria-labelledby="insurer-evidence-heading">
            <div className="flex justify-between gap-3">
              <div>
                <p className="section-kicker">{request.external_request_id}</p>
                <h2 id="insurer-evidence-heading" className="section-title">
                  Evidence packet
                </h2>
              </div>
              <CanonicalStateBadge state={evidence.outcome} />
            </div>

            <div className="mt-5 rounded-xl border border-amber/20 bg-amber/6 p-4">
              <p className="text-sm font-semibold text-amber">Candidate—not an approved claim</p>
              <p className="mt-1.5 text-xs leading-5 text-amber/75">
                The deterministic comparison reached its configured threshold. Independent review
                remains mandatory.
              </p>
            </div>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {(
                [
                  ['Correlation', evidence.correlation_id, 'DERIVED'],
                  ['Observation', `${evidence.observed_value} ${evidence.normalized_unit}`, 'DERIVED'],
                  ['Demo threshold', `${evidence.strike_threshold} ${evidence.normalized_unit}`, 'SIMULATED'],
                  ['Window', `${evidence.window_start_local} → ${evidence.window_end_local}`, 'SIMULATED'],
                  ['Eligible observations', String(evidence.observation_count), 'DERIVED'],
                  ['Engine version', evidence.evaluation_version, 'DERIVED'],
                ] as const
              ).map(([label, value, classification]) => (
                <div key={label}>
                  <dt className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{label}</span>
                    <DataClassificationBadge classification={classification} />
                  </dt>
                  <dd className="mt-2 font-mono text-sm font-semibold text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 rounded-xl border border-white/7 bg-deep/50 p-4">
              <p className="text-xs font-semibold text-slate-400">Calculation trace</p>
              <ol className="mt-3 space-y-2">
                {evidence.trace_steps.map((step) => (
                  <li key={step.step} className="text-xs leading-5 text-slate-500">
                    <span className="font-mono text-[0.62rem] uppercase text-cyan">{step.step}</span>{' '}
                    {step.description}
                  </li>
                ))}
              </ol>
              <p className="mt-3 break-all font-mono text-[0.6rem] text-slate-600">
                digest {evidence.inputs_digest}
              </p>
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6" aria-labelledby="decision-panel-heading">
            <p className="section-kicker">Authorized insurer action</p>
            <h2 id="decision-panel-heading" className="section-title">
              Record decision
            </h2>

            <fieldset className="mt-5" disabled={recorded !== null}>
              <legend className="text-xs font-semibold text-slate-400">Decision outcome</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {DECISIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={decision === option}
                    onClick={() => setDecision(option)}
                    className={`rounded-lg border px-3 py-3 text-[0.68rem] font-bold transition-colors ${
                      decision === option
                        ? 'border-cyan/45 bg-cyan/12 text-cyan'
                        : 'border-white/8 bg-deep/50 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {option.replaceAll('_', ' ')}
                  </button>
                ))}
              </div>
            </fieldset>

            {needsAmount ? (
              <label className="mt-5 block">
                <span className="text-xs font-semibold text-slate-400">
                  Approved amount (INR) <span className="text-danger">required</span>
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  disabled={recorded !== null}
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-deep/65 px-3 font-mono text-sm text-slate-200 outline-none focus:border-cyan/50"
                />
              </label>
            ) : null}

            <label className="mt-5 block">
              <span className="text-xs font-semibold text-slate-400">
                Decision reason <span className="text-danger">required</span>
              </span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={recorded !== null}
                rows={4}
                placeholder="Provide a clear evidence-based reason…"
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-deep/65 p-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan/50"
              />
              <span className="mt-1 block text-[0.65rem] text-slate-600">
                Minimum {MIN_REASON_LENGTH} characters. Stored on the decision record and the audit
                trail.
              </span>
            </label>

            <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/7 bg-deep/45 p-4">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={recorded !== null}
                className="mt-0.5 accent-cyan"
              />
              <span className="text-xs leading-5 text-slate-400">
                I confirm this is an independent insurer-sandbox decision and understand it is not a
                real claim action.
              </span>
            </label>

            <button
              type="button"
              disabled={!canSubmit || submitting || recorded !== null}
              onClick={submitDecision}
              className="mt-4 w-full rounded-xl bg-cyan px-4 py-3 text-sm font-bold text-deep transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            >
              {submitting ? 'Recording…' : 'Submit sandbox decision'}
            </button>
          </section>
        </div>
      ) : null}
    </div>
  )
}
