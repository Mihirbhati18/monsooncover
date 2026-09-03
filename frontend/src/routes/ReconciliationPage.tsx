import { useCallback, useEffect, useState } from 'react'
import { CanonicalStateBadge, DataClassificationBadge } from '../components/data-integrity/Badges'
import { PageIntro } from '../components/foundation/PageIntro'
import { GlassSurface } from '../visuals/glass/GlassSurface'
import { api } from '../services/api'
import type {
  ExceptionCase,
  InsurerDecision,
  LenderPosting,
  Payout,
  ReconciliationRecord,
} from '../services/types'

type ChainState = {
  decisions: InsurerDecision[]
  payouts: Payout[]
  postings: LenderPosting[]
  reconciliations: ReconciliationRecord[]
  exceptions: ExceptionCase[]
}

const EMPTY: ChainState = {
  decisions: [],
  payouts: [],
  postings: [],
  reconciliations: [],
  exceptions: [],
}

export function ReconciliationPage() {
  const [state, setState] = useState<ChainState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [decisions, payouts, postings, reconciliations, exceptions] = await Promise.all([
        api.listInsurerDecisions(),
        api.listPayouts(),
        api.listPostings(),
        api.listReconciliations(),
        api.listExceptions(),
      ])
      setState({ decisions, payouts, postings, reconciliations, exceptions })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load settlement records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function runStep(label: string, action: () => Promise<unknown>) {
    setBusy(label)
    setError(null)
    try {
      await action()
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `${label} failed`)
    } finally {
      setBusy(null)
    }
  }

  const approved = state.decisions.filter((decision) => decision.outcome === 'APPROVED')
  const nextDecision = approved.find(
    (decision) => !state.payouts.some((payout) => payout.correlation_id === decision.correlation_id),
  )
  const nextPayoutToPost = state.payouts.find(
    (payout) => !state.postings.some((posting) => posting.payout_reference === payout.payout_reference),
  )
  const nextPayoutToReconcile = state.payouts.find(
    (payout) =>
      !state.reconciliations.some((record) => record.correlation_id === payout.correlation_id),
  )

  const summary = [
    ['Approved decisions', approved.length, 'Insurer sandbox outcomes'],
    ['Payouts', state.payouts.length, 'Illustrative payout events'],
    ['Lender postings', state.postings.length, 'Recorded against demo loans'],
    ['Open exceptions', state.exceptions.filter((item) => item.state === 'OPEN').length, 'Manual review required'],
  ] as const

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Posting and settlement checks"
        title="Reconciliation"
        description="Keep insurer payment, lender receipt, loan posting, and final matching as distinct, auditable states. Source records are never overwritten to hide a mismatch."
        classification="DERIVED"
      />

      {error ? (
        <section role="alert" className="rounded-2xl border border-danger/25 bg-danger/7 p-5">
          <p className="text-sm font-semibold text-danger">Settlement action failed</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{error}</p>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Reconciliation summary">
        {summary.map(([label, value, detail]) => (
          <article key={label} className="surface-card p-5">
            <div className="flex justify-between gap-3">
              <p className="text-xs text-slate-400">{label}</p>
              <DataClassificationBadge classification="DERIVED" />
            </div>
            <p className="mt-4 font-mono text-2xl font-semibold text-white">
              {String(value).padStart(2, '0')}
            </p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="surface-card p-5 sm:p-6" aria-labelledby="settlement-actions-heading">
        <p className="section-kicker">Ordered settlement steps</p>
        <h2 id="settlement-actions-heading" className="section-title">
          Advance the chain
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Each step is refused by the server unless the one before it has happened. A payout
          requires insurer approval; a posting requires a payout reference.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            disabled={!nextDecision || busy !== null}
            onClick={() =>
              nextDecision && runStep('Payout', () => api.createPayout(nextDecision.id))
            }
            className="rounded-xl border border-white/10 bg-deep/60 px-4 py-3 text-xs font-bold text-slate-300 transition-colors hover:border-cyan/40 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy === 'Payout' ? 'Initiating…' : '1 · Initiate payout'}
          </button>
          <button
            type="button"
            disabled={!nextPayoutToPost || busy !== null}
            onClick={() =>
              nextPayoutToPost && runStep('Posting', () => api.createPosting(nextPayoutToPost.id))
            }
            className="rounded-xl border border-white/10 bg-deep/60 px-4 py-3 text-xs font-bold text-slate-300 transition-colors hover:border-cyan/40 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy === 'Posting' ? 'Posting…' : '2 · Post to lender'}
          </button>
          <button
            type="button"
            disabled={!nextPayoutToReconcile || busy !== null}
            onClick={() =>
              nextPayoutToReconcile &&
              runStep('Reconciliation', () => api.runReconciliation(nextPayoutToReconcile.id))
            }
            className="rounded-xl border border-white/10 bg-deep/60 px-4 py-3 text-xs font-bold text-slate-300 transition-colors hover:border-cyan/40 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy === 'Reconciliation' ? 'Reconciling…' : '3 · Run reconciliation'}
          </button>
        </div>
      </section>

      {state.exceptions
        .filter((item) => item.state === 'OPEN')
        .map((item) => (
          <GlassSurface
            key={item.id}
            as="section"
            tint="danger"
            className="rounded-2xl p-5 sm:p-6"
            aria-labelledby={`exception-${item.id}`}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="section-kicker text-danger/70">Exception · {item.case_reference}</p>
                <h2 id={`exception-${item.id}`} className="mt-2 text-lg font-semibold text-danger">
                  {item.summary}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{item.detail}</p>
                <p className="mt-2 text-xs text-slate-600">
                  Both source records are preserved. Resolution requires an actor, reason and linked
                  audit event.
                </p>
              </div>
              <CanonicalStateBadge state={item.state} />
            </div>
          </GlassSurface>
        ))}

      <section className="surface-card overflow-hidden" aria-labelledby="reconciliation-register-heading">
        <div className="border-b border-white/7 p-5 sm:p-6">
          <p className="section-kicker">Settlement register</p>
          <h2 id="reconciliation-register-heading" className="section-title">
            Insurer and lender records
          </h2>
          <p aria-live="polite" className="mt-2 text-xs text-slate-500">
            {loading
              ? 'Loading settlement records…'
              : `${state.reconciliations.length} reconciliation record(s)`}
          </p>
        </div>

        {!loading && state.reconciliations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-300">Nothing reconciled yet</p>
            <p className="mt-2 text-xs text-slate-500">
              Approve a candidate in the insurer sandbox, then advance the steps above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead>
                <tr className="border-b border-white/7 bg-deep/35 text-[0.65rem] uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-6 py-3.5">Correlation</th>
                  <th className="px-4 py-3.5">Insurer record</th>
                  <th className="px-4 py-3.5">Lender record</th>
                  <th className="px-4 py-3.5">Difference</th>
                  <th className="px-4 py-3.5">Result</th>
                </tr>
              </thead>
              <tbody>
                {state.reconciliations.map((record) => (
                  <tr key={record.id} className="border-b border-white/6 last:border-0">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {record.correlation_id}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-400">
                      {record.insurer_amount ?? '—'}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-400">
                      {record.lender_amount ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {record.difference_reason ?? 'Records match'}
                    </td>
                    <td className="px-4 py-4">
                      <CanonicalStateBadge state={record.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface-card p-5 sm:p-6" aria-labelledby="reconciliation-rule-heading">
        <p className="section-kicker">Matching contract</p>
        <h2 id="reconciliation-rule-heading" className="section-title">
          What must agree
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            'Borrower, loan, and policy',
            'Amount and currency',
            'Payment and posting references',
            'Correlation and idempotency keys',
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-white/7 bg-deep/45 p-4 text-xs leading-5 text-slate-400"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
