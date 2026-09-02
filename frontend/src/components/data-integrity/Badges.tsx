export type DataClassification = 'REAL' | 'DERIVED' | 'SIMULATED'

const classificationStyles: Record<DataClassification, string> = {
  REAL: 'border-cyan/30 bg-cyan/10 text-cyan',
  DERIVED: 'border-violet-300/25 bg-violet-300/8 text-violet-200',
  SIMULATED: 'border-amber/30 bg-amber/10 text-amber',
}

export function DataClassificationBadge({
  classification,
}: {
  classification: DataClassification
}) {
  return (
    <span
      aria-label={`Data classification: ${classification}`}
      className={`inline-flex rounded-md border px-2 py-1 font-mono text-[0.62rem] font-bold tracking-[0.12em] ${classificationStyles[classification]}`}
    >
      {classification}
    </span>
  )
}

export function DemoDataBadge() {
  return (
    <span className="inline-flex rounded-md border border-amber/30 bg-amber/10 px-2 py-1 text-[0.62rem] font-bold tracking-[0.12em] text-amber">
      DEMO DATA
    </span>
  )
}

const stateStyles: Record<string, string> = {
  TRIGGER_CANDIDATE: 'border-amber/35 bg-amber/10 text-amber',
  INSURER_APPROVED: 'border-cyan/35 bg-cyan/10 text-cyan',
  LOAN_POSTED: 'border-monsoon/35 bg-monsoon/10 text-sky-200',
  RECONCILED: 'border-teal/35 bg-teal/10 text-teal',
  ACTIVE: 'border-teal/35 bg-teal/10 text-teal',
  OFFERED: 'border-cyan/35 bg-cyan/10 text-cyan',
  NOT_COVERED: 'border-white/15 bg-white/5 text-slate-400',
  EXPIRED: 'border-white/12 bg-white/4 text-slate-500',
  MONITORING: 'border-cyan/25 bg-cyan/8 text-cyan',
  EVENT_OBSERVED: 'border-monsoon/30 bg-monsoon/9 text-sky-200',
  MISMATCH: 'border-danger/35 bg-danger/10 text-danger',
  IN_REVIEW: 'border-amber/35 bg-amber/10 text-amber',
  VERIFIED: 'border-teal/30 bg-teal/8 text-teal',
  RECORDED: 'border-cyan/25 bg-cyan/8 text-cyan',
  REGISTERED: 'border-cyan/25 bg-cyan/8 text-cyan',
  DISCLOSED: 'border-amber/25 bg-amber/8 text-amber',
}

export function CanonicalStateBadge({ state }: { state: string }) {
  return (
    <span
      aria-label={`Canonical state: ${state}`}
      className={`inline-flex rounded-md border px-2.5 py-1 font-mono text-[0.65rem] font-bold tracking-[0.08em] ${stateStyles[state] ?? 'border-white/15 bg-white/5 text-slate-300'}`}
    >
      {state}
    </span>
  )
}
