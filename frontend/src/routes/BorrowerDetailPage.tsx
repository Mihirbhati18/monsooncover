import { Link, Navigate, useParams } from 'react-router-dom'
import {
  CanonicalStateBadge,
  DataClassificationBadge,
  DemoDataBadge,
} from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { demoPortfolio } from '../features/portfolio/demoPortfolio'

const formatInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const timeline = [
  {
    title: 'Coverage snapshot activated',
    state: 'ACTIVE',
    time: '15 Jun 2026 · 10:42 IST',
    detail: 'Borrower-specific demo terms were frozen after recorded consent.',
  },
  {
    title: 'Historical event observed',
    state: 'EVENT_OBSERVED',
    time: '28 Aug 2026 · 08:10 IST',
    detail: 'A locally replayed observation was attached to this synthetic borrower record.',
  },
  {
    title: 'Candidate assembled',
    state: 'TRIGGER_CANDIDATE',
    time: '28 Aug 2026 · 08:14 IST',
    detail: 'Illustrative evidence was prepared for insurer-sandbox review. This is not approval.',
  },
  {
    title: 'Insurer review pending',
    state: 'PENDING',
    time: 'Current state',
    detail: 'Only the insurer sandbox may approve, reject, or request more information.',
  },
]

export function BorrowerDetailPage() {
  const { borrowerId } = useParams()
  const borrower = demoPortfolio.find((record) => record.id === borrowerId)

  if (!borrower) {
    return <Navigate to="/portfolio" replace />
  }

  const isCanonicalBorrower = borrower.id === 'MC-BOR-001'

  return (
    <div className="space-y-6">
      <header>
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-cyan"
        >
          <span aria-hidden="true">←</span>
          Back to portfolio
        </Link>
        <div className="mt-5 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <DemoDataBadge />
              <DataClassificationBadge classification="SIMULATED" />
              {isCanonicalBorrower && (
                <span className="rounded-md border border-cyan/25 bg-cyan/8 px-2 py-1 text-[0.62rem] font-bold tracking-[0.12em] text-cyan">
                  PRIMARY DEMO
                </span>
              )}
            </div>
            <p className="section-kicker mt-5">Borrower record · {borrower.id}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
              {borrower.name}
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              {borrower.sector} · {borrower.city}, {borrower.state}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CanonicalStateBadge state={borrower.coverageStatus} />
            <CanonicalStateBadge state={isCanonicalBorrower ? 'TRIGGER_CANDIDATE' : 'MONITORING'} />
          </div>
        </div>
      </header>

      {isCanonicalBorrower && (
        <section
          aria-label="Trigger candidate disclosure"
          className="rounded-2xl border border-amber/25 bg-amber/7 p-5 sm:flex sm:items-start sm:justify-between sm:gap-6"
        >
          <div>
            <p className="text-sm font-semibold text-amber">Insurer decision required</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber/75">
              MC-DEMO-00427 is a simulated trigger candidate. It is not an approved claim or
              payout. MonsoonCover has only assembled an illustrative evidence packet.
            </p>
          </div>
          <CanonicalStateBadge state="TRIGGER_CANDIDATE" />
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section aria-labelledby="facility-heading" className="surface-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">Facility</p>
              <h2 id="facility-heading" className="section-title">
                Working-capital context
              </h2>
            </div>
            <DataClassificationBadge classification="SIMULATED" />
          </div>
          <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Loan type</dt>
              <dd className="mt-1.5 text-sm font-medium text-slate-200">{borrower.loanType}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Outstanding amount</dt>
              <dd className="mt-1.5 font-mono text-sm font-semibold text-slate-200">
                {formatInr.format(borrower.outstandingInr)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Original demo amount</dt>
              <dd className="mt-1.5 font-mono text-sm font-semibold text-slate-200">
                {formatInr.format(isCanonicalBorrower ? 1000000 : borrower.outstandingInr + 220000)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Illustrative EMI</dt>
              <dd className="mt-1.5 font-mono text-sm font-semibold text-slate-200">
                {formatInr.format(isCanonicalBorrower ? 62000 : 48000)}
              </dd>
            </div>
          </dl>
          <div className="mt-6 rounded-xl border border-white/7 bg-deep/45 p-4">
            <p className="text-xs font-semibold text-slate-300">Credit-use boundary</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Climate exposure is advisory portfolio intelligence. This interface does not
              make, change, or recommend a lending decision.
            </p>
          </div>
        </section>

        <section aria-labelledby="coverage-heading" className="surface-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">Immutable demo reference</p>
              <h2 id="coverage-heading" className="section-title">
                Coverage snapshot
              </h2>
            </div>
            <CanonicalStateBadge state={borrower.coverageStatus} />
          </div>
          <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Snapshot reference</dt>
              <dd className="mt-1.5 font-mono text-xs font-semibold text-slate-200">
                MC-PS-2026-0142-v1
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Primary peril</dt>
              <dd className="mt-1.5 text-sm font-medium text-slate-200">{borrower.primaryPeril}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Coverage window</dt>
              <dd className="mt-1.5 text-sm font-medium text-slate-200">15 Jun – 30 Sep 2026</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Illustrative sum insured</dt>
              <dd className="mt-1.5 font-mono text-sm font-semibold text-slate-200">₹40,000</dd>
            </div>
          </dl>
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-teal/20 bg-teal/6 p-4">
            <div>
              <p className="text-xs font-semibold text-teal">Consent record captured</p>
              <p className="mt-1 text-xs text-slate-500">15 Jun 2026 · Web demo · English</p>
            </div>
            <DataClassificationBadge classification="SIMULATED" />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section aria-labelledby="exposure-heading" className="surface-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">Advisory only</p>
              <h2 id="exposure-heading" className="section-title">
                Climate exposure
              </h2>
            </div>
            <DataClassificationBadge classification="SIMULATED" />
          </div>
          <div className="mt-6 rounded-xl border border-amber/20 bg-deep/50 p-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Illustrative band
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber">{borrower.riskBand}</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan via-amber to-danger"
                style={{ width: borrower.riskBand === 'HIGH' ? '82%' : borrower.riskBand === 'MODERATE' ? '56%' : '28%' }}
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Presentation fixture only. No exposure score or policy eligibility calculation
              has run.
            </p>
          </div>
        </section>

        <section aria-labelledby="timeline-heading" className="surface-card p-5 sm:p-6">
          <p className="section-kicker">Responsibility-aware chronology</p>
          <h2 id="timeline-heading" className="section-title">
            Coverage and event timeline
          </h2>
          <ol className="mt-6 space-y-0">
            {timeline.map((event, index) => (
              <li key={event.title} className="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-5 last:pb-0">
                {index < timeline.length - 1 && (
                  <span aria-hidden="true" className="absolute bottom-0 left-[0.34rem] top-3 w-px bg-white/9" />
                )}
                <span aria-hidden="true" className="relative mt-1 size-3 rounded-full border-2 border-panel bg-cyan ring-1 ring-cyan/35" />
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-200">{event.title}</h3>
                    <CanonicalStateBadge state={event.state} />
                  </div>
                  <p className="mt-1 font-mono text-[0.65rem] text-slate-600">{event.time}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{event.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="record-provenance-heading" className="surface-card p-5 sm:p-6">
        <p className="section-kicker">Record provenance</p>
        <h2 id="record-provenance-heading" className="section-title">
          Evidence and simulation boundaries
        </h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference
            classification="SIMULATED"
            label="Borrower and loan"
            detail="Synthetic identity and financial values; no real KYC, account, credit, or contact data is present."
          />
          <SourceReference
            classification="SIMULATED"
            label="Policy snapshot"
            detail="Illustrative demo terms and consent. No insurer-issued policy or commercial partnership is represented."
          />
          <SourceReference
            classification="SIMULATED"
            label="Event workflow"
            detail="Offline presentation fixture. The candidate remains subject to an independent insurer-sandbox decision."
          />
        </div>
      </section>
    </div>
  )
}
