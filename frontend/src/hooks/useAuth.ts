/**
 * Camp Connect - useAuth Hook
 * Convenience hook for auth operations (login, register, logout, etc.)
 */

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { session, user, isAuthenticated, isLoading, signOut: clearStore } =
    useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * Sign in with email and password via Supabase.
   */
  const login = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        setError(authError.message)
        return false
      }
      return true
    } catch (err: any) {
      setError(err.message || 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Register a new organization + admin user.
   * Calls our backend (which creates Supabase user + org + roles).
   */
  const register = async (data: {
    org_name: string
    org_slug: string
    email: string
    password: string
    first_name: string
    last_name: string
  }) => {
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/register', data)
      // After successful registration, sign in via Supabase
      // (the backend already created the Supabase user)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (authError) {
        // Registration succeeded but sign-in failed
        setError('Account created! Please log in.')
        return false
      }
      return true
    } catch (err: any) {
      const message =
        err.response?.data?.detail || err.message || 'Registration failed'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign out — clears Supabase session and local state.
   */
  const logout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      clearStore()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Send a password reset email.
   */
  const forgotPassword = async (email: string) => {
    setError(null)
    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      )
      if (resetError) {
        setError(resetError.message)
        return false
      }
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    session,
    user,
    isAuthenticated,
    isLoading: isLoading || loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    clearError: () => setError(null),
  }
}
