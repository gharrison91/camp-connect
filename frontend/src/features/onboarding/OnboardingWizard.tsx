/**
 * Camp Connect - Onboarding Wizard
 * Multi-step wizard that guides new staff through the onboarding process.
 */

import { useState, useEffect } from 'react'
import {
  User,
  Phone,
  Award,
  FileCheck,
  DollarSign,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMyOnboarding, useCompleteOnboarding } from '@/hooks/useOnboarding'
import { PersonalInfoStep } from './steps/PersonalInfoStep'
import { EmergencyContactsStep } from './steps/EmergencyContactsStep'
import { CertificationsStep } from './steps/CertificationsStep'
import { PolicyAcknowledgmentsStep } from './steps/PolicyAcknowledgmentsStep'
import { PayrollInfoStep } from './steps/PayrollInfoStep'
import { OnboardingCompletePage } from './OnboardingCompletePage'

const STEPS = [
  { label: 'Personal Info', icon: User },
  { label: 'Emergency Contacts', icon: Phone },
  { label: 'Certifications', icon: Award },
  { label: 'Policy Acknowledgments', icon: FileCheck },
  { label: 'Payroll', icon: DollarSign },
] as const

export function OnboardingWizard() {
  const { data: onboarding, isLoading, error } = useMyOnboarding()
  const completeOnboarding = useCompleteOnboarding()
  const [currentStep, setCurrentStep] = useState(0)

  // Sync step from server state on initial load
  useEffect(() => {
    if (onboarding?.current_step !== undefined) {
      setCurrentStep(onboarding.current_step)
    }
  }, [onboarding?.current_step])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !onboarding) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load onboarding data. Please refresh and try again.
      </div>
    )
  }

  // If completed, show the success page
  if (onboarding.status === 'completed') {
    return <OnboardingCompletePage />
  }

  const stepCompletion = [
    onboarding.personal_info_completed,
    onboarding.emergency_contacts_completed,
    onboarding.certifications_completed,
    onboarding.policy_acknowledgments_completed,
    onboarding.payroll_info_completed,
  ]

  const completedCount = stepCompletion.filter(Boolean).length
  const progressPercent = Math.round((completedCount / STEPS.length) * 100)

  const allStepsComplete = stepCompletion.every(Boolean)

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  async function handleFinish() {
    await completeOnboarding.mutateAsync()
  }

  function renderStep() {
    const ob = onboarding!
    switch (currentStep) {
      case 0:
        return <PersonalInfoStep onboarding={ob} onNext={handleNext} />
      case 1:
        return <EmergencyContactsStep onboarding={ob} onNext={handleNext} />
      case 2:
        return <CertificationsStep onboarding={ob} onNext={handleNext} />
      case 3:
        return <PolicyAcknowledgmentsStep onboarding={ob} onNext={handleNext} />
      case 4:
        return <PayrollInfoStep onboarding={ob} onFinish={handleFinish} isFinishing={completeOnboarding.isPending} allStepsComplete={allStepsComplete} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Staff Onboarding
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete the steps below to finish your onboarding process.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            {completedCount} of {STEPS.length} steps complete
          </span>
          <span className="text-gray-500">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Step List */}
        <div className="w-full shrink-0 lg:w-64">
          <nav className="overflow-hidden rounded-xl border border-gray-100 bg-gray-900 shadow-sm">
            <ul className="divide-y divide-gray-800">
              {STEPS.map((step, idx) => {
                const Icon = step.icon
                const isActive = idx === currentStep
                const isComplete = stepCompletion[idx]

                return (
                  <li key={step.label}>
                    <button
                      onClick={() => setCurrentStep(idx)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          isComplete && !isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-700 text-gray-400'
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </span>
                      <span className="font-medium">{step.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            {currentStep < STEPS.length - 1 && (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
