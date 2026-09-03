import { useEffect, useState } from 'react'
import {
  CanonicalStateBadge,
  DataClassificationBadge,
  DemoDataBadge,
} from '../components/data-integrity/Badges'
import { GlassSurface } from '../visuals/glass/GlassSurface'
import { api } from '../services/api'
import type { ActivationGate, ClimateDataset, EvidenceRecord, ExceptionCase } from '../services/types'

const ADAPTERS = [
  ['HistoricalCSVProvider', 'Climate settlement source; verified against its manifest checksum'],
  ['SandboxInsurerAdapter', 'Holds submissions at PENDING until a human decides; no external insurer'],
  ['SandboxLenderAdapter', 'Records an illustrative credit; no money moves'],
] as const

export function AdminPage() {
  const [datasets, setDatasets] = useState<ClimateDataset[]>([])
  const [exceptions, setExceptions] = useState<ExceptionCase[]>([])
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([])
  const [gate, setGate] = useState<ActivationGate | null>(null)
  const [auditCount, setAuditCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.listClimateDatasets(),
      api.listExceptions(),
      api.listEvidence(),
      api.listAuditEvents(),
      api.getActivationGate('MC-DEMO-POL-RAIN-01').catch(() => null),
    ])
      .then(([datasetList, exceptionList, evidenceList, auditEvents, gateResult]) => {
        if (cancelled) return
        setDatasets(datasetList)
        setExceptions(exceptionList)
        setEvidence(evidenceList)
        setAuditCount(auditEvents.length)
        setGate(gateResult)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Could not load platform state')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const openExceptions = exceptions.filter((item) => item.state === 'OPEN')

  const summary = [
    ['Adapters', `${ADAPTERS.length} / ${ADAPTERS.length}`, 'Sandbox services available'],
    ['Datasets', String(datasets.length).padStart(2, '0'), 'Registered and checksummed'],
    ['Evidence records', String(evidence.length).padStart(2, '0'), 'Registry entries'],
    ['Open exceptions', String(openExceptions.length).padStart(2, '0'), 'Manual review required'],
  ] as const

  return (
    <div className="space-y-6">
      <header className="role-hero role-hero--admin rounded-2xl border border-white/10 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex gap-2">
              <DemoDataBadge />
              <span className="rounded-md border border-white/12 bg-white/5 px-2 py-1 text-[0.62rem] font-bold tracking-[0.12em] text-slate-300">
                ADMIN
              </span>
            </div>
            <p className="section-kicker mt-5">Platform operations</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
              System health &amp; exceptions
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Monitor sandbox adapters, registered datasets, evidence coverage, and audit
              continuity. Business calculations are not reimplemented here.
            </p>
          </div>
          <CanonicalStateBadge state="DEMO_MODE" />
        </div>
      </header>

      {error ? (
        <section role="alert" className="rounded-2xl border border-danger/25 bg-danger/7 p-5">
          <p className="text-sm font-semibold text-danger">Could not load platform state</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{error}</p>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Administration summary">
        {summary.map(([label, value, detail]) => (
          <GlassSurface as="article" key={label} className="p-5">
            <div className="flex justify-between gap-3">
              <p className="text-xs text-slate-400">{label}</p>
              <DataClassificationBadge classification="DERIVED" />
            </div>
            <p className="mt-4 font-mono text-2xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </GlassSurface>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="surface-card p-5 sm:p-6" aria-labelledby="adapter-heading">
          <p className="section-kicker">Replaceable integrations</p>
          <h2 id="adapter-heading" className="section-title">Adapter health</h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Domain logic depends on the adapter contracts, never on these implementations. Sandbox
            state is held in process and clears on restart.
          </p>
          <div className="mt-5 space-y-3">
            {ADAPTERS.map(([name, detail]) => (
              <div key={name} className="flex items-center justify-between gap-4 rounded-xl border border-white/7 bg-deep/45 p-4">
                <div>
                  <p className="font-mono text-xs font-semibold text-slate-300">{name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                </div>
                <CanonicalStateBadge state="READY" />
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="dataset-heading">
          <p className="section-kicker">Offline reproducibility</p>
          <h2 id="dataset-heading" className="section-title">Dataset registry</h2>
          <div className="mt-5 space-y-3">
            {datasets.map((dataset) => (
              <div key={dataset.id} className="rounded-xl border border-white/7 bg-deep/45 p-5">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-300">{dataset.original_filename}</p>
                    <p className="mt-1 font-mono text-[0.65rem] text-slate-600">{dataset.dataset_code}</p>
                  </div>
                  <DataClassificationBadge classification={dataset.source_classification} />
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-slate-500">Checksum</dt>
                    <dd className="mt-1 font-mono text-[0.62rem] text-slate-300">
                      sha256 {dataset.original_sha256.slice(0, 12)}…
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Coverage</dt>
                    <dd className="mt-1 text-xs text-slate-300">{dataset.temporal_coverage}</dd>
                  </div>
                </dl>
                {dataset.known_gaps_or_caveats ? (
                  <p className="mt-3 text-[0.65rem] leading-5 text-slate-600">
                    {dataset.known_gaps_or_caveats}
                  </p>
                ) : null}
              </div>
            ))}
            {datasets.length === 0 ? (
              <p className="text-xs text-slate-500">No registered datasets.</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="surface-card p-5 sm:p-6" aria-labelledby="gate-heading">
          <p className="section-kicker">Evidence coverage</p>
          <h2 id="gate-heading" className="section-title">Activation gate</h2>
          {gate ? (
            <>
              <div className="mt-5 flex items-center justify-between gap-3">
                <CanonicalStateBadge state={gate.can_activate ? 'VERIFIED' : 'IN_REVIEW'} />
                <span className="text-xs text-slate-400">{gate.summary}</span>
              </div>
              {gate.blocking_errors.length > 0 ? (
                <ul className="mt-4 space-y-1.5">
                  {gate.blocking_errors.map((message) => (
                    <li key={message} className="text-[0.68rem] leading-5 text-danger/80">{message}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="mt-5 text-xs text-slate-500">Gate status unavailable.</p>
          )}
          <p className="mt-5 text-xs text-slate-500">
            Audit chain: <span className="font-mono text-slate-300">{auditCount}</span> append-only
            events recorded.
          </p>
        </section>

        <section className="surface-card p-5 sm:p-6" aria-labelledby="admin-exception-heading">
          <p className="section-kicker">Manual review queue</p>
          <h2 id="admin-exception-heading" className="section-title">
            {openExceptions.length === 0 ? 'No open exceptions' : `Open exceptions (${openExceptions.length})`}
          </h2>
          {openExceptions.length === 0 ? (
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Nothing awaiting manual review. A reconciliation mismatch opens a case here and
              preserves both source records.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {openExceptions.map((item) => (
                <li key={item.id} className="rounded-xl border border-danger/20 bg-danger/6 p-4">
                  <p className="font-mono text-[0.65rem] text-danger/70">{item.case_reference}</p>
                  <p className="mt-1 text-sm font-semibold text-danger">{item.summary}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
