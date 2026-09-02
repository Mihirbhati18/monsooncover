import { CanonicalStateBadge, DataClassificationBadge } from '../components/data-integrity/Badges'
import { PageIntro } from '../components/foundation/PageIntro'

const records = [
  { id: 'MC-REC-001', borrower: 'Kaveri Foods', insurer: '₹40,000 · PAID', lender: '₹40,000 · POSTED', result: 'RECONCILED' },
  { id: 'MC-REC-002', borrower: 'ABC Textiles', insurer: 'Decision pending', lender: 'Not requested', result: 'NOT_READY' },
  { id: 'MC-REC-003', borrower: 'Coastal Cold Chain', insurer: '₹25,000 · PAID', lender: 'No receipt', result: 'MISMATCH' },
]

export function ReconciliationPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Posting and settlement checks" title="Reconciliation" description="Keep insurer payment, lender receipt, loan posting, and final matching as distinct, auditable states. Source records are never overwritten to hide a mismatch." />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Reconciliation summary">
        {[
          ['Ready to reconcile', '01', 'Posting records available'],
          ['Reconciled', '01', 'Final matched state'],
          ['Mismatches', '01', 'Exception opened'],
          ['Not ready', '01', 'Upstream steps incomplete'],
        ].map(([label, value, detail]) => (
          <article key={label} className="surface-card p-5">
            <div className="flex justify-between gap-3"><p className="text-xs text-slate-400">{label}</p><DataClassificationBadge classification="SIMULATED" /></div>
            <p className="mt-4 font-mono text-2xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-danger/25 bg-danger/7 p-5 sm:p-6" aria-labelledby="mismatch-heading">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="section-kicker text-danger/70">Exception · MC-EXC-0007</p>
            <h2 id="mismatch-heading" className="mt-2 text-lg font-semibold text-danger">Paid record has no lender match</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">The insurer sandbox says ₹25,000 was paid, while the lender sandbox has no receipt or posting. Both source records remain unchanged and manual review is required.</p>
          </div>
          <CanonicalStateBadge state="MISMATCH" />
        </div>
      </section>

      <section className="surface-card overflow-hidden" aria-labelledby="reconciliation-register-heading">
        <div className="border-b border-white/7 p-5 sm:p-6">
          <p className="section-kicker">Settlement register</p>
          <h2 id="reconciliation-register-heading" className="section-title">Insurer and lender records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead><tr className="border-b border-white/7 bg-deep/35 text-[0.65rem] uppercase tracking-[0.12em] text-slate-500"><th className="px-6 py-3.5">Reference</th><th className="px-4 py-3.5">Borrower</th><th className="px-4 py-3.5">Insurer record</th><th className="px-4 py-3.5">Lender record</th><th className="px-4 py-3.5">Result</th></tr></thead>
            <tbody>{records.map((record) => <tr key={record.id} className="border-b border-white/6 last:border-0"><td className="px-6 py-4 font-mono text-xs text-slate-500">{record.id}</td><td className="px-4 py-4 text-sm font-medium text-slate-300">{record.borrower}</td><td className="px-4 py-4 text-xs text-slate-400">{record.insurer}</td><td className="px-4 py-4 text-xs text-slate-400">{record.lender}</td><td className="px-4 py-4"><CanonicalStateBadge state={record.result} /></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="surface-card p-5 sm:p-6" aria-labelledby="reconciliation-rule-heading">
        <p className="section-kicker">Matching contract</p>
        <h2 id="reconciliation-rule-heading" className="section-title">What must agree</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['Borrower, loan, and policy', 'Amount and currency', 'Payment and posting references', 'Correlation and idempotency keys'].map((item) => <div key={item} className="rounded-xl border border-white/7 bg-deep/45 p-4 text-xs leading-5 text-slate-400">{item}</div>)}
        </div>
      </section>
    </div>
  )
}
