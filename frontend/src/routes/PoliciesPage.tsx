import { CanonicalStateBadge, DataClassificationBadge } from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { PageIntro } from '../components/foundation/PageIntro'
import { GlassSurface } from '../visuals/glass/GlassSurface'

const gates = [
  ['Policy wording reference', 'RECORDED', 'Public/reference structure noted; commercial applicability is not claimed.'],
  ['Geography and peril', 'SIMULATED', 'Surat rainfall configuration is an explicit demo assumption.'],
  ['Trigger parameters', 'SIMULATED', 'No authorized geography-specific term sheet connected.'],
  ['Borrower consent', 'RECORDED', 'Synthetic consent record linked to immutable snapshot v1.'],
]

export function PoliciesPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Reference and demo terms" title="Policies" description="Inspect versioned policy references, accepted borrower snapshots, and evidence-gate status without implying a live insurer product or partnership." />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassSurface as="section" className="p-5 sm:p-6" aria-labelledby="policy-reference-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="section-kicker">Demo term sheet · v1.0</p>
              <h2 id="policy-reference-heading" className="section-title">Extreme rainfall protection reference</h2>
            </div>
            <CanonicalStateBadge state="ACTIVE" />
          </div>
          <div className="mt-5 rounded-xl border border-amber/20 bg-amber/6 p-4 text-xs leading-5 text-amber/80">
            Demo configuration only. This is not an insurer-issued policy, offer, endorsement, or proof of partnership.
          </div>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            {[
              ['Reference', 'MC-DEMO-POL-RAIN-01'],
              ['Peril', 'Extreme rainfall'],
              ['Coverage geography', 'Surat demo zone'],
              ['Risk period', '15 Jun – 30 Sep 2026'],
              ['Illustrative sum insured', '₹40,000'],
              ['Version status', 'Locked for accepted snapshots'],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="text-xs text-slate-500">{term}</dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </GlassSurface>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="snapshot-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">ABC Textiles</p>
              <h2 id="snapshot-heading" className="section-title">Accepted snapshot</h2>
            </div>
            <DataClassificationBadge classification="SIMULATED" />
          </div>
          <div className="mt-6 rounded-xl border border-cyan/20 bg-deep/55 p-5">
            <p className="font-mono text-xs font-semibold text-cyan">MC-PS-2026-0142-v1</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">Immutable borrower-specific copy</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Created when the synthetic borrower accepted the displayed demo terms. Later configuration changes do not alter this record.</p>
          </div>
          <ol className="mt-5 space-y-3">
            {['Disclosure v1 presented', 'Explicit ACCEPT recorded', 'Snapshot checksum stored', 'Monitoring window activated'].map((item, index) => (
              <li key={item} className="flex items-center gap-3 text-xs text-slate-400">
                <span className="grid size-6 place-items-center rounded-full border border-teal/25 bg-teal/8 font-mono text-[0.6rem] text-teal">{index + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="surface-card overflow-hidden" aria-labelledby="gates-heading">
        <div className="border-b border-white/7 p-5 sm:p-6">
          <p className="section-kicker">Activation controls</p>
          <h2 id="gates-heading" className="section-title">Evidence-gate register</h2>
        </div>
        <div className="divide-y divide-white/6">
          {gates.map(([name, state, detail]) => (
            <div key={name} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
              <div>
                <p className="text-sm font-semibold text-slate-300">{name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
              </div>
              <CanonicalStateBadge state={state} />
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-5 sm:p-6" aria-labelledby="policy-source-heading">
        <p className="section-kicker">Classification</p>
        <h2 id="policy-source-heading" className="section-title">Term provenance</h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference classification="REAL" label="Reference structure" detail="May be based on registered public policy wording; this does not establish commercial availability for the borrower." />
          <SourceReference classification="SIMULATED" label="Commercial values" detail="Premium, sum insured, thresholds, and borrower policy identifier are illustrative." />
          <SourceReference classification="DERIVED" label="Snapshot checksum" detail="Reproducible digest of the exact synthetic terms shown and accepted in the demo." />
        </div>
      </section>
    </div>
  )
}
