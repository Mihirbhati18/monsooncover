import { DataClassificationBadge, DemoDataBadge, type DataClassification } from '../data-integrity/Badges'

type PageIntroProps = {
  eyebrow: string
  title: string
  description: string
  classification?: DataClassification
  timestamp?: string
}

export function PageIntro({
  eyebrow,
  title,
  description,
  classification = 'SIMULATED',
  timestamp = '03 Sep 2026 · 00:15 IST',
}: PageIntroProps) {
  return (
    <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <DemoDataBadge />
          <DataClassificationBadge classification={classification} />
        </div>
        <p className="section-kicker mt-5">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <div className="shrink-0 rounded-xl border border-white/8 bg-panel/70 px-4 py-3 text-left xl:text-right">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Data as of
        </p>
        <p className="mt-1 font-mono text-xs text-slate-300">{timestamp}</p>
      </div>
    </header>
  )
}
