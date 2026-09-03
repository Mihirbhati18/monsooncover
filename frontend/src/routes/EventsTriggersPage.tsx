import { useCallback, useEffect, useState } from 'react'
import { CanonicalStateBadge, DataClassificationBadge } from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { PageIntro } from '../components/foundation/PageIntro'
import { GlassSurface } from '../visuals/glass/GlassSurface'
import { api } from '../services/api'
import type { TriggerEvaluationDetail } from '../services/types'

const SNAPSHOT_REFERENCE = 'MC-PS-2026-0142-v1'
const CORRELATION_ID = 'EVENT-MC-2026-00427'

const outcomeCopy: Record<string, string> = {
  TRIGGER_CANDIDATE:
    'The deterministic comparison reached candidate status. MonsoonCover has not approved a claim, initiated a payout, or instructed lender posting.',
  NEAR_TRIGGER:
    'Observed values are inside the near-trigger band but below the strike. No insurer submission is created.',
  NO_TRIGGER: 'Observed values are below the near-trigger band. No insurer submission is created.',
}

export function EventsTriggersPage() {
  const [evaluation, setEvaluation] = useState<TriggerEvaluationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLatest = useCallback(async () => {
    setError(null)
    try {
      const evaluations = await api.listTriggerEvaluations()
      if (evaluations.length === 0) {
        setEvaluation(null)
        return
      }
      setEvaluation(await api.getTriggerEvaluation(evaluations[evaluations.length - 1].id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load trigger evaluations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLatest()
  }, [loadLatest])

  async function runReplay() {
    setRunning(true)
    setError(null)
    try {
      setEvaluation(await api.runReplay(SNAPSHOT_REFERENCE, CORRELATION_ID))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Replay failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Deterministic workflow evidence"
        title="Events & triggers"
        description="Replay the frozen historical dataset through the trigger engine and inspect the calculation trace. A trigger candidate only starts insurer review—it never constitutes approval."
        classification="DERIVED"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runReplay}
          disabled={running}
          className="rounded-xl bg-cyan px-4 py-2.5 text-sm font-bold text-deep transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? 'Replaying…' : 'Replay historical climate event'}
        </button>
        <p className="text-xs text-slate-500">
          Runs the real engine over the checksummed dataset. Repeat runs return the same
          evaluation.
        </p>
      </div>

      {error ? (
        <section role="alert" className="rounded-2xl border border-danger/25 bg-danger/7 p-5">
          <p className="text-sm font-semibold text-danger">Could not reach the trigger engine</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{error}</p>
          <p className="mt-2 text-xs text-slate-600">
            Start the backend with <code className="font-mono">uvicorn app.main:app</code> and seed it
            with <code className="font-mono">python -m scripts.seed_demo</code>.
          </p>
        </section>
      ) : null}

      {loading ? (
        <div role="status" aria-label="Loading trigger evaluations" className="surface-card h-40 animate-pulse" />
      ) : null}

      {!loading && !evaluation && !error ? (
        <section className="surface-card p-8 text-center">
          <p className="text-sm font-medium text-slate-300">No evaluation has been run yet</p>
          <p className="mt-2 text-xs text-slate-500">
            Use “Replay historical climate event” to compute one from the frozen dataset.
          </p>
        </section>
      ) : null}

      {evaluation ? (
        <>
          <GlassSurface
            as="section"
            tint={evaluation.outcome === 'TRIGGER_CANDIDATE' ? 'amber' : 'neutral'}
            className="rounded-2xl p-5 sm:p-6"
            aria-labelledby="candidate-alert-heading"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="section-kicker text-amber/60">Event · {evaluation.correlation_id}</p>
                <h2 id="candidate-alert-heading" className="mt-2 text-xl font-semibold text-amber">
                  {evaluation.outcome === 'TRIGGER_CANDIDATE' ? 'Insurer review required' : 'No insurer review required'}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-amber/75">
                  {outcomeCopy[evaluation.outcome]}
                </p>
              </div>
              <CanonicalStateBadge state={evaluation.outcome} />
            </div>
          </GlassSurface>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="surface-card overflow-hidden" aria-labelledby="trace-heading">
              <div className="border-b border-white/7 p-5 sm:p-6">
                <p className="section-kicker">Explainable calculation</p>
                <h2 id="trace-heading" className="section-title">
                  Calculation trace
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  Produced by engine {evaluation.evaluation_version}. Digest{' '}
                  <span className="font-mono">{evaluation.inputs_digest.slice(0, 16)}…</span>
                </p>
              </div>
              <ol className="divide-y divide-white/6">
                {evaluation.trace_steps.map((step, index) => (
                  <li key={step.step} className="grid grid-cols-[2rem_1fr] gap-3 px-5 py-4 sm:px-6">
                    <span className="font-mono text-[0.65rem] text-slate-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="font-mono text-[0.68rem] uppercase tracking-wider text-cyan">{step.step}</p>
                      <p className="mt-1.5 text-xs leading-5 text-slate-400">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="surface-card p-5 sm:p-6" aria-labelledby="measurement-heading">
              <p className="section-kicker">Measured against the accepted snapshot</p>
              <h2 id="measurement-heading" className="section-title">
                Observation vs threshold
              </h2>
              <dl className="mt-6 space-y-4">
                {[
                  ['Observed', `${evaluation.observed_value} ${evaluation.normalized_unit}`, 'DERIVED'],
                  ['Strike threshold', `${evaluation.strike_threshold} ${evaluation.normalized_unit}`, 'SIMULATED'],
                  ['Window', `${evaluation.window_start_local} → ${evaluation.window_end_local}`, 'SIMULATED'],
                  ['Eligible observations', String(evaluation.observation_count), 'DERIVED'],
                ].map(([label, value, classification]) => (
                  <div key={label} className="flex items-center justify-between gap-4 border-b border-white/6 pb-3 last:border-0">
                    <dt className="flex items-center gap-2 text-xs text-slate-500">
                      {label}
                      <DataClassificationBadge classification={classification as 'REAL' | 'DERIVED' | 'SIMULATED'} />
                    </dt>
                    <dd className="font-mono text-sm font-semibold text-slate-200">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 rounded-xl border border-cyan/15 bg-cyan/5 p-4">
                <p className="text-xs font-semibold text-cyan">Evaluation key</p>
                <p className="mt-1.5 break-all font-mono text-[0.62rem] leading-5 text-slate-500">
                  {evaluation.evaluation_key}
                </p>
              </div>
            </section>
          </div>
        </>
      ) : null}

      <section className="surface-card p-5 sm:p-6" aria-labelledby="event-source-heading">
        <p className="section-kicker">Evidence packet</p>
        <h2 id="event-source-heading" className="section-title">
          Candidate provenance
        </h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference
            classification="SIMULATED"
            label="Historical observation fixture"
            detail="Synthetic rainfall dataset DS-MC-RAIN-2026-01, checksum-verified before every replay. Not agency observation data."
          />
          <SourceReference
            classification="DERIVED"
            label="Rainfall aggregation"
            detail="Computed by the trigger engine from verified reference observations, with the window and unit shown in the trace."
          />
          <SourceReference
            classification="SIMULATED"
            label="Trigger threshold"
            detail="Demo configuration held in the immutable accepted policy snapshot, not an authorized insurer term."
          />
        </div>
      </section>
    </div>
  )
}
