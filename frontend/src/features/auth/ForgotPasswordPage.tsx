import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tent, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function ForgotPasswordPage() {
  const { forgotPassword, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)

    const success = await forgotPassword(email)
    if (success) {
      setSent(true)
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-sm">
            <Tent className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-blue-200">
            We'll send you a link to reset it
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
          {sent ? (
            /* Success state */
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                If an account exists for <strong>{email}</strong>, you'll receive
                a password reset link shortly.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-blue-300/60">
          Camp Connect v0.1.0
        </p>
      </div>
    </div>
  )
}
