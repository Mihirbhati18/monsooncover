import { useCallback, useEffect, useState } from 'react'
import { CanonicalStateBadge, DataClassificationBadge } from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { PageIntro } from '../components/foundation/PageIntro'
import { ExposureBarChart, type ExposureBar } from '../components/finance/ExposureBarChart'
import { LazyPortfolioMap } from '../components/finance/lazyVisuals'
import { demoPortfolio } from '../features/portfolio/demoPortfolio'
import { api } from '../services/api'
import type { Borrower, PolicyEligibility, RiskAssessment } from '../services/types'

const bandToChartBand: Record<string, ExposureBar['band']> = {
  HIGH: 'High',
  MODERATE: 'Moderate',
  LOW: 'Low',
}

export function ClimateRiskPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [eligibility, setEligibility] = useState<PolicyEligibility[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [borrowerList, assessmentList, eligibilityList] = await Promise.all([
        api.listBorrowers(),
        api.listRiskAssessments(),
        api.listEligibility(),
      ])
      setBorrowers(borrowerList)
      setAssessments(assessmentList)
      setEligibility(eligibilityList)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load risk assessments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function assessAll() {
    setBusy(true)
    setError(null)
    try {
      for (const borrower of borrowers) {
        await api.assessBorrowerRisk(borrower.id)
        await api.checkEligibility(borrower.id)
      }
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Assessment failed')
    } finally {
      setBusy(false)
    }
  }

  const latest = assessments[assessments.length - 1] ?? null
  const nameFor = (borrowerId: string) =>
    borrowers.find((item) => item.id === borrowerId)?.name ?? borrowerId

  const chartData: ExposureBar[] = assessments.map((assessment) => ({
    city: nameFor(assessment.borrower_id).slice(0, 14),
    exposureCr: Number(assessment.total_value) / 100,
    band: bandToChartBand[assessment.exposure_band] ?? 'Low',
  }))

  const highCount = assessments.filter((item) => item.exposure_band === 'HIGH').length

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Advisory portfolio intelligence"
        title="Climate risk"
        description="Exposure is computed from verified observations by a documented, interpretable methodology. It is advisory only: it never approves, denies or prices credit, and it never makes a policy applicable."
        classification="DERIVED"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={assessAll}
          disabled={busy || borrowers.length === 0}
          className="rounded-xl bg-cyan px-4 py-2.5 text-sm font-bold text-deep transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Assessing…' : 'Assess climate risk'}
        </button>
        <p className="text-xs text-slate-500">
          Runs the risk engine and the separate policy-matching engine for every demo borrower.
        </p>
      </div>

      {error ? (
        <section role="alert" className="rounded-2xl border border-danger/25 bg-danger/7 p-5">
          <p className="text-sm font-semibold text-danger">Could not reach the risk engine</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{error}</p>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Climate exposure summary">
        {(
          [
            ['Assessments', String(assessments.length).padStart(2, '0'), 'Computed from observations'],
            ['High exposure', String(highCount).padStart(2, '0'), 'Advisory band only'],
            ['Eligible policies', String(eligibility.filter((e) => e.is_eligible).length).padStart(2, '0'), 'Matched on explicit constraints'],
            ['Methodology', latest?.methodology_version ?? 'risk-engine-v1', 'Interpretable rules, no ML'],
          ] as const
        ).map(([label, value, detail]) => (
          <article key={label} className="surface-card p-5">
            <div className="flex justify-between gap-3">
              <p className="text-xs text-slate-400">{label}</p>
              <DataClassificationBadge classification="DERIVED" />
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
          <p className="mt-3 text-[0.65rem] leading-5 text-slate-600">
            Map markers remain interface fixtures; the exposure bands beside them are computed.
          </p>
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="concentration-heading">
          <p className="section-kicker">Computed exposure</p>
          <h2 id="concentration-heading" className="section-title">Concentration profile</h2>

          {loading ? (
            <div role="status" aria-label="Loading exposure" className="mt-6 h-56 animate-pulse rounded-xl bg-white/4" />
          ) : null}

          {!loading && assessments.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No assessment has been run yet. Use “Assess climate risk” to compute exposure from the
              registered dataset.
            </p>
          ) : null}

          {assessments.length > 0 ? (
            <>
              <div className="mt-6">
                <ExposureBarChart data={chartData} />
              </div>
              <ul className="mt-4 space-y-1.5">
                {assessments.map((assessment) => (
                  <li key={assessment.id} className="flex items-center justify-between gap-4 text-xs">
                    <span className="font-medium text-slate-300">{nameFor(assessment.borrower_id)}</span>
                    <span className="flex items-center gap-2 font-mono text-slate-500">
                      {assessment.max_daily_value} {assessment.normalized_unit} max
                      <CanonicalStateBadge state={assessment.exposure_band} />
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <div className="mt-6 rounded-xl border border-cyan/15 bg-cyan/5 p-4">
            <p className="text-xs font-semibold text-cyan">Advisory boundary</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              No climate exposure shown here may be used to approve, deny, or price credit.
            </p>
          </div>
        </section>
      </div>

      {latest ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="surface-card p-5 sm:p-6" aria-labelledby="methodology-heading">
            <p className="section-kicker">How the band was reached</p>
            <h2 id="methodology-heading" className="section-title">
              Methodology · {latest.methodology_version}
            </h2>
            <ol className="mt-5 space-y-3">
              {latest.methodology_steps.map((step) => (
                <li key={step.step} className="rounded-xl border border-white/7 bg-deep/45 p-3.5">
                  <p className="font-mono text-[0.62rem] uppercase tracking-wider text-cyan">{step.step}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">{step.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="surface-card p-5 sm:p-6" aria-labelledby="eligibility-heading">
            <p className="section-kicker">Separate engine</p>
            <h2 id="eligibility-heading" className="section-title">Policy eligibility</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Matching checks explicit policy constraints. A climate exposure band never creates
              eligibility on its own.
            </p>
            <div className="mt-5 space-y-4">
              {eligibility.map((item) => (
                <article key={item.id} className="rounded-xl border border-white/7 bg-deep/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-300">{nameFor(item.borrower_id)}</p>
                    <CanonicalStateBadge state={item.is_eligible ? 'ACTIVE' : 'NOT_COVERED'} />
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {item.reasons.map((reason) => (
                      <li key={reason.constraint} className="flex gap-2 text-[0.68rem] leading-5">
                        <span className={reason.satisfied ? 'text-teal' : 'text-danger'}>
                          {reason.satisfied ? '✓' : '✕'}
                        </span>
                        <span className="text-slate-500">{reason.detail}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
              {eligibility.length === 0 ? (
                <p className="text-xs text-slate-500">No eligibility check has run yet.</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      <section className="surface-card p-5 sm:p-6" aria-labelledby="risk-method-heading">
        <p className="section-kicker">Method and provenance</p>
        <h2 id="risk-method-heading" className="section-title">No hidden model outputs</h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference
            classification="DERIVED"
            label="Exposure bands"
            detail="Computed by risk-engine-v1 from verified observations using documented thresholds. Every band ships with the steps that produced it."
          />
          <SourceReference
            classification="SIMULATED"
            label="Observation source"
            detail="Synthetic dataset DS-MC-RAIN-2026-01. Not agency observation data."
          />
          <SourceReference
            classification="DERIVED"
            label="Eligibility"
            detail="Matched on geography, peril, risk period, policy state and settlement source. Climate exposure is explicitly not an input."
          />
        </div>
      </section>
    </div>
  )
}
