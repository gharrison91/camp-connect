/**
 * Camp Connect - Auth Context Provider
 * Listens to Supabase auth state changes and loads user profile from backend.
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuthStore, type UserProfile } from '@/stores/authStore'

interface AuthContextValue {
  isLoading: boolean
  isAuthenticated: boolean
  user: UserProfile | null
}

const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  isAuthenticated: false,
  user: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setUser, setLoading, isLoading, isAuthenticated, user } =
    useAuthStore()

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setSession(session)

        if (session) {
          await loadUserProfile()
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setLoading(false)
      }
    }

    // Safety timeout — clear loading state if init takes too long
    // (Render free tier cold starts can take 30-60s)
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, 15000)

    initAuth().finally(() => clearTimeout(safetyTimeout))

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      if (event === 'SIGNED_IN' && session) {
        await loadUserProfile()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Session refreshed — profile already loaded
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
    } catch (error) {
      console.error('Failed to load user profile:', error)
      // If profile load fails, the user might not be set up yet
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
