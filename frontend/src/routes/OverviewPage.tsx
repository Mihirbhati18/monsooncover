import {
  CanonicalStateBadge,
  DataClassificationBadge,
  DemoDataBadge,
  type DataClassification,
} from '../components/data-integrity/Badges'
import { useEffect, useState } from 'react'
import { MonsoonMark } from '../visuals/MonsoonMark'
import { LiquidWeatherCanvas } from '../visuals/LiquidWeatherCanvas'
import { GlassSurface } from '../visuals/glass/GlassSurface'
import { api } from '../services/api'
import type { TriggerEvaluation } from '../services/types'

const formatInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const workflow = [
  {
    number: '01',
    title: 'Insurer review',
    state: 'PENDING',
    copy: 'The licensed insurer or insurer sandbox independently approves, rejects, or asks for more data.',
  },
  {
    number: '02',
    title: 'MonsoonCover orchestration',
    state: 'NOT_STARTED',
    copy: 'Only after approval, MonsoonCover records and routes the authorized illustrative instruction.',
  },
  {
    number: '03',
    title: 'Lender posting',
    state: 'NOT_REQUESTED',
    copy: 'The lender or lender sandbox separately receives and posts the illustrative payment.',
  },
  {
    number: '04',
    title: 'Reconciliation',
    state: 'NOT_READY',
    copy: 'Settlement is complete only when insurer and lender records match.',
  },
]

const classifications: Array<{
  type: DataClassification
  copy: string
}> = [
  { type: 'REAL', copy: 'Directly supported by a registered authoritative source.' },
  { type: 'DERIVED', copy: 'Reproducibly calculated from documented real inputs.' },
  { type: 'SIMULATED', copy: 'Synthetic or illustrative because production access is unavailable.' },
]

export function OverviewPage() {
  const [metrics, setMetrics] = useState<Array<{ label: string; value: string; detail: string }>>([])
  const [candidate, setCandidate] = useState<TriggerEvaluation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.listBorrowers(),
      api.listLoans(),
      api.listTriggerEvaluations(),
      api.listExceptions(),
    ])
      .then(([borrowers, loans, evaluations, exceptions]) => {
        if (cancelled) return
        const outstanding = loans.reduce((total, loan) => total + Number(loan.outstanding_amount), 0)
        const candidates = evaluations.filter((item) => item.outcome === 'TRIGGER_CANDIDATE')
        setCandidate(candidates.at(-1) ?? null)
        setMetrics([
          { label: 'Borrowers', value: String(borrowers.length).padStart(2, '0'), detail: 'Synthetic portfolio records' },
          { label: 'Outstanding', value: formatInr.format(outstanding), detail: 'Across all demo facilities' },
          { label: 'Candidate events', value: String(candidates.length).padStart(2, '0'), detail: 'Awaiting insurer review' },
          { label: 'Open exceptions', value: String(exceptions.filter((e) => e.state === 'OPEN').length).padStart(2, '0'), detail: 'Manual review required' },
        ])
      })
      .catch(() => {
        if (!cancelled) setMetrics([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <section className="hero-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 p-5 sm:p-8 lg:min-h-[27rem]">
        <LiquidWeatherCanvas />
        <div aria-hidden="true" className="hero-grid" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <DemoDataBadge />
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Foundation preview · as of 02 Sep 2026, 23:30 IST
            </span>
          </div>
          <h2 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-5xl">
            Climate protection,
            <span className="hero-gradient-text block">made auditable.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
            A presentation-only command center for synthetic MSME lending scenarios. The
            foundation keeps evidence, insurer decisions, lender actions, and reconciliation
            visibly separate.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <div className="hero-stat"><span>128</span><small>Synthetic MSMEs</small></div>
            <div className="hero-stat"><span>03</span><small>Review candidates</small></div>
            <div className="hero-stat"><span>100%</span><small>Traceable states</small></div>
          </div>
          </div>
          <div className="relative hidden min-h-72 place-items-center lg:grid">
            <MonsoonMark />
            <div className="hero-float-card hero-float-card--top">
              <span className="size-1.5 rounded-full bg-cyan shadow-[0_0_12px_#58d5e8]" />
              Monitoring active
            </div>
            <div className="hero-float-card hero-float-card--bottom">
              <span className="font-mono text-amber">184 mm</span>
              <small>demo observation</small>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="portfolio-snapshot-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Demo portfolio</p>
            <h2 id="portfolio-snapshot-heading" className="section-title">
              Operational snapshot
            </h2>
          </div>
          <p className="hidden text-xs text-slate-500 sm:block">All values are illustrative</p>
        </div>
        {loading ? (
          <div role="status" aria-label="Loading portfolio snapshot" className="h-40 animate-pulse rounded-2xl bg-white/4" />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <GlassSurface as="article" key={metric.label} className="group min-h-40 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-400">{metric.label}</p>
                <DataClassificationBadge classification="DERIVED" />
              </div>
              <p className="mt-5 font-mono text-3xl font-semibold tracking-tight text-white transition-transform duration-300 group-hover:translate-x-1">
                {metric.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{metric.detail}</p>
            </GlassSurface>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section aria-labelledby="candidate-heading" className="surface-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-kicker">
                {candidate ? `Event · ${candidate.correlation_id}` : 'No candidate event'}
              </p>
              <h2 id="candidate-heading" className="section-title">
                {candidate
                  ? 'Trigger candidate requires human review'
                  : 'No trigger candidate awaiting review'}
              </h2>
            </div>
            <CanonicalStateBadge state={candidate?.outcome ?? 'MONITORING'} />
          </div>

          <div className="mt-5 rounded-xl border border-amber/25 bg-amber/7 p-4">
            <p className="font-semibold text-amber">Insurer review is required.</p>
            <p className="mt-1.5 text-sm leading-6 text-amber/75">
              This is not approval. MonsoonCover has only presented an evidence-backed candidate
              for an independent insurer-sandbox decision.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/7 bg-deep/55 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Observed</p>
              <p className="mt-2 font-mono font-medium text-slate-200">
                {candidate
                  ? `${candidate.observed_value} ${candidate.normalized_unit}`
                  : 'Not evaluated'}
              </p>
              <div className="mt-3 flex gap-2">
                <DemoDataBadge />
                <DataClassificationBadge classification="DERIVED" />
              </div>
            </div>
            <div className="rounded-xl border border-white/7 bg-deep/55 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Strike threshold</p>
              <p className="mt-2 font-mono font-medium text-slate-200">
                {candidate
                  ? `${candidate.strike_threshold} ${candidate.normalized_unit}`
                  : 'Run a replay'}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {candidate
                  ? `Computed by ${candidate.evaluation_version} over ${candidate.window_start_local} to ${candidate.window_end_local}.`
                  : 'Run a historical replay from Events & triggers.'}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="workflow-heading" className="surface-card p-5 sm:p-6">
          <p className="section-kicker">Boundary-aware lifecycle</p>
          <h2 id="workflow-heading" className="section-title">
            Distinct responsibility stages
          </h2>
          <ol className="mt-5 space-y-3">
            {workflow.map((step) => (
              <li
                key={step.title}
                className="grid grid-cols-[2rem_1fr] gap-3 rounded-xl border border-white/7 bg-deep/45 p-3.5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-lg border border-white/8 font-mono text-[0.65rem] text-slate-500"
                >
                  {step.number}
                </span>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-200">{step.title}</h3>
                    <CanonicalStateBadge state={step.state} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="classification-heading" className="surface-card p-5 sm:p-6">
        <p className="section-kicker">Data integrity contract</p>
        <h2 id="classification-heading" className="section-title">
          Classification stays visible
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {classifications.map((item) => (
            <article key={item.type} className="rounded-xl border border-white/7 bg-deep/45 p-4">
              <DataClassificationBadge classification={item.type} />
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
