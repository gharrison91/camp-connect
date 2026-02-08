import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useCreateEvent } from '@/hooks/useEvents'
import type { EventCreate } from '@/types'

interface EventCreateModalProps {
  onClose: () => void
}

export function EventCreateModal({ onClose }: EventCreateModalProps) {
  const createEvent = useCreateEvent()
  const [form, setForm] = useState<EventCreate>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    capacity: 50,
    min_age: undefined,
    max_age: undefined,
    gender_restriction: 'all',
    price: 0,
    status: 'draft',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createEvent.mutateAsync(form)
      onClose()
    } catch {
      // Error handled by mutation state
    }
  }

  const updateField = <K extends keyof EventCreate>(
    key: K,
    value: EventCreate[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Event
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
              Event Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Summer Adventure Week 1"
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
              placeholder="Brief description of the event..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => updateField('end_date', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Capacity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Capacity
              </label>
              <input
                type="number"
                min="0"
                value={form.capacity || ''}
                onChange={(e) =>
                  updateField('capacity', parseInt(e.target.value) || 0)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price || ''}
                onChange={(e) =>
                  updateField('price', parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Age Range & Gender */}
          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                value={form.gender_restriction || 'all'}
                onChange={(e) =>
                  updateField(
                    'gender_restriction',
                    e.target.value as 'all' | 'male' | 'female'
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={form.status || 'draft'}
              onChange={(e) =>
                updateField(
                  'status',
                  e.target.value as 'draft' | 'published'
                )
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Error */}
          {createEvent.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Failed to create event. Please check your inputs.
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
              disabled={createEvent.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createEvent.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
