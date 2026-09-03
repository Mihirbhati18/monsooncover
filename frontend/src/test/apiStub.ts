import { vi } from 'vitest'

/**
 * Installs a `fetch` stub so component tests exercise the real API client
 * (services/api.ts) rather than a mocked module. Routes are matched by
 * substring against the request URL; the first match wins.
 */

export type StubRoutes = Record<string, unknown>

const TOKEN_STORAGE_KEY = 'monsooncover.access_token'

export const DEMO_USER = {
  id: 'user-1',
  email: 'lender@demo.monsooncover.local',
  display_name: 'Sandbox Lender',
  role: 'lender',
  is_active: true,
}

export function signInForTests(): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, 'test-token')
}

export function signOutForTests(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function stubApi(routes: StubRoutes = {}): void {
  const table: StubRoutes = { '/api/v1/auth/me': DEMO_USER, ...routes }

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      // A key matching the end of the URL wins, so a specific action route
      // like '/decision' is not shadowed by a broader collection prefix
      // ('/settlement/insurer-requests') that also appears in the URL.
      const candidates = Object.keys(table).filter((path) => url.includes(path))
      const match =
        candidates.find((path) => url.endsWith(path)) ??
        candidates.sort((a, b) => b.length - a.length)[0]

      if (match === undefined) {
        return new Response(JSON.stringify({ detail: `No stub for ${url}` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const value = table[match]
      if (value instanceof Response) return value.clone()

      return new Response(JSON.stringify(value), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )
}

export function stubApiFailure(status = 500, detail = 'Backend unavailable'): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ detail }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
    ),
  )
}
