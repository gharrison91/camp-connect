/**
 * Camp Connect - Policy Acknowledgments Step
 * Step 4 of the onboarding wizard.
 */

import { CheckCircle2, Circle, Loader2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAcknowledgePolicy } from '@/hooks/useOnboarding'
import type { OnboardingRecord } from '@/hooks/useOnboarding'

const POLICIES = [
  {
    name: 'code_of_conduct',
    label: 'Code of Conduct',
    description: 'Standards of behavior and ethical guidelines for all staff members.',
  },
  {
    name: 'safety_protocols',
    label: 'Safety Protocols',
    description: 'Emergency procedures, safety guidelines, and incident reporting requirements.',
  },
  {
    name: 'anti_harassment',
    label: 'Anti-Harassment Policy',
    description: 'Zero-tolerance harassment policy and reporting procedures.',
  },
  {
    name: 'confidentiality',
    label: 'Confidentiality Agreement',
    description: 'Protection of camper, family, and organizational information.',
  },
  {
    name: 'technology_use',
    label: 'Technology Use Policy',
    description: 'Acceptable use of camp technology, devices, and social media.',
  },
]

interface PolicyAcknowledgmentsStepProps {
  onboarding: OnboardingRecord
  onNext: () => void
}

export function PolicyAcknowledgmentsStep({
  onboarding,
  onNext,
}: PolicyAcknowledgmentsStepProps) {
  const acknowledgePolicy = useAcknowledgePolicy()

  const acknowledgments = onboarding.policy_acknowledgments ?? []

  function isAcknowledged(policyName: string): boolean {
    return acknowledgments.some(
      (a) => a.policy_name === policyName && a.acknowledged
    )
  }

  async function handleAcknowledge(policyName: string) {
    if (!isAcknowledged(policyName)) {
      await acknowledgePolicy.mutateAsync(policyName)
    }
  }

  const allAcknowledged = POLICIES.every((p) => isAcknowledged(p.name))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Policy Acknowledgments</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please review and acknowledge each policy below. All policies must be
          acknowledged before proceeding.
        </p>
      </div>

      <div className="space-y-3">
        {POLICIES.map((policy) => {
          const acknowledged = isAcknowledged(policy.name)

          return (
            <div
              key={policy.name}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                acknowledged
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-gray-100 bg-white'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {acknowledged ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900">
                      {policy.label}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{policy.description}</p>
                </div>
                <div className="shrink-0">
                  {acknowledged ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(policy.name)}
                      disabled={acknowledgePolicy.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {acknowledgePolicy.isPending && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {acknowledgePolicy.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to acknowledge policy. Please try again.
        </div>
      )}

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button
          onClick={onNext}
          disabled={!allAcknowledged}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
