import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CanonicalStateBadge,
  DataClassificationBadge,
  DemoDataBadge,
} from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { GlassSurface } from '../visuals/glass/GlassSurface'
import { api } from '../services/api'
import type {
  Borrower,
  Loan,
  PolicyEligibility,
  PolicySnapshot,
  RiskAssessment,
  TriggerEvaluation,
} from '../services/types'

const formatInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function BorrowerDetailPage() {
  const { borrowerId } = useParams()
  const [borrower, setBorrower] = useState<Borrower | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null)
  const [eligibility, setEligibility] = useState<PolicyEligibility | null>(null)
  const [snapshot, setSnapshot] = useState<PolicySnapshot | null>(null)
  const [evaluation, setEvaluation] = useState<TriggerEvaluation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!borrowerId) return
    let cancelled = false

    Promise.all([
      api.listBorrowers(),
      api.listLoans(borrowerId),
      api.listRiskAssessments(),
      api.listEligibility(),
      api.listPolicySnapshots(),
      api.listTriggerEvaluations(),
    ])
      .then(([borrowers, loanList, assessments, eligibilities, snapshots, evaluations]) => {
        if (cancelled) return
        setBorrower(borrowers.find((item) => item.id === borrowerId) ?? null)
        setLoans(loanList)
        setAssessment(assessments.filter((item) => item.borrower_id === borrowerId).at(-1) ?? null)
        setEligibility(eligibilities.find((item) => item.borrower_id === borrowerId) ?? null)
        const ownSnapshot = snapshots.find((item) => item.borrower_id === borrowerId) ?? null
        setSnapshot(ownSnapshot)
        setEvaluation(
          ownSnapshot
            ? (evaluations.filter((item) => item.correlation_id).at(-1) ?? null)
            : null,
        )
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Could not load borrower')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [borrowerId])

  if (loading) {
    return <div role="status" aria-label="Loading borrower" className="surface-card h-64 animate-pulse" />
  }

  if (error || !borrower) {
    return (
      <section role="alert" className="surface-card p-8 text-center">
        <p className="text-sm font-semibold text-danger">{error ?? 'Borrower not found'}</p>
        <Link to="/portfolio" className="mt-3 inline-block text-xs font-semibold text-cyan hover:underline">
          Back to portfolio
        </Link>
      </section>
    )
  }

  const outstanding = loans.reduce((total, loan) => total + Number(loan.outstanding_amount), 0)

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <Link to="/portfolio" className="text-xs font-semibold text-cyan hover:underline">
            ← Portfolio
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <DemoDataBadge />
            <DataClassificationBadge classification="SIMULATED" />
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            {borrower.name}
          </h2>
          <p className="mt-2 font-mono text-xs text-slate-500">
            {borrower.zone_id} · {borrower.city}, {borrower.state} · {borrower.sector}
          </p>
        </div>
        {snapshot ? <CanonicalStateBadge state={snapshot.state} /> : null}
      </header>

      {evaluation?.outcome === 'TRIGGER_CANDIDATE' ? (
        <GlassSurface as="section" tint="amber" className="rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="section-kicker text-amber/65">Event · {evaluation.correlation_id}</p>
              <h3 className="mt-2 text-lg font-semibold text-amber">Insurer decision required</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber/75">
                A trigger candidate was computed at {evaluation.observed_value}{' '}
                {evaluation.normalized_unit} against a {evaluation.strike_threshold}{' '}
                {evaluation.normalized_unit} strike. It is not an approved claim or payout.
              </p>
            </div>
            <CanonicalStateBadge state={evaluation.outcome} />
          </div>
        </GlassSurface>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface-card p-5 sm:p-6" aria-labelledby="facility-heading">
          <p className="section-kicker">Synthetic facility</p>
          <h3 id="facility-heading" className="section-title">Loan book</h3>
          <dl className="mt-5 space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="rounded-xl border border-white/7 bg-deep/45 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-300">{loan.loan_type}</p>
                  <DataClassificationBadge classification="SIMULATED" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="text-slate-500">Principal</dt>
                    <dd className="mt-1 font-mono text-slate-300">{formatInr.format(Number(loan.principal_amount))}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">EMI</dt>
                    <dd className="mt-1 font-mono text-slate-300">{formatInr.format(Number(loan.emi_amount))}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Outstanding</dt>
                    <dd className="mt-1 font-mono text-slate-300">{formatInr.format(Number(loan.outstanding_amount))}</dd>
                  </div>
                </div>
              </div>
            ))}
            {loans.length === 0 ? <p className="text-xs text-slate-500">No facilities recorded.</p> : null}
          </dl>
          <p className="mt-4 text-[0.68rem] leading-5 text-slate-600">
            Total outstanding {formatInr.format(outstanding)}. MonsoonCover does not make, change, or
            recommend a lending decision.
          </p>
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="cover-heading">
          <p className="section-kicker">Accepted terms</p>
          <h3 id="cover-heading" className="section-title">Coverage snapshot</h3>
          {snapshot ? (
            <>
              <div className="mt-5 rounded-xl border border-cyan/20 bg-deep/55 p-4">
                <p className="font-mono text-xs font-semibold text-cyan">{snapshot.snapshot_reference}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Immutable copy of the terms accepted on{' '}
                  {new Date(snapshot.accepted_at_utc).toLocaleDateString()}. Later configuration
                  changes do not alter this record.
                </p>
              </div>
              <dl className="mt-4 space-y-3">
                {(
                  [
                    ['Peril', snapshot.trigger_rule_snapshot.peril],
                    ['Strike', `${snapshot.trigger_rule_snapshot.strike_threshold} ${snapshot.trigger_rule_snapshot.normalized_unit}`],
                    ['Cover period', `${snapshot.trigger_rule_snapshot.risk_period_start_local} → ${snapshot.trigger_rule_snapshot.risk_period_end_local}`],
                    ['Zone', snapshot.trigger_rule_snapshot.zone_id],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-white/6 pb-2.5 last:border-0">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="font-mono text-xs text-slate-300">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-teal">Consent record captured</p>
            </>
          ) : (
            <p className="mt-5 text-xs text-slate-500">No accepted policy snapshot for this borrower.</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface-card p-5 sm:p-6" aria-labelledby="exposure-heading">
          <p className="section-kicker">Advisory only</p>
          <h3 id="exposure-heading" className="section-title">Climate exposure</h3>
          {assessment ? (
            <>
              <div className="mt-5 flex items-center justify-between gap-3">
                <CanonicalStateBadge state={assessment.exposure_band} />
                <span className="font-mono text-xs text-slate-400">
                  {assessment.max_daily_value} {assessment.normalized_unit} max daily
                </span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Computed by {assessment.methodology_version} from {assessment.observation_count}{' '}
                observation(s) in {assessment.zone_id}. This does not approve, deny or price credit.
              </p>
            </>
          ) : (
            <p className="mt-5 text-xs text-slate-500">
              No assessment yet. Run one from the Climate Risk screen.
            </p>
          )}
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="eligibility-heading">
          <p className="section-kicker">Separate engine</p>
          <h3 id="eligibility-heading" className="section-title">Policy eligibility</h3>
          {eligibility ? (
            <ul className="mt-5 space-y-2">
              {eligibility.reasons.map((reason) => (
                <li key={reason.constraint} className="flex gap-2 text-[0.68rem] leading-5">
                  <span className={reason.satisfied ? 'text-teal' : 'text-danger'}>
                    {reason.satisfied ? '✓' : '✕'}
                  </span>
                  <span className="text-slate-500">{reason.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-xs text-slate-500">No eligibility check has run for this borrower.</p>
          )}
        </section>
      </div>

      <section className="surface-card p-5 sm:p-6" aria-labelledby="borrower-provenance-heading">
        <p className="section-kicker">Provenance</p>
        <h3 id="borrower-provenance-heading" className="section-title">Where this came from</h3>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference classification="SIMULATED" label="Identity and facility" detail="Synthetic borrower and loan records; no real KYC or credit data is used." />
          <SourceReference classification="DERIVED" label="Exposure" detail="Computed from verified observations by a documented, interpretable methodology." />
          <SourceReference classification="SIMULATED" label="Policy terms" detail="Demo configuration held in an immutable accepted snapshot; not an insurer-issued policy." />
        </div>
      </section>
    </div>
  )
}
