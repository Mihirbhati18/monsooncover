import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CanonicalStateBadge,
  DataClassificationBadge,
  DemoDataBadge,
} from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { LazyPortfolioMap } from '../components/finance/lazyVisuals'
import { api } from '../services/api'
import type { Borrower, Loan, PolicySnapshot, RiskAssessment } from '../services/types'

const formatInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const bandStyles: Record<string, string> = {
  HIGH: 'border-amber/30 bg-amber/9 text-amber',
  MODERATE: 'border-cyan/25 bg-cyan/8 text-cyan',
  LOW: 'border-teal/25 bg-teal/8 text-teal',
}

function BandBadge({ band }: { band: string | null }) {
  if (band === null) {
    return <span className="text-[0.68rem] text-slate-600">Not assessed</span>
  }
  return (
    <span
      aria-label={`Climate exposure: ${band}`}
      className={`inline-flex rounded-md border px-2 py-1 text-[0.65rem] font-bold tracking-[0.08em] ${bandStyles[band] ?? ''}`}
    >
      {band}
    </span>
  )
}

export function PortfolioPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [snapshots, setSnapshots] = useState<PolicySnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const [borrowerList, loanList, assessmentList, snapshotList] = await Promise.all([
        api.listBorrowers(),
        api.listLoans(),
        api.listRiskAssessments(),
        api.listPolicySnapshots(),
      ])
      setBorrowers(borrowerList)
      setLoans(loanList)
      setAssessments(assessmentList)
      setSnapshots(snapshotList)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return borrowers
      .map((borrower) => {
        const borrowerLoans = loans.filter((loan) => loan.borrower_id === borrower.id)
        const outstanding = borrowerLoans.reduce(
          (total, loan) => total + Number(loan.outstanding_amount),
          0,
        )
        const assessment = assessments.filter((item) => item.borrower_id === borrower.id).at(-1)
        const snapshot = snapshots.find((item) => item.borrower_id === borrower.id)
        return { borrower, borrowerLoans, outstanding, assessment, snapshot }
      })
      .filter((row) =>
        [row.borrower.name, row.borrower.city, row.borrower.sector, row.borrower.zone_id]
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalized),
      )
  }, [borrowers, loans, assessments, snapshots, query])

  const totalOutstanding = rows.reduce((total, row) => total + row.outstanding, 0)
  const covered = rows.filter((row) => row.snapshot?.state === 'ACTIVE').length
  const highExposure = rows.filter((row) => row.assessment?.exposure_band === 'HIGH').length

  // The map needs coordinates; borrowers without them are simply not plotted.
  const mappable = borrowers
    .filter((borrower) => borrower.latitude !== null && borrower.longitude !== null)
    .map((borrower) => {
      const assessment = assessments.filter((item) => item.borrower_id === borrower.id).at(-1)
      const outstanding = loans
        .filter((loan) => loan.borrower_id === borrower.id)
        .reduce((total, loan) => total + Number(loan.outstanding_amount), 0)
      return {
        id: borrower.id,
        name: borrower.name,
        sector: borrower.sector,
        city: borrower.city,
        state: borrower.state,
        latitude: Number(borrower.latitude),
        longitude: Number(borrower.longitude),
        loanType: loans.find((loan) => loan.borrower_id === borrower.id)?.loan_type ?? 'Facility',
        outstandingInr: outstanding,
        coverageStatus: 'ACTIVE' as const,
        riskBand: (assessment?.exposure_band ?? 'LOW') as 'HIGH' | 'MODERATE' | 'LOW',
        primaryPeril: assessment?.peril.replaceAll('_', ' ') ?? 'Not assessed',
        nextAction: assessment ? 'Monitoring active' : 'Run a climate assessment',
      }
    })

  const summary = [
    ['Borrowers', String(rows.length).padStart(2, '0')],
    ['Outstanding', formatInr.format(totalOutstanding)],
    ['Active cover', `${covered} of ${rows.length}`],
    ['High exposure', `${highExposure} records`],
  ] as const

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
            Borrowers, facilities and coverage read from the backend. Exposure bands come from the
            risk engine and do not determine credit eligibility or pricing.
          </p>
        </div>
      </header>

      {error ? (
        <section role="alert" className="rounded-2xl border border-danger/25 bg-danger/7 p-5">
          <p className="text-sm font-semibold text-danger">Could not load the portfolio</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{error}</p>
        </section>
      ) : null}

      <section aria-label="Portfolio summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(([label, value]) => (
          <article key={label} className="surface-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium text-slate-400">{label}</p>
              <DataClassificationBadge classification="DERIVED" />
            </div>
            <p className="mt-4 font-mono text-2xl font-semibold tracking-tight text-white">{value}</p>
          </article>
        ))}
      </section>

      {mappable.length > 0 ? (
        <section aria-labelledby="portfolio-map-heading" className="surface-card p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-kicker">Geographic footprint</p>
              <h2 id="portfolio-map-heading" className="section-title">
                Borrower locations
              </h2>
            </div>
            <p className="text-xs text-slate-500">Zone-level markers coloured by computed exposure</p>
          </div>
          <div className="mt-5">
            <LazyPortfolioMap borrowers={mappable} />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="portfolio-table-heading" className="surface-card overflow-hidden">
        <div className="border-b border-white/7 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <p className="section-kicker">Borrower registry</p>
              <h2 id="portfolio-table-heading" className="section-title">
                Coverage and exposure records
              </h2>
            </div>
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
                  placeholder="Search borrower, city, zone…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                />
              </div>
            </label>
          </div>
          <p aria-live="polite" className="mt-4 text-xs text-slate-500">
            {loading ? 'Loading portfolio…' : `Showing ${rows.length} of ${borrowers.length} records`}
          </p>
        </div>

        {!loading && rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-300">No matching borrowers</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/7 bg-deep/35 text-[0.65rem] uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-6 py-3.5 font-semibold">Borrower</th>
                  <th className="px-4 py-3.5 font-semibold">Facility</th>
                  <th className="px-4 py-3.5 font-semibold">Outstanding</th>
                  <th className="px-4 py-3.5 font-semibold">Cover</th>
                  <th className="px-4 py-3.5 font-semibold">Exposure</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ borrower, borrowerLoans, outstanding, assessment, snapshot }) => (
                  <tr key={borrower.id} className="border-b border-white/6 last:border-0 hover:bg-white/[0.025]">
                    <td className="px-6 py-4">
                      <Link
                        to={`/portfolio/${borrower.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-200 transition-colors hover:text-cyan"
                      >
                        {borrower.name}
                        <span aria-hidden="true" className="text-slate-600">↗</span>
                      </Link>
                      <p className="mt-1 font-mono text-[0.68rem] text-slate-600">
                        {borrower.zone_id} · {borrower.city}, {borrower.state}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{borrower.sector}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {borrowerLoans.map((loan) => loan.loan_type).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-mono text-sm font-medium text-slate-200">
                        {formatInr.format(outstanding)}
                      </p>
                      <div className="mt-1.5">
                        <DataClassificationBadge classification="SIMULATED" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {snapshot ? (
                        <CanonicalStateBadge state={snapshot.state} />
                      ) : (
                        <span className="text-[0.68rem] text-slate-600">No snapshot</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <BandBadge band={assessment?.exposure_band ?? null} />
                      <p className="mt-1.5 text-[0.68rem] text-slate-500">
                        {assessment
                          ? `${assessment.max_daily_value} ${assessment.normalized_unit} max daily`
                          : 'Run Assess climate risk'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference
            classification="SIMULATED"
            label="Borrower and facility records"
            detail="Synthetic identities, locations and loan values created for this offline demo and stored in the backend."
          />
          <SourceReference
            classification="DERIVED"
            label="Climate exposure bands"
            detail="Computed by the risk engine from verified observations. Advisory only; they must not be used for credit decisions."
          />
          <SourceReference
            classification="DERIVED"
            label="Portfolio totals"
            detail="Summed in the browser from the loan records returned by the API."
          />
        </div>
      </section>
    </div>
  )
}
