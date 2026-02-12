/**
 * Camp Connect - Auth Store (Zustand)
 * Global state for authentication, user profile, and permissions.
 */

import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string | null
  avatar_url?: string | null
  organization_id: string
  role_id: string
  role_name: string
  permissions: string[]
  is_active: boolean
  seasonal_access_start?: string | null
  seasonal_access_end?: string | null
  created_at?: string | null
  platform_role?: string | null
}

interface AuthState {
  // State
  session: Session | null
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setSession: (session: Session | null) => void
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: (session) =>
    set({
      session,
      isAuthenticated: !!session,
    }),

  setUser: (user) =>
    set({ user }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  signOut: () =>
    set({
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}))
