/**
 * Camp Connect - Protected Route
 * Redirects unauthenticated users to /login.
 * Shows a loading spinner while auth state is being determined.
 */

import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()
  const [loadingSeconds, setLoadingSeconds] = useState(0)

  // Track how long we've been loading for user feedback
  useEffect(() => {
    if (!isLoading) {
      setLoadingSeconds(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isLoading])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          {loadingSeconds < 3 && (
            <p className="text-sm text-slate-500">Loading...</p>
          )}
          {loadingSeconds >= 3 && loadingSeconds < 10 && (
            <p className="text-sm text-slate-500">Server is waking up...</p>
          )}
          {loadingSeconds >= 10 && (
            <div className="text-center">
              <p className="text-sm text-slate-500">Taking longer than expected...</p>
              <p className="mt-1 text-xs text-slate-400">Free tier servers may take up to 60s to start</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check optional permission requirement
  if (requiredPermission && user) {
    const hasPermission = user.permissions.includes(requiredPermission)
    if (!hasPermission) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
            <p className="mt-2 text-slate-500">
              You don't have permission to view this page.
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
