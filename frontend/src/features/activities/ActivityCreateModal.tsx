import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useCreateActivity } from '@/hooks/useActivities'
import type { ActivityCreate } from '@/hooks/useActivities'
import { useToast } from '@/components/ui/Toast'

interface ActivityCreateModalProps {
  onClose: () => void
}

export function ActivityCreateModal({ onClose }: ActivityCreateModalProps) {
  const createActivity = useCreateActivity()
  const { toast } = useToast()
  const [form, setForm] = useState<ActivityCreate>({
    name: '',
    description: '',
    category: 'sports',
    location: '',
    capacity: undefined,
    min_age: undefined,
    max_age: undefined,
    duration_minutes: undefined,
    staff_required: 1,
    equipment_needed: [],
    is_active: true,
  })
  const [equipmentInput, setEquipmentInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createActivity.mutateAsync(form)
      toast({ type: 'success', message: 'Activity created successfully!' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to create activity.' })
    }
  }

  const updateField = <K extends keyof ActivityCreate>(
    key: K,
    value: ActivityCreate[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addEquipment = () => {
    const trimmed = equipmentInput.trim()
    if (trimmed && !(form.equipment_needed || []).includes(trimmed)) {
      updateField('equipment_needed', [...(form.equipment_needed || []), trimmed])
      setEquipmentInput('')
    }
  }

  const removeEquipment = (item: string) => {
    updateField(
      'equipment_needed',
      (form.equipment_needed || []).filter((e) => e !== item)
    )
  }

  const handleEquipmentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEquipment()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Activity
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Activity Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Archery, Canoeing, Arts & Crafts"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Brief description of the activity..."
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="sports">Sports</option>
                <option value="arts">Arts</option>
                <option value="nature">Nature</option>
                <option value="water">Water</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={form.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Lake, Field A"
              />
            </div>
          </div>

          {/* Capacity & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Capacity
              </label>
              <input
                type="number"
                min="0"
                value={form.capacity ?? ''}
                onChange={(e) =>
                  updateField(
                    'capacity',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Max participants"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={form.duration_minutes ?? ''}
                onChange={(e) =>
                  updateField(
                    'duration_minutes',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., 60"
              />
            </div>
          </div>

          {/* Min Age / Max Age */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Min Age
              </label>
              <input
                type="number"
                min="0"
                value={form.min_age ?? ''}
                onChange={(e) =>
                  updateField(
                    'min_age',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Max Age
              </label>
              <input
                type="number"
                min="0"
                value={form.max_age ?? ''}
                onChange={(e) =>
                  updateField(
                    'max_age',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Staff Required */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Staff Required
            </label>
            <input
              type="number"
              min="0"
              value={form.staff_required ?? 1}
              onChange={(e) =>
                updateField('staff_required', parseInt(e.target.value) || 0)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Equipment Needed */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Equipment Needed
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                onKeyDown={handleEquipmentKeyDown}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Type and press Enter to add"
              />
              <button
                type="button"
                onClick={addEquipment}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
            {(form.equipment_needed || []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(form.equipment_needed || []).map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeEquipment(item)}
                      className="ml-0.5 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-blue-300" />
            </label>
            <span className="text-sm font-medium text-gray-700">Active</span>
          </div>

          {/* Error */}
          {createActivity.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Failed to create activity. Please check your inputs.
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
              disabled={createActivity.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createActivity.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
