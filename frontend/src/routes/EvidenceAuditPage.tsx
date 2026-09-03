import { useEffect, useMemo, useState } from 'react'
import { CanonicalStateBadge, DataClassificationBadge, type DataClassification } from '../components/data-integrity/Badges'
import { PageIntro } from '../components/foundation/PageIntro'
import { api } from '../services/api'
import type { AuditEvent, ExceptionCase } from '../services/types'

// Interface fixtures: the backend has no Evidence Registry yet (spec §4).
// These describe what will be registered, not records the system holds.
const evidence: Array<{ id: string; title: string; entity: string; classification: DataClassification; status: string }> = [
  { id: 'EV-001', title: 'Policy wording reference', entity: 'MC-DEMO-POL-RAIN-01', classification: 'REAL', status: 'REGISTERED' },
  { id: 'EV-002', title: 'Surat trigger configuration', entity: 'MC-DEMO-POL-RAIN-01', classification: 'SIMULATED', status: 'DISCLOSED' },
  { id: 'EV-003', title: 'Rainfall aggregation trace', entity: 'MC-DEMO-00427', classification: 'DERIVED', status: 'VERIFIED' },
  { id: 'EV-004', title: 'Borrower consent snapshot', entity: 'MC-PS-2026-0142-v1', classification: 'SIMULATED', status: 'RECORDED' },
]

function formatTimestamp(iso: string): string {
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString()
}

export function EvidenceAuditPage() {
  const [filter, setFilter] = useState<'ALL' | DataClassification>('ALL')
  const visibleEvidence = useMemo(() => evidence.filter((item) => filter === 'ALL' || item.classification === filter), [filter])

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [exceptions, setExceptions] = useState<ExceptionCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([api.listAuditEvents(), api.listExceptions()])
      .then(([events, cases]) => {
        if (cancelled) return
        setAuditEvents(events)
        setExceptions(cases)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not load the audit trail')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const correlationIds = [...new Set(auditEvents.map((event) => event.correlation_id))]

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Traceable project records" title="Evidence & audit" description="Trace critical demo facts to their classification and inspect append-only events linked by a shared correlation identifier." />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="surface-card overflow-hidden" aria-labelledby="evidence-register-heading">
          <div className="border-b border-white/7 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div><p className="section-kicker">Evidence registry</p><h2 id="evidence-register-heading" className="section-title">Source and assumption records</h2></div>
              <label><span className="sr-only">Filter evidence classification</span><select value={filter} onChange={(event) => setFilter(event.target.value as 'ALL' | DataClassification)} className="h-9 rounded-lg border border-white/10 bg-deep/65 px-3 text-xs text-slate-300 outline-none focus:border-cyan/60"><option value="ALL">All classes</option><option value="REAL">Real</option><option value="DERIVED">Derived</option><option value="SIMULATED">Simulated</option></select></label>
            </div>
            <p aria-live="polite" className="mt-3 text-xs text-slate-500">Showing {visibleEvidence.length} evidence records</p>
            <p className="mt-1.5 text-[0.65rem] leading-5 text-slate-600">
              Interface fixtures. The Evidence Registry is not implemented in the backend yet, so
              these describe intended records rather than stored ones.
            </p>
          </div>
          <div className="divide-y divide-white/6">
            {visibleEvidence.map((item) => (
              <article key={item.id} className="p-5 sm:px-6">
                <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[0.65rem] text-slate-600">{item.id} · {item.entity}</p><h3 className="mt-1.5 text-sm font-semibold text-slate-300">{item.title}</h3></div><DataClassificationBadge classification={item.classification} /></div>
                <div className="mt-3"><CanonicalStateBadge state={item.status} /></div>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="audit-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="section-kicker">Append-only chronology</p><h2 id="audit-heading" className="section-title">Correlation-linked audit trail</h2></div>
            {correlationIds.map((id) => (
              <span key={id} className="rounded-md border border-cyan/20 bg-cyan/6 px-2.5 py-1 font-mono text-[0.65rem] text-cyan">{id}</span>
            ))}
          </div>

          {error ? (
            <p role="alert" className="mt-5 rounded-xl border border-danger/25 bg-danger/8 p-4 text-xs text-danger">{error}</p>
          ) : null}

          {loading ? (
            <div role="status" aria-label="Loading audit trail" className="mt-6 h-40 animate-pulse rounded-xl bg-white/4" />
          ) : null}

          {!loading && auditEvents.length === 0 && !error ? (
            <p className="mt-6 text-sm text-slate-500">
              No audit events recorded yet. Run a replay from Events &amp; triggers to create one.
            </p>
          ) : null}

          <ol className="mt-6 space-y-0">
            {auditEvents.map((event, index) => (
              <li key={event.id} className="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-6 last:pb-0">
                {index < auditEvents.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[0.34rem] top-3 w-px bg-white/9" />}
                <span aria-hidden="true" className="relative mt-1 size-3 rounded-full border-2 border-panel bg-cyan ring-1 ring-cyan/35" />
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-mono text-xs font-semibold text-slate-300">{event.event_type}</h3>
                    <span className="text-[0.65rem] text-slate-600">{formatTimestamp(event.occurred_at_utc)}</span>
                  </div>
                  <p className="mt-1 text-[0.68rem] text-slate-500">{event.entity_type} · {event.actor_type}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono">{event.previous_state ?? '—'} → {event.new_state ?? '—'}</span>
                    <DataClassificationBadge classification={event.classification} />
                  </p>
                  {event.reason ? <p className="mt-1.5 text-[0.68rem] leading-5 text-slate-600">{event.reason}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="surface-card p-5 sm:p-6" aria-labelledby="exception-heading">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="section-kicker">Manual review queue</p>
            <h2 id="exception-heading" className="section-title">
              {exceptions.length === 0 ? 'No open exceptions' : `Open exceptions (${exceptions.length})`}
            </h2>
            {exceptions.length === 0 ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Nothing is awaiting manual review. A reconciliation mismatch opens a case here and
                preserves both source records rather than overwriting either side.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {exceptions.map((item) => (
                  <li key={item.id}>
                    <p className="font-mono text-[0.65rem] text-slate-600">{item.case_reference}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">{item.summary}</p>
                    <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{item.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <CanonicalStateBadge state={exceptions[0]?.state ?? 'RECONCILED'} />
        </div>
      </section>
    </div>
  )
}
