import { DataClassificationBadge } from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { PageIntro } from '../components/foundation/PageIntro'
import type { ExposureBar } from '../components/finance/ExposureBarChart'
import { LazyExposureBarChart, LazyPortfolioMap } from '../components/finance/lazyVisuals'
import { demoPortfolio } from '../features/portfolio/demoPortfolio'

const locations: Array<{ city: string; borrowers: number; exposureLabel: string; band: ExposureBar['band'] }> = [
  { city: 'Surat', borrowers: 18, exposureLabel: '₹1.84Cr', band: 'High' },
  { city: 'Bharuch', borrowers: 11, exposureLabel: '₹0.92Cr', band: 'High' },
  { city: 'Vadodara', borrowers: 27, exposureLabel: '₹2.26Cr', band: 'Moderate' },
  { city: 'Ahmedabad', borrowers: 42, exposureLabel: '₹3.71Cr', band: 'Moderate' },
  { city: 'Rajkot', borrowers: 30, exposureLabel: '₹2.68Cr', band: 'Low' },
]

const exposureChartData: ExposureBar[] = locations.map((location) => ({
  city: location.city,
  exposureCr: Number.parseFloat(location.exposureLabel.replace(/[₹Cr]/g, '')),
  band: location.band,
}))

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
          <div className="mt-6">
            <LazyPortfolioMap borrowers={demoPortfolio} />
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="concentration-heading">
          <p className="section-kicker">Exposure by location</p>
          <h2 id="concentration-heading" className="section-title">Concentration profile</h2>
          <div className="mt-6">
            <LazyExposureBarChart data={exposureChartData} />
          </div>
          <ul className="mt-4 space-y-1.5">
            {locations.map((location) => (
              <li key={location.city} className="flex items-center justify-between gap-4 text-xs">
                <span className="font-medium text-slate-300">
                  {location.city} <span className="text-slate-600">· {location.borrowers} borrowers</span>
                </span>
                <span className="font-mono text-slate-500">{location.exposureLabel} · {location.band}</span>
              </li>
            ))}
          </ul>
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
