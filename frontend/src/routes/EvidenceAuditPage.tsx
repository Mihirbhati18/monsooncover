import { useMemo, useState } from 'react'
import { CanonicalStateBadge, DataClassificationBadge, type DataClassification } from '../components/data-integrity/Badges'
import { PageIntro } from '../components/foundation/PageIntro'

const evidence: Array<{ id: string; title: string; entity: string; classification: DataClassification; status: string }> = [
  { id: 'EV-001', title: 'Policy wording reference', entity: 'MC-DEMO-POL-RAIN-01', classification: 'REAL', status: 'REGISTERED' },
  { id: 'EV-002', title: 'Surat trigger configuration', entity: 'MC-DEMO-POL-RAIN-01', classification: 'SIMULATED', status: 'DISCLOSED' },
  { id: 'EV-003', title: 'Rainfall aggregation trace', entity: 'MC-DEMO-00427', classification: 'DERIVED', status: 'VERIFIED' },
  { id: 'EV-004', title: 'Borrower consent snapshot', entity: 'MC-PS-2026-0142-v1', classification: 'SIMULATED', status: 'RECORDED' },
]

const auditEvents = [
  ['AUD-00427-04', 'TRIGGER_CANDIDATE_CREATED', 'SYSTEM', 'NO_TRIGGER → CANDIDATE', '28 Aug 2026 · 08:14 IST'],
  ['AUD-00427-03', 'OBSERVATION_AGGREGATED', 'SYSTEM', '184 mm derived', '28 Aug 2026 · 08:13 IST'],
  ['AUD-00427-02', 'OBSERVATION_REPLAYED', 'DEMO_OPERATOR', 'Fixture accepted', '28 Aug 2026 · 08:10 IST'],
  ['AUD-00427-01', 'MONITORING_STARTED', 'SYSTEM', 'POLICY_ACTIVE', '15 Jun 2026 · 10:43 IST'],
]

export function EvidenceAuditPage() {
  const [filter, setFilter] = useState<'ALL' | DataClassification>('ALL')
  const visibleEvidence = useMemo(() => evidence.filter((item) => filter === 'ALL' || item.classification === filter), [filter])

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
            <span className="rounded-md border border-cyan/20 bg-cyan/6 px-2.5 py-1 font-mono text-[0.65rem] text-cyan">EVENT-MC-2026-00427</span>
          </div>
          <ol className="mt-6 space-y-0">
            {auditEvents.map(([id, type, actor, transition, time], index) => (
              <li key={id} className="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-6 last:pb-0">
                {index < auditEvents.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[0.34rem] top-3 w-px bg-white/9" />}
                <span aria-hidden="true" className="relative mt-1 size-3 rounded-full border-2 border-panel bg-cyan ring-1 ring-cyan/35" />
                <div><div className="flex flex-wrap justify-between gap-2"><h3 className="font-mono text-xs font-semibold text-slate-300">{type}</h3><span className="text-[0.65rem] text-slate-600">{time}</span></div><p className="mt-1 text-[0.68rem] text-slate-500">{id} · {actor}</p><p className="mt-2 text-xs text-slate-400">{transition}</p></div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="surface-card p-5 sm:p-6" aria-labelledby="exception-heading">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div><p className="section-kicker">Manual review queue</p><h2 id="exception-heading" className="section-title">Open exception</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">MC-EXC-0007 preserves a mismatch between insurer and lender sandbox records. Resolution requires an actor, reason, timestamp, and linked correction event.</p></div>
          <CanonicalStateBadge state="IN_REVIEW" />
        </div>
      </section>
    </div>
  )
}
