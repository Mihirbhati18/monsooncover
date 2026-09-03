import { useEffect, useState } from 'react'
import { CanonicalStateBadge, DataClassificationBadge } from '../components/data-integrity/Badges'
import { SourceReference } from '../components/data-integrity/SourceReference'
import { PageIntro } from '../components/foundation/PageIntro'
import { GlassSurface } from '../visuals/glass/GlassSurface'
import { api } from '../services/api'
import type { ActivationGate, PolicySnapshot, PolicyVersion } from '../services/types'

export function PoliciesPage() {
  const [versions, setVersions] = useState<PolicyVersion[]>([])
  const [snapshots, setSnapshots] = useState<PolicySnapshot[]>([])
  const [gate, setGate] = useState<ActivationGate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    api
      .listPolicyVersions()
      .then(async (versionList) => {
        if (cancelled) return
        setVersions(versionList)
        const [snapshotList, gateResult] = await Promise.all([
          api.listPolicySnapshots(),
          versionList.length > 0
            ? api.getActivationGate(versionList[0].product_code)
            : Promise.resolve(null),
        ])
        if (cancelled) return
        setSnapshots(snapshotList)
        setGate(gateResult)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Could not load policies')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const version = versions[0] ?? null
  const rule = version?.trigger_rule ?? {}

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Reference and demo terms"
        title="Policies"
        description="Inspect versioned policy references, accepted borrower snapshots, and evidence-gate status without implying a live insurer product or partnership."
      />

      {error ? (
        <section role="alert" className="rounded-2xl border border-danger/25 bg-danger/7 p-5">
          <p className="text-sm font-semibold text-danger">Could not load policies</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{error}</p>
        </section>
      ) : null}

      {loading ? <div role="status" aria-label="Loading policies" className="surface-card h-56 animate-pulse" /> : null}

      {version ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <GlassSurface as="section" className="p-5 sm:p-6" aria-labelledby="policy-reference-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="section-kicker">
                  {version.product_code} · v{version.version}
                </p>
                <h2 id="policy-reference-heading" className="section-title">
                  {version.display_name}
                </h2>
              </div>
              <DataClassificationBadge classification={version.classification} />
            </div>

            <div className="mt-5 rounded-xl border border-amber/20 bg-amber/6 p-4 text-xs leading-5 text-amber/80">
              Demo configuration only. This is not an insurer-issued policy, offer, endorsement, or
              proof of partnership.
            </div>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {(
                [
                  ['Peril', rule.peril],
                  ['Index', `${rule.aggregation} of ${rule.parameter}`],
                  ['Strike', `${rule.strike_threshold} ${rule.normalized_unit}`],
                  ['Near-trigger band', `${rule.near_trigger_threshold} ${rule.normalized_unit}`],
                  ['Covered zone', rule.zone_id],
                  ['Cover period', `${rule.risk_period_start_local} → ${rule.risk_period_end_local}`],
                  ['Event window', `${rule.event_window_start_local ?? rule.risk_period_start_local} → ${rule.event_window_end_local ?? rule.risk_period_end_local}`],
                  ['Settlement source', rule.required_provider],
                  ['Policy timezone', rule.policy_timezone],
                  ['Disclosure', version.disclosure_version],
                ] as const
              ).map(([term, value]) => (
                <div key={term}>
                  <dt className="text-xs text-slate-500">{term}</dt>
                  <dd className="mt-1.5 font-mono text-xs font-medium text-slate-200">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </GlassSurface>

          <section className="surface-card p-5 sm:p-6" aria-labelledby="snapshot-heading">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-kicker">Accepted by borrowers</p>
                <h2 id="snapshot-heading" className="section-title">Immutable snapshots</h2>
              </div>
              <DataClassificationBadge classification="SIMULATED" />
            </div>

            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="mt-5 rounded-xl border border-cyan/20 bg-deep/55 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs font-semibold text-cyan">{snapshot.snapshot_reference}</p>
                  <CanonicalStateBadge state={snapshot.state} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-200">Borrower-specific copy</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Created when the borrower accepted the displayed terms on{' '}
                  {new Date(snapshot.accepted_at_utc).toLocaleDateString()}. Later configuration
                  changes do not alter this record.
                </p>
                <p className="mt-3 font-mono text-[0.62rem] text-slate-600">
                  checksum {snapshot.snapshot_checksum}
                </p>
              </div>
            ))}
            {snapshots.length === 0 && !loading ? (
              <p className="mt-5 text-xs text-slate-500">No accepted snapshots yet.</p>
            ) : null}
          </section>
        </div>
      ) : null}

      {gate ? (
        <section className="surface-card overflow-hidden" aria-labelledby="gates-heading">
          <div className="border-b border-white/7 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="section-kicker">Activation controls</p>
                <h2 id="gates-heading" className="section-title">Evidence-gate register</h2>
              </div>
              <CanonicalStateBadge state={gate.can_activate ? 'VERIFIED' : 'IN_REVIEW'} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{gate.summary}</p>
          </div>
          <div className="divide-y divide-white/6">
            {gate.satisfied_fields.map((field) => (
              <div key={field} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                <p className="font-mono text-xs text-slate-400">{field}</p>
                <span className="text-[0.68rem] font-semibold text-teal">evidence registered</span>
              </div>
            ))}
            {gate.blocking_errors.map((message) => (
              <div key={message} className="px-5 py-3 sm:px-6">
                <p className="text-xs text-danger">{message}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-white/7 px-5 py-4 sm:px-6">
            <p className="text-[0.65rem] leading-5 text-slate-600">
              A policy cannot be activated unless every settlement-critical field carries evidence.
              Missing evidence is a blocking error, not a warning that can be ignored.
            </p>
          </div>
        </section>
      ) : null}

      <section className="surface-card p-5 sm:p-6" aria-labelledby="policy-source-heading">
        <p className="section-kicker">Classification</p>
        <h2 id="policy-source-heading" className="section-title">Term provenance</h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SourceReference classification="SIMULATED" label="Commercial values" detail="Premium, sum insured, thresholds and borrower policy identifier are illustrative. No authorized term sheet was available." />
          <SourceReference classification="DERIVED" label="Snapshot checksum" detail="Reproducible digest of the exact terms shown and accepted in the demo." />
          <SourceReference classification="REAL" label="Timezone identifier" detail="Asia/Kolkata is a published IANA standard. This does not imply any insurer arrangement." />
        </div>
      </section>
    </div>
  )
}
