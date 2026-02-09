/**
 * Camp Connect - Emergency Contacts Step
 * Step 2 of the onboarding wizard.
 */

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { useUpdateEmergencyContacts } from '@/hooks/useOnboarding'
import type { OnboardingRecord, EmergencyContact } from '@/hooks/useOnboarding'

interface EmergencyContactsStepProps {
  onboarding: OnboardingRecord
  onNext: () => void
}

const EMPTY_CONTACT: EmergencyContact = { name: '', phone: '', relationship: '' }

export function EmergencyContactsStep({ onboarding, onNext }: EmergencyContactsStepProps) {
  const updateEmergencyContacts = useUpdateEmergencyContacts()

  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    if (onboarding.emergency_contacts?.length > 0) {
      return onboarding.emergency_contacts
    }
    return [{ ...EMPTY_CONTACT }]
  })

  useEffect(() => {
    if (onboarding.emergency_contacts?.length > 0) {
      setContacts(onboarding.emergency_contacts)
    }
  }, [onboarding.emergency_contacts])

  function addContact() {
    if (contacts.length < 3) {
      setContacts((prev) => [...prev, { ...EMPTY_CONTACT }])
    }
  }

  function removeContact(index: number) {
    if (contacts.length > 1) {
      setContacts((prev) => prev.filter((_, i) => i !== index))
    }
  }

  function updateContact(index: number, field: keyof EmergencyContact, value: string) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await updateEmergencyContacts.mutateAsync({ contacts })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Emergency Contacts</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add between 1 and 3 emergency contacts who can be reached in case of an emergency.
        </p>
      </div>

      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-100 bg-gray-50/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                Contact {index + 1}
              </h3>
              {contacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeContact(index)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={contact.name}
                  onChange={(e) => updateContact(index, 'name', e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={contact.phone}
                  onChange={(e) => updateContact(index, 'phone', e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <input
                  type="text"
                  required
                  value={contact.relationship}
                  onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Spouse, Parent, etc."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {contacts.length < 3 && (
        <button
          type="button"
          onClick={addContact}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
        >
          <Plus className="h-4 w-4" />
          Add Another Contact
        </button>
      )}

      {updateEmergencyContacts.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to save emergency contacts. Please try again.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateEmergencyContacts.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {updateEmergencyContacts.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Save & Continue
        </button>
      </div>
    </form>
  )
}
