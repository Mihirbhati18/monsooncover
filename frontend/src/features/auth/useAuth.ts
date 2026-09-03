import { useContext } from 'react'
import { AuthContext, type AuthState } from './AuthContext'

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (context === null) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
