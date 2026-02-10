/**
 * Camp Connect - Auth Context Provider
 * Listens to Supabase auth state changes and loads user profile from backend.
 */

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
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
  const initComplete = useRef(false)
  const profileLoading = useRef(false)

  const loadUserProfile = async (retries = 3) => {
    // Prevent concurrent loads
    if (profileLoading.current) return
    profileLoading.current = true
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
    } catch (error) {
      console.error('Failed to load user profile:', error)
      // Retry on failure (handles Render cold starts & transient errors)
      if (retries > 0) {
        const delay = (4 - retries) * 2000 // 2s, 4s, 6s backoff
        console.log(`Retrying profile load in ${delay}ms (${retries} retries left)`)
        profileLoading.current = false
        await new Promise((r) => setTimeout(r, delay))
        return loadUserProfile(retries - 1)
      }
      setUser(null)
    } finally {
      profileLoading.current = false
    }
  }

  useEffect(() => {
    // Get initial session and load profile
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
        initComplete.current = true
        setLoading(false)
      }
    }

    // Safety timeout — clear loading if init takes too long
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, 30000)

    initAuth().finally(() => clearTimeout(safetyTimeout))

    // Listen for auth state changes AFTER initial load
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip events during initial auth — initAuth handles that
      if (!initComplete.current) return

      setSession(session)

      if (event === 'SIGNED_IN' && session) {
        setLoading(true)
        await loadUserProfile()
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      // TOKEN_REFRESHED: no action needed, profile already loaded
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
