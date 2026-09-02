import { DataClassificationBadge } from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { PageIntro } from '../components/foundation/PageIntro'

const locations = [
  { city: 'Surat', borrowers: 18, exposure: '₹1.84Cr', band: 'High', width: '88%' },
  { city: 'Bharuch', borrowers: 11, exposure: '₹92L', band: 'High', width: '76%' },
  { city: 'Vadodara', borrowers: 27, exposure: '₹2.26Cr', band: 'Moderate', width: '58%' },
  { city: 'Ahmedabad', borrowers: 42, exposure: '₹3.71Cr', band: 'Moderate', width: '47%' },
  { city: 'Rajkot', borrowers: 30, exposure: '₹2.68Cr', band: 'Low', width: '29%' },
]

export function ClimateRiskPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Advisory portfolio intelligence"
        title="Climate risk"
        description="Review illustrative geographic concentration and peril exposure. These signals are separate from lending decisions, policy eligibility, and trigger evaluation."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Climate exposure summary">
        {[
          ['Geographies', '05', 'Synthetic portfolio locations'],
          ['High-exposure records', '29', 'Illustrative band'],
          ['Primary peril', 'Rainfall', 'Most common fixture label'],
          ['Model status', 'Not run', 'Presentation data only'],
        ].map(([label, value, detail]) => (
          <article key={label} className="surface-card p-5">
            <div className="flex justify-between gap-3">
              <p className="text-xs text-slate-400">{label}</p>
              <DataClassificationBadge classification="SIMULATED" />
            </div>
            <p className="mt-4 font-mono text-2xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-card overflow-hidden p-5 sm:p-6" aria-labelledby="geography-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">Geographic concentration</p>
              <h2 id="geography-heading" className="section-title">Illustrative Gujarat portfolio</h2>
            </div>
            <DataClassificationBadge classification="SIMULATED" />
          </div>
          <div className="relative mt-6 min-h-80 overflow-hidden rounded-xl border border-white/7 bg-deep/65 p-5">
            <div aria-hidden="true" className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div aria-hidden="true" className="absolute -right-12 top-6 size-72 rounded-[42%_58%_64%_36%] border border-cyan/15 bg-cyan/[0.025] rotate-12" />
            <div className="relative grid gap-3 sm:grid-cols-2">
              {locations.map((location, index) => (
                <div key={location.city} className={`rounded-xl border bg-panel/85 p-4 ${index === 0 ? 'border-amber/35 sm:col-span-2' : 'border-white/8'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{location.city}</p>
                      <p className="mt-1 text-xs text-slate-500">{location.borrowers} demo borrowers</p>
                    </div>
                    <p className="font-mono text-sm font-semibold text-white">{location.exposure}</p>
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/7">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan to-amber" style={{ width: location.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="concentration-heading">
          <p className="section-kicker">Exposure by location</p>
          <h2 id="concentration-heading" className="section-title">Concentration profile</h2>
          <div className="mt-6 space-y-5">
            {locations.map((location) => (
              <div key={location.city}>
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="font-medium text-slate-300">{location.city}</span>
                  <span className="font-mono text-slate-500">{location.exposure} · {location.band}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-deep">
                  <div className="h-full rounded-full bg-monsoon" style={{ width: location.width }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-cyan/15 bg-cyan/5 p-4">
            <p className="text-xs font-semibold text-cyan">Advisory boundary</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">No climate exposure shown here may be used to approve, deny, or price credit.</p>
          </div>
        </section>
      </div>

      <section className="surface-card p-5 sm:p-6" aria-labelledby="risk-method-heading">
        <p className="section-kicker">Method and provenance</p>
        <h2 id="risk-method-heading" className="section-title">No hidden model outputs</h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference classification="SIMULATED" label="Portfolio locations" detail="Synthetic city-level records; no precise borrower coordinates or personal location data." />
          <SourceReference classification="SIMULATED" label="Exposure bands" detail="Interface fixtures only. A documented exposure calculation has not been implemented." />
          <SourceReference classification="SIMULATED" label="Concentration totals" detail="Illustrative values for layout and workflow demonstration, not production analytics." />
        </div>
      </section>
    </div>
  )
}
