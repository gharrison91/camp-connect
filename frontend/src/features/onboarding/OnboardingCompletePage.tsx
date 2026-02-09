/**
 * Camp Connect - Onboarding Complete Page
 * Success screen shown after onboarding is finished.
 */

import { Link } from 'react-router-dom'
import { PartyPopper, ArrowRight } from 'lucide-react'

export function OnboardingCompletePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      {/* Celebration Animation */}
      <div className="relative">
        {/* Confetti-style decorative dots */}
        <div className="absolute -left-8 -top-6 h-3 w-3 animate-bounce rounded-full bg-yellow-400" style={{ animationDelay: '0ms', animationDuration: '1.5s' }} />
        <div className="absolute -right-6 -top-4 h-2 w-2 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: '200ms', animationDuration: '1.8s' }} />
        <div className="absolute -left-4 top-4 h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: '400ms', animationDuration: '1.6s' }} />
        <div className="absolute -right-8 top-2 h-3 w-3 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '100ms', animationDuration: '2s' }} />
        <div className="absolute -bottom-4 -left-6 h-2 w-2 animate-bounce rounded-full bg-pink-400" style={{ animationDelay: '300ms', animationDuration: '1.7s' }} />
        <div className="absolute -bottom-2 -right-4 h-2.5 w-2.5 animate-bounce rounded-full bg-orange-400" style={{ animationDelay: '500ms', animationDuration: '1.9s' }} />
        <div className="absolute -top-8 left-4 h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '150ms', animationDuration: '1.4s' }} />
        <div className="absolute -bottom-6 right-2 h-3 w-3 animate-bounce rounded-full bg-rose-400" style={{ animationDelay: '350ms', animationDuration: '2.1s' }} />

        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
          <PartyPopper className="h-12 w-12 text-emerald-600" />
        </div>
      </div>

      {/* Message */}
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-gray-900">
        Welcome to the team!
      </h1>
      <p className="mt-3 max-w-md text-center text-base text-gray-500">
        You have successfully completed your onboarding process.
        You are all set to start your journey with Camp Connect.
      </p>

      {/* Summary Card */}
      <div className="mt-8 w-full max-w-sm rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 text-center">
        <p className="text-sm font-medium text-emerald-800">
          All steps completed
        </p>
        <p className="mt-1 text-xs text-emerald-600">
          Your information has been saved and your account is fully set up.
        </p>
      </div>

      {/* CTA */}
      <Link
        to="/app/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Go to Dashboard
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
