import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CanonicalStateBadge,
  DataClassificationBadge,
  DemoDataBadge,
} from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { PortfolioMap } from '../components/finance/PortfolioMap'
import {
  demoPortfolio,
  type ClimateRiskBand,
  type CoverageStatus,
} from '../features/portfolio/demoPortfolio'

const coverageOptions: Array<{ value: 'ALL' | CoverageStatus; label: string }> = [
  { value: 'ALL', label: 'All coverage' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'NOT_COVERED', label: 'Not covered' },
  { value: 'EXPIRED', label: 'Expired' },
]

const riskStyles: Record<ClimateRiskBand, string> = {
  HIGH: 'border-amber/30 bg-amber/9 text-amber',
  MODERATE: 'border-cyan/25 bg-cyan/8 text-cyan',
  LOW: 'border-teal/25 bg-teal/8 text-teal',
}

const formatInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function RiskBadge({ band }: { band: ClimateRiskBand }) {
  return (
    <span
      aria-label={`Illustrative climate exposure: ${band}`}
      className={`inline-flex rounded-md border px-2 py-1 text-[0.65rem] font-bold tracking-[0.08em] ${riskStyles[band]}`}
    >
      {band}
    </span>
  )
}

export function PortfolioPage() {
  const [query, setQuery] = useState('')
  const [coverage, setCoverage] = useState<'ALL' | CoverageStatus>('ALL')

  const filteredBorrowers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return demoPortfolio.filter((borrower) => {
      const matchesCoverage = coverage === 'ALL' || borrower.coverageStatus === coverage
      const searchableText = [
        borrower.name,
        borrower.id,
        borrower.sector,
        borrower.city,
        borrower.primaryPeril,
      ]
        .join(' ')
        .toLocaleLowerCase()

      return matchesCoverage && searchableText.includes(normalizedQuery)
    })
  }, [coverage, query])

  const totalOutstanding = demoPortfolio.reduce(
    (total, borrower) => total + borrower.outstandingInr,
    0,
  )
  const coveredOutstanding = demoPortfolio.reduce(
    (total, borrower) =>
      borrower.coverageStatus === 'ACTIVE' ? total + borrower.outstandingInr : total,
    0,
  )
  const activeBorrowers = demoPortfolio.filter(
    (borrower) => borrower.coverageStatus === 'ACTIVE',
  ).length
  const highExposureBorrowers = demoPortfolio.filter(
    (borrower) => borrower.riskBand === 'HIGH',
  ).length

  const summary = [
    { label: 'Demo borrowers', value: demoPortfolio.length.toString().padStart(2, '0') },
    { label: 'Outstanding', value: formatInr.format(totalOutstanding) },
    { label: 'Active cover', value: `${activeBorrowers} of ${demoPortfolio.length}` },
    { label: 'High exposure', value: `${highExposureBorrowers} records` },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <DemoDataBadge />
            <DataClassificationBadge classification="SIMULATED" />
          </div>
          <p className="section-kicker mt-5">Synthetic lending portfolio</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            Portfolio exposure
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Explore illustrative MSME facilities, coverage states, and advisory climate
            exposure. Exposure bands do not determine credit eligibility or pricing.
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-white/8 bg-panel/70 px-4 py-3 text-left xl:text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Data as of
          </p>
          <p className="mt-1 font-mono text-xs text-slate-300">03 Sep 2026 · 00:15 IST</p>
        </div>
      </header>

      <section aria-label="Portfolio summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <article key={item.label} className="surface-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium text-slate-400">{item.label}</p>
              <DataClassificationBadge classification="DERIVED" />
            </div>
            <p className="mt-4 font-mono text-2xl font-semibold tracking-tight text-white">
              {item.value}
            </p>
          </article>
        ))}
      </section>

      <section aria-labelledby="portfolio-map-heading" className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Geographic footprint</p>
            <h2 id="portfolio-map-heading" className="section-title">
              Borrower locations
            </h2>
          </div>
          <p className="text-xs text-slate-500">City-level markers, illustrative only</p>
        </div>
        <div className="mt-5">
          <PortfolioMap borrowers={filteredBorrowers} />
        </div>
      </section>

      <section aria-labelledby="portfolio-table-heading" className="surface-card overflow-hidden">
        <div className="border-b border-white/7 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <p className="section-kicker">Borrower registry</p>
              <h2 id="portfolio-table-heading" className="section-title">
                Coverage and exposure records
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_12rem]">
              <label className="block">
                <span className="sr-only">Search portfolio</span>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-deep/65 px-3 focus-within:border-cyan/60">
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 fill-none stroke-slate-500" strokeWidth="1.8">
                    <circle cx="8.5" cy="8.5" r="5.25" />
                    <path d="m12.5 12.5 4 4" />
                  </svg>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search borrower, city, peril…"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                  />
                </div>
              </label>
              <label>
                <span className="sr-only">Filter by coverage status</span>
                <select
                  value={coverage}
                  onChange={(event) => setCoverage(event.target.value as 'ALL' | CoverageStatus)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-deep/65 px-3 text-sm text-slate-300 outline-none focus:border-cyan/60"
                >
                  {coverageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <p aria-live="polite" className="mt-4 text-xs text-slate-500">
            Showing {filteredBorrowers.length} of {demoPortfolio.length} synthetic records
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/7 bg-deep/35 text-[0.65rem] uppercase tracking-[0.12em] text-slate-500">
                <th className="px-6 py-3.5 font-semibold">Borrower</th>
                <th className="px-4 py-3.5 font-semibold">Facility</th>
                <th className="px-4 py-3.5 font-semibold">Outstanding</th>
                <th className="px-4 py-3.5 font-semibold">Coverage</th>
                <th className="px-4 py-3.5 font-semibold">Exposure</th>
                <th className="px-4 py-3.5 font-semibold">Next step</th>
              </tr>
            </thead>
            <tbody>
              {filteredBorrowers.map((borrower) => (
                <tr key={borrower.id} className="border-b border-white/6 last:border-0 hover:bg-white/[0.025]">
                  <td className="px-6 py-4">
                    <Link
                      to={`/portfolio/${borrower.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-200 transition-colors hover:text-cyan"
                    >
                      {borrower.name}
                      <span aria-hidden="true" className="text-slate-600">
                        ↗
                      </span>
                    </Link>
                    <p className="mt-1 font-mono text-[0.68rem] text-slate-600">
                      {borrower.id} · {borrower.city}, {borrower.state}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{borrower.sector}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-400">{borrower.loanType}</td>
                  <td className="px-4 py-4">
                    <p className="font-mono text-sm font-medium text-slate-200">
                      {formatInr.format(borrower.outstandingInr)}
                    </p>
                    <div className="mt-1.5">
                      <DataClassificationBadge classification="SIMULATED" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <CanonicalStateBadge state={borrower.coverageStatus} />
                  </td>
                  <td className="px-4 py-4">
                    <RiskBadge band={borrower.riskBand} />
                    <p className="mt-1.5 text-[0.68rem] text-slate-500">{borrower.primaryPeril}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-400">{borrower.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBorrowers.length === 0 && (
          <div className="border-t border-white/7 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-300">No matching demo records</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCoverage('ALL')
              }}
              className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-cyan hover:bg-white/5"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="provenance-heading" className="surface-card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">Provenance notes</p>
            <h2 id="provenance-heading" className="section-title">
              What these values mean
            </h2>
          </div>
          <p className="text-xs text-slate-500">No external dataset connected</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference
            classification="SIMULATED"
            label="Borrower and facility records"
            detail="Synthetic identities, locations, loan values, and coverage states created only for this offline interface demo."
          />
          <SourceReference
            classification="SIMULATED"
            label="Climate exposure bands"
            detail="Illustrative labels only. No climate-risk model has run and the bands must not be used for credit decisions."
          />
          <SourceReference
            classification="DERIVED"
            label="Portfolio summary"
            detail={`Counts and totals calculated in the browser from ${demoPortfolio.length} visible synthetic fixture records. Active covered outstanding: ${formatInr.format(coveredOutstanding)}.`}
          />
        </div>
      </section>
    </div>
  )
}
