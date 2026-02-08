import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Tent, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)

    const success = await login(email, password)
    if (success) {
      navigate('/dashboard', { replace: true })
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4">
      {/* Login Card */}
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-sm">
            <Tent className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Camp Connect
          </h1>
          <p className="mt-1 text-sm text-blue-200">
            Registration & Event Management Platform
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-200 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                Register your organization
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-blue-300/60">
          Camp Connect v0.1.0
        </p>
      </div>
    </div>
  )
}
