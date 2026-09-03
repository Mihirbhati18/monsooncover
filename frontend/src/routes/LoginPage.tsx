import { useState } from 'react'
import type { FormEvent } from 'react'
import { DemoEnvironmentBanner } from '../components/foundation/DemoEnvironmentBanner'
import { useAuth } from '../features/auth/useAuth'
import { LiquidWeatherCanvas } from '../visuals/LiquidWeatherCanvas'
import { MonsoonMark } from '../visuals/MonsoonMark'

// Demo credentials are printed by backend/scripts/seed_demo.py. These are
// sandbox accounts in a synthetic environment, not real credentials.
const DEMO_ACCOUNTS = [
  { role: 'Lender operations', email: 'lender@demo.monsooncover.local' },
  { role: 'Insurer sandbox', email: 'insurer@demo.monsooncover.local' },
  { role: 'Administration', email: 'admin@demo.monsooncover.local' },
]

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-atmosphere min-h-screen text-slate-100">
      <DemoEnvironmentBanner />
      <main id="main-content" className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:py-20">
        <section className="hero-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 p-6 sm:p-9">
          <LiquidWeatherCanvas />
          <div aria-hidden="true" className="hero-grid" />
          <div className="relative">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan">MonsoonCover</p>
            <h1 className="mt-5 max-w-lg text-3xl font-semibold leading-[1.06] tracking-[-0.04em] text-white sm:text-4xl">
              Climate protection,
              <span className="hero-gradient-text block">made auditable.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
              Evidence-gated, loan-linked parametric climate protection for MSMEs. Every
              figure in this demo is computed from a checksummed dataset and carries a
              visible data classification.
            </p>
            <div className="mt-8 hidden justify-center lg:flex">
              <MonsoonMark />
            </div>
          </div>
        </section>

        <section className="surface-card p-6 sm:p-8" aria-labelledby="signin-heading">
          <p className="section-kicker">Sandbox access</p>
          <h2 id="signin-heading" className="section-title text-xl">
            Sign in
          </h2>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-deep/65 px-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan/60"
                placeholder="lender@demo.monsooncover.local"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-deep/65 px-3 text-sm text-slate-200 outline-none focus:border-cyan/60"
              />
            </label>

            {error ? (
              <p role="alert" className="rounded-xl border border-danger/25 bg-danger/8 px-3 py-2.5 text-xs text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-cyan px-4 text-sm font-bold text-deep transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-7 rounded-xl border border-white/8 bg-deep/45 p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Demo accounts
            </p>
            <ul className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">{account.role}</span>
                  <button
                    type="button"
                    onClick={() => setEmail(account.email)}
                    className="font-mono text-[0.68rem] text-cyan hover:underline"
                  >
                    {account.email}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.65rem] leading-5 text-slate-600">
              Synthetic sandbox accounts created by the demo seed script. Shared password is
              printed in the backend README.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
