/**
 * Camp Connect - Payroll Info Step
 * Step 5 (final) of the onboarding wizard.
 */

import { useState } from 'react'
import { DollarSign, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompletePayroll } from '@/hooks/useOnboarding'
import type { OnboardingRecord } from '@/hooks/useOnboarding'

interface PayrollInfoStepProps {
  onboarding: OnboardingRecord
  onFinish: () => Promise<void>
  isFinishing: boolean
  allStepsComplete: boolean
}

export function PayrollInfoStep({
  onboarding,
  onFinish,
  isFinishing,
  allStepsComplete,
}: PayrollInfoStepProps) {
  const completePayroll = useCompletePayroll()
  const [confirmed, setConfirmed] = useState(onboarding.payroll_completed)

  async function handleConfirm() {
    if (!confirmed) {
      await completePayroll.mutateAsync()
      setConfirmed(true)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Payroll Setup</h2>
        <p className="mt-1 text-sm text-gray-500">
          Complete your payroll setup to ensure you get paid on time.
        </p>
      </div>

      {/* Informational Card */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Payroll is handled externally
            </h3>
            <p className="text-sm text-gray-600">
              Our payroll system is managed through a third-party provider. You should
              have received an email invitation with instructions for setting up your
              direct deposit and tax withholding information.
            </p>
            <p className="text-sm text-gray-600">
              If you have not received the payroll setup email, please contact the
              camp administrator for assistance.
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <ExternalLink className="h-4 w-4" />
              <span>Check your email for the payroll setup link.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div
        className={cn(
          'rounded-lg border p-4 transition-colors',
          confirmed
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-gray-200 bg-white'
        )}
      >
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={handleConfirm}
            disabled={confirmed || completePayroll.isPending}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              I have completed my payroll setup
            </span>
            <p className="mt-0.5 text-xs text-gray-500">
              By checking this box, you confirm that you have completed the payroll
              registration process through the external provider.
            </p>
          </div>
          {confirmed && (
            <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-600" />
          )}
        </label>
      </div>

      {completePayroll.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to confirm payroll setup. Please try again.
        </div>
      )}

      {/* Finish Onboarding Button */}
      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button
          onClick={onFinish}
          disabled={!allStepsComplete || isFinishing}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFinishing && <Loader2 className="h-4 w-4 animate-spin" />}
          Complete Onboarding
        </button>
      </div>

      {!allStepsComplete && (
        <p className="text-right text-xs text-amber-600">
          Please complete all previous steps before finishing onboarding.
        </p>
      )}
    </div>
  )
}
