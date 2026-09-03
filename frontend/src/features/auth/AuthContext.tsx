import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, getStoredToken, login as loginRequest, storeToken } from '../../services/api'
import type { CurrentUser } from '../../services/types'

export type AuthState = {
  user: CurrentUser | null
  status: 'authenticated' | 'anonymous'
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  // Derived synchronously from the stored token so a returning user does
  // not see a loading flash on every refresh. This is optimistic: the
  // token is confirmed against /auth/me below, and authorization itself is
  // always enforced server-side, so an invalid token simply signs out.
  const [status, setStatus] = useState<AuthState['status']>(() =>
    getStoredToken() ? 'authenticated' : 'anonymous',
  )

  useEffect(() => {
    if (!getStoredToken()) return
    let cancelled = false

    api
      .getCurrentUser()
      .then((current) => {
        if (!cancelled) setUser(current)
      })
      .catch(() => {
        if (cancelled) return
        // A stale or rejected token must not leave the app half signed in.
        storeToken(null)
        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const token = await loginRequest(email, password)
    storeToken(token)
    const current = await api.getCurrentUser()
    setUser(current)
    setStatus('authenticated')
  }, [])

  const signOut = useCallback(() => {
    storeToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, status, signIn, signOut }),
    [user, status, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
