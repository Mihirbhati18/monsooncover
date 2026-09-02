import { CanonicalStateBadge, DataClassificationBadge } from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { PageIntro } from '../components/foundation/PageIntro'

const trace = [
  ['Observation window', '27–28 Aug 2026', 'SIMULATED'],
  ['Accumulated rainfall', '184 mm', 'DERIVED'],
  ['Demo strike threshold', '160 mm', 'SIMULATED'],
  ['Comparison', '184 ≥ 160', 'DERIVED'],
  ['Workflow result', 'TRIGGER_CANDIDATE', 'DERIVED'],
] as const

export function EventsTriggersPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Deterministic workflow evidence" title="Events & triggers" description="Inspect observed-event fixtures and calculation traces. A trigger candidate only starts insurer review—it never constitutes approval." classification="DERIVED" />

      <section className="rounded-2xl border border-amber/25 bg-amber/7 p-5 sm:p-6" aria-labelledby="candidate-alert-heading">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="section-kicker text-amber/60">Event · MC-DEMO-00427</p>
            <h2 id="candidate-alert-heading" className="mt-2 text-xl font-semibold text-amber">Insurer review required</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber/75">The deterministic demo comparison reached candidate status. MonsoonCover has not approved a claim, initiated a payout, or instructed lender posting.</p>
          </div>
          <CanonicalStateBadge state="TRIGGER_CANDIDATE" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card overflow-hidden" aria-labelledby="trace-heading">
          <div className="border-b border-white/7 p-5 sm:p-6">
            <p className="section-kicker">Explainable calculation</p>
            <h2 id="trace-heading" className="section-title">Calculation trace</h2>
          </div>
          <div className="divide-y divide-white/6">
            {trace.map(([label, value, classification], index) => (
              <div key={label} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-4 sm:px-6">
                <span className="font-mono text-[0.65rem] text-slate-600">0{index + 1}</span>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-200">{value}</p>
                </div>
                <DataClassificationBadge classification={classification} />
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="decision-heading">
          <p className="section-kicker">Independent control</p>
          <h2 id="decision-heading" className="section-title">Insurer sandbox decision</h2>
          <div className="mt-6 rounded-xl border border-white/7 bg-deep/55 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-200">Decision state</p>
              <CanonicalStateBadge state="PENDING" />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Only an authenticated insurer-sandbox actor may approve, reject, or request more data. Decision controls are intentionally not exposed to this lender role.</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Unavailable insurer actions">
            {['Approve', 'Reject', 'More data'].map((action) => (
              <button key={action} type="button" disabled className="rounded-lg border border-white/7 bg-white/3 px-2 py-2.5 text-xs font-semibold text-slate-600">{action}</button>
            ))}
          </div>
          <p className="mt-3 text-center text-[0.65rem] text-slate-600">Unavailable in lender operations</p>
        </section>
      </div>

      <section className="surface-card p-5 sm:p-6" aria-labelledby="event-source-heading">
        <p className="section-kicker">Evidence packet</p>
        <h2 id="event-source-heading" className="section-title">Candidate provenance</h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference classification="SIMULATED" label="Historical observation fixture" detail="Locally stored replay values for this frontend phase; no live weather feed is connected." />
          <SourceReference classification="DERIVED" label="Rainfall aggregation" detail="Illustrative sum shown with units and window so the comparison remains inspectable." />
          <SourceReference classification="SIMULATED" label="Trigger threshold" detail="Demo configuration, not an authorized Surat-specific insurer term." />
        </div>
      </section>
    </div>
  )
}
