'use client'

// Auth + onboarding gate (Stage 1+2 + Stage A).
// Wraps the entire app and decides what to render:
//   - Loading state
//   - Login/Signup page (if not authenticated)
//   - Niche selection screen (if authenticated but hasSeenOnboarding=false)
//   - First-run agent progress UI (if hasSeenOnboarding=true but hasRunFirstScan=false)
//   - The main app shell (otherwise)
import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type AppUser = {
  id: string
  email: string
  name?: string | null
  avatar?: string | null
  role?: string
  hasSeenOnboarding: boolean
  hasRunFirstScan: boolean
  businessNiche?: string | null
  businessName?: string | null
}

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: AppUser; phase: 'onboarding' | 'first-scan' | 'app' }

const AuthContext = React.createContext<{
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
} | null>(null)

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const { data, isLoading, refetch } = useQuery<{ user: AppUser | null }>({
    queryKey: ['auth-me'],
    queryFn: async () => (await fetch('/api/auth/me')).json(),
    staleTime: 60_000,
  })

  const user = data?.user

  const state: AuthState = React.useMemo(() => {
    if (isLoading) return { status: 'loading' }
    if (!user) return { status: 'unauthenticated' }
    let phase: 'onboarding' | 'first-scan' | 'app' = 'app'
    if (!user.hasSeenOnboarding) phase = 'onboarding'
    else if (!user.hasRunFirstScan) phase = 'first-scan'
    return { status: 'authenticated', user, phase }
  }, [user, isLoading])

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || 'Login failed')
    await refetch()
  }, [refetch])

  const signup = React.useCallback(async (email: string, password: string, name?: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || 'Signup failed')
    await refetch()
  }, [refetch])

  const logout = React.useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    qc.setQueryData(['auth-me'], { user: null })
    qc.clear()
    await refetch()
  }, [qc, refetch])

  const refresh = React.useCallback(async () => {
    await refetch()
    qc.invalidateQueries()
  }, [qc, refetch])

  return (
    <AuthContext.Provider value={{ state, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
