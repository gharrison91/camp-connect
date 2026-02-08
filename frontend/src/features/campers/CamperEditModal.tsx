import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useUpdateCamper } from '@/hooks/useCampers'
import { useToast } from '@/components/ui/Toast'
import type { Camper, CamperUpdate } from '@/types'

interface CamperEditModalProps {
  camper: Camper
  onClose: () => void
}

export function CamperEditModal({ camper, onClose }: CamperEditModalProps) {
  const updateCamper = useUpdateCamper()
  const { toast } = useToast()
  const [form, setForm] = useState<CamperUpdate>({
    first_name: camper.first_name,
    last_name: camper.last_name,
    date_of_birth: camper.date_of_birth ?? undefined,
    gender: (camper.gender as 'male' | 'female' | 'other' | undefined) ?? undefined,
    school: camper.school ?? '',
    grade: camper.grade ?? '',
    city: camper.city ?? '',
    state: camper.state ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateCamper.mutateAsync({ id: camper.id, data: form })
      toast({ type: 'success', message: 'Camper updated successfully!' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to update camper.' })
    }
  }

  const updateField = <K extends keyof CamperUpdate>(
    key: K,
    value: CamperUpdate[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Camper
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

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.date_of_birth || ''}
                onChange={(e) =>
                  updateField(
                    'date_of_birth',
                    e.target.value || undefined
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                value={form.gender || ''}
                onChange={(e) =>
                  updateField(
                    'gender',
                    (e.target.value || undefined) as
                      | 'male'
                      | 'female'
                      | 'other'
                      | undefined
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* School & Grade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                School
              </label>
              <input
                type="text"
                value={form.school || ''}
                onChange={(e) => updateField('school', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="School name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Grade
              </label>
              <input
                type="text"
                value={form.grade || ''}
                onChange={(e) => updateField('grade', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., 5th"
              />
            </div>
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Error */}
          {updateCamper.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Failed to update camper. Please check your inputs.
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
              disabled={updateCamper.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateCamper.isPending && (
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
