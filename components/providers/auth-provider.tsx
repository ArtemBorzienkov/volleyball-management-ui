'use client'

import { createContext, useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import API from '@/lib/api'
import type { AuthUser } from '@/lib/types'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch(API.GET_CURRENT_USER, { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data: user = null, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['me'],
    queryFn: fetchCurrentUser,
  })

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch(API.LOG_IN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        throw new Error(res.status === 401 ? 'Invalid email or password' : `HTTP error! status: ${res.status}`)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.LOG_OUT, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  })

  const value: AuthContextValue = {
    user,
    isLoading,
    login: async (email, password) => {
      await loginMutation.mutateAsync({ email, password })
    },
    logout: async () => {
      await logoutMutation.mutateAsync()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
