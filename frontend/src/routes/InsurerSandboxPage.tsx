import { useState } from 'react'
import { CanonicalStateBadge, DataClassificationBadge, DemoDataBadge } from '../components/data-integrity/Badges'

type Decision = 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_DATA'

export function InsurerSandboxPage() {
  const [decision, setDecision] = useState<Decision | null>(null)
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState<Decision | null>(null)
  const canSubmit = Boolean(decision && reason.trim().length >= 12 && confirmed)

  return (
    <div className="space-y-6">
      <header className="role-hero role-hero--insurer rounded-2xl border border-white/10 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="flex gap-2"><DemoDataBadge /><span className="rounded-md border border-violet-300/25 bg-violet-300/8 px-2 py-1 text-[0.62rem] font-bold tracking-[0.12em] text-violet-200">INSURER SANDBOX</span></div><p className="section-kicker mt-5">Independent decision workspace</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">Candidate review</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Review evidence and record a sandbox decision. MonsoonCover presents the packet but cannot make this decision.</p></div><CanonicalStateBadge state={submitted ?? 'PENDING'} /></div>
      </header>

      {submitted ? <section className="rounded-2xl border border-teal/25 bg-teal/7 p-6" role="status"><p className="font-semibold text-teal">Sandbox decision recorded: {submitted}</p><p className="mt-2 text-sm text-slate-400">Local frontend demonstration only. No claim, payout, or external instruction was created.</p></section> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-card p-5 sm:p-6" aria-labelledby="insurer-evidence-heading">
          <div className="flex justify-between gap-3"><div><p className="section-kicker">MC-DEMO-00427</p><h2 id="insurer-evidence-heading" className="section-title">Evidence packet</h2></div><CanonicalStateBadge state="TRIGGER_CANDIDATE" /></div>
          <div className="mt-5 rounded-xl border border-amber/20 bg-amber/6 p-4"><p className="text-sm font-semibold text-amber">Candidate—not an approved claim</p><p className="mt-1.5 text-xs leading-5 text-amber/75">The deterministic demo comparison reached its configured threshold. Independent review remains mandatory.</p></div>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            {[['Borrower', 'ABC Textiles', 'SIMULATED'], ['Policy snapshot', 'MC-PS-2026-0142-v1', 'SIMULATED'], ['Observation', '184 mm', 'DERIVED'], ['Demo threshold', '160 mm', 'SIMULATED'], ['Window', '27–28 Aug 2026', 'SIMULATED'], ['Correlation', 'EVENT-MC-2026-00427', 'DERIVED']].map(([label, value, classification]) => <div key={label}><dt className="flex items-center justify-between gap-2 text-xs text-slate-500"><span>{label}</span><DataClassificationBadge classification={classification as 'REAL' | 'DERIVED' | 'SIMULATED'} /></dt><dd className="mt-2 font-mono text-sm font-semibold text-slate-200">{value}</dd></div>)}
          </dl>
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="decision-panel-heading">
          <p className="section-kicker">Authorized insurer action</p><h2 id="decision-panel-heading" className="section-title">Record decision</h2>
          <fieldset className="mt-5"><legend className="text-xs font-semibold text-slate-400">Decision outcome</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{(['APPROVED', 'REJECTED', 'NEEDS_MORE_DATA'] as Decision[]).map((option) => <button key={option} type="button" aria-pressed={decision === option} onClick={() => { setDecision(option); setSubmitted(null) }} className={`rounded-lg border px-3 py-3 text-[0.68rem] font-bold transition-colors ${decision === option ? 'border-cyan/45 bg-cyan/12 text-cyan' : 'border-white/8 bg-deep/50 text-slate-500 hover:text-slate-300'}`}>{option.replaceAll('_', ' ')}</button>)}</div></fieldset>
          <label className="mt-5 block"><span className="text-xs font-semibold text-slate-400">Decision reason <span className="text-danger">required</span></span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Provide a clear evidence-based reason…" className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-deep/65 p-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan/50" /><span className="mt-1 block text-[0.65rem] text-slate-600">Minimum 12 characters</span></label>
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/7 bg-deep/45 p-4"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 accent-cyan" /><span className="text-xs leading-5 text-slate-400">I confirm this is an independent insurer-sandbox decision and understand it is not a real claim action.</span></label>
          <button type="button" disabled={!canSubmit} onClick={() => decision && setSubmitted(decision)} className="mt-4 w-full rounded-xl bg-cyan px-4 py-3 text-sm font-bold text-deep transition-opacity disabled:cursor-not-allowed disabled:opacity-30">Submit sandbox decision</button>
        </section>
      </div>
    </div>
  )
}
