import { DataClassificationBadge, type DataClassification } from './Badges'

type SourceReferenceProps = {
  classification: DataClassification
  label: string
  detail: string
}

export function SourceReference({ classification, label, detail }: SourceReferenceProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/7 bg-deep/45 p-3.5">
      <DataClassificationBadge classification={classification} />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-300">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  )
}
