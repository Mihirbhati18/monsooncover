import { useState } from 'react'
import { CanonicalStateBadge, DataClassificationBadge } from '../data-integrity/Badges'
import { api } from '../../services/api'
import type { DryRunResult } from '../../services/types'

const PRESETS = [
  {
    label: 'The 27–28 Aug event',
    detail: 'The two-day window the accepted policy uses',
    values: { start: '2026-08-27', end: '2026-08-28', strike: '160.0', near: '128.0' },
  },
  {
    label: 'A quiet July',
    detail: 'Same engine, same dataset, ordinary rainfall',
    values: { start: '2026-07-01', end: '2026-07-31', strike: '160.0', near: '128.0' },
  },
  {
    label: 'Heaviest day, lower band',
    detail: '27 Aug alone against a 100 mm near-trigger band',
    values: { start: '2026-08-27', end: '2026-08-27', strike: '160.0', near: '100.0' },
  },
] as const

const outcomeTone: Record<string, string> = {
  TRIGGER_CANDIDATE: 'text-amber',
  NEAR_TRIGGER: 'text-cyan',
  NO_TRIGGER: 'text-teal',
}

export function DryRunPanel() {
  const [start, setStart] = useState('2026-08-27')
  const [end, setEnd] = useState('2026-08-28')
  const [strike, setStrike] = useState('160.0')
  const [near, setNear] = useState('128.0')
  const [result, setResult] = useState<DryRunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(values?: { start: string; end: string; strike: string; near: string }) {
    const payload = values ?? { start, end, strike, near }
    if (values) {
      setStart(values.start)
      setEnd(values.end)
      setStrike(values.strike)
      setNear(values.near)
    }

    setRunning(true)
    setError(null)
    try {
      setResult(
        await api.runDryRun({
          event_window_start_local: payload.start,
          event_window_end_local: payload.end,
          strike_threshold: payload.strike,
          near_trigger_threshold: payload.near,
        }),
      )
    } catch (caught) {
      setResult(null)
      setError(caught instanceof Error ? caught.message : 'Dry run failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="dry-run-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-kicker">Configuration validation</p>
          <h2 id="dry-run-heading" className="section-title">
            Dry run
          </h2>
        </div>
        <DataClassificationBadge classification="DERIVED" />
      </div>

      <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
        Evaluate a proposed configuration against the stored history using the same engine that
        produces real candidates. A dry run writes nothing — no evaluation, no trace, not even an
        audit row — so it can be re-run freely.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => run(preset.values)}
            disabled={running}
            title={preset.detail}
            className="rounded-lg border border-white/10 bg-deep/60 px-3 py-2 text-[0.68rem] font-semibold text-slate-300 transition-colors hover:border-cyan/40 hover:text-cyan disabled:opacity-40"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {(
          [
            ['Window from', start, setStart, 'text'],
            ['Window to', end, setEnd, 'text'],
            ['Strike (mm)', strike, setStrike, 'text'],
            ['Near band (mm)', near, setNear, 'text'],
          ] as const
        ).map(([label, value, setter]) => (
          <label key={label} className="block">
            <span className="text-[0.65rem] font-semibold text-slate-400">{label}</span>
            <input
              type="text"
              value={value}
              onChange={(event) => setter(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-deep/65 px-3 font-mono text-xs text-slate-200 outline-none focus:border-cyan/50"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() => run()}
        disabled={running}
        className="mt-4 rounded-xl border border-cyan/35 bg-cyan/12 px-4 py-2.5 text-sm font-bold text-cyan transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {running ? 'Evaluating…' : 'Run dry run'}
      </button>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger/8 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-5 rounded-xl border border-white/8 bg-deep/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CanonicalStateBadge state={result.outcome} />
              <span className={`font-mono text-lg font-semibold ${outcomeTone[result.outcome] ?? 'text-slate-200'}`}>
                {result.observed_value} {result.normalized_unit}
              </span>
            </div>
            <span className="rounded-md border border-teal/25 bg-teal/8 px-2 py-1 text-[0.62rem] font-bold text-teal">
              NOTHING PERSISTED
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            {result.eligible_observation_count} eligible observation(s),{' '}
            {result.excluded_observation_count} excluded, over{' '}
            <span className="font-mono">{result.window_start_local}</span> to{' '}
            <span className="font-mono">{result.window_end_local}</span>. Strike{' '}
            {result.strike_threshold}, near band {result.near_trigger_threshold}.
          </p>

          <ol className="mt-4 space-y-2">
            {result.trace_steps.map((step) => (
              <li key={step.step} className="text-[0.68rem] leading-5 text-slate-500">
                <span className="font-mono text-[0.62rem] uppercase text-cyan">{step.step}</span>{' '}
                {step.description}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
