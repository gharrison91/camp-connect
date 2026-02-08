import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useUpdateContact } from '@/hooks/useContacts'
import { useToast } from '@/components/ui/Toast'
import type { Contact, ContactUpdate } from '@/types'

interface ContactEditModalProps {
  contact: Contact
  onClose: () => void
}

export function ContactEditModal({ contact, onClose }: ContactEditModalProps) {
  const updateContact = useUpdateContact()
  const { toast } = useToast()
  const [form, setForm] = useState<ContactUpdate>({
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email || '',
    phone: contact.phone || '',
    relationship_type: contact.relationship_type || 'parent',
    address: contact.address || '',
    city: contact.city || '',
    state: contact.state || '',
    zip_code: contact.zip_code || '',
    account_status: contact.account_status,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateContact.mutateAsync({ id: contact.id, data: form })
      toast({ type: 'success', message: 'Contact updated successfully!' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to update contact.' })
    }
  }

  const updateField = <K extends keyof ContactUpdate>(
    key: K,
    value: ContactUpdate[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Contact
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                required
                value={form.first_name || ''}
                onChange={(e) => updateField('first_name', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={form.last_name || ''}
                onChange={(e) => updateField('last_name', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Relationship Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Relationship
            </label>
            <select
              value={form.relationship_type || 'parent'}
              onChange={(e) => updateField('relationship_type', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="parent">Parent</option>
              <option value="guardian">Guardian</option>
              <option value="emergency">Emergency Contact</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Street address"
            />
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                value={form.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                value={form.state || ''}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Zip Code
              </label>
              <input
                type="text"
                value={form.zip_code || ''}
                onChange={(e) => updateField('zip_code', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error */}
          {updateContact.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Failed to update contact. Please check your inputs.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateContact.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateContact.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
