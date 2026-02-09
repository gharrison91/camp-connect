/**
 * Camp Connect - Personal Info Step
 * Step 1 of the onboarding wizard.
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useUpdatePersonalInfo } from '@/hooks/useOnboarding'
import type { OnboardingRecord } from '@/hooks/useOnboarding'

const DEPARTMENTS = [
  'Administration',
  'Activities',
  'Counselors',
  'Kitchen',
  'Maintenance',
  'Medical',
  'Waterfront',
]

interface PersonalInfoStepProps {
  onboarding: OnboardingRecord
  onNext: () => void
}

export function PersonalInfoStep({ onboarding, onNext }: PersonalInfoStepProps) {
  const updatePersonalInfo = useUpdatePersonalInfo()

  const [firstName, setFirstName] = useState(onboarding.first_name ?? '')
  const [lastName, setLastName] = useState(onboarding.last_name ?? '')
  const [phone, setPhone] = useState(onboarding.phone ?? '')
  const [department, setDepartment] = useState(onboarding.department ?? '')

  useEffect(() => {
    setFirstName(onboarding.first_name ?? '')
    setLastName(onboarding.last_name ?? '')
    setPhone(onboarding.phone ?? '')
    setDepartment(onboarding.department ?? '')
  }, [onboarding])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await updatePersonalInfo.mutateAsync({
      first_name: firstName,
      last_name: lastName,
      phone,
      department,
    })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Let us know some basic details about you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="John"
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Doe"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <select
            id="department"
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {updatePersonalInfo.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to save personal info. Please try again.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updatePersonalInfo.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {updatePersonalInfo.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Save & Continue
        </button>
      </div>
    </form>
  )
}
