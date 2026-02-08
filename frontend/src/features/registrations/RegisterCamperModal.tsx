import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { useCreateRegistration } from '@/hooks/useRegistrations'
import { useCampers } from '@/hooks/useCampers'
import { useEvents } from '@/hooks/useEvents'
import type { RegistrationCreate } from '@/types'

interface RegisterCamperModalProps {
  onClose: () => void
  preselectedEventId?: string
  preselectedCamperId?: string
}

export function RegisterCamperModal({
  onClose,
  preselectedEventId,
  preselectedCamperId,
}: RegisterCamperModalProps) {
  const createRegistration = useCreateRegistration()
  const { data: camperData } = useCampers({ limit: 100 })
  const { data: events = [] } = useEvents({ status: 'published' })
  const campers = camperData?.items ?? []

  const [form, setForm] = useState<RegistrationCreate>({
    camper_id: preselectedCamperId || '',
    event_id: preselectedEventId || '',
    special_requests: '',
  })

  const selectedEvent = events.find((e) => e.id === form.event_id)
  const isEventNearFull =
    selectedEvent &&
    selectedEvent.capacity > 0 &&
    selectedEvent.enrolled_count >= selectedEvent.capacity * 0.9
  const isEventFull =
    selectedEvent &&
    selectedEvent.capacity > 0 &&
    selectedEvent.enrolled_count >= selectedEvent.capacity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRegistration.mutateAsync(form)
      onClose()
    } catch {
      // Error handled by mutation state
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Register Camper
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
          {/* Camper Select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Camper *
            </label>
            <select
              required
              value={form.camper_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, camper_id: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a camper...</option>
              {campers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                  {c.age ? ` (Age ${c.age})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Event Select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Event *
            </label>
            <select
              required
              value={form.event_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, event_id: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select an event...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.enrolled_count}/{ev.capacity} enrolled)
                </option>
              ))}
            </select>
          </div>

          {/* Capacity Warning */}
          {isEventNearFull && !isEventFull && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This event is nearly full ({selectedEvent.enrolled_count}/
                {selectedEvent.capacity} spots taken). Register soon to secure a
                spot.
              </p>
            </div>
          )}
          {isEventFull && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This event is full. Registering will add the camper to the
                waitlist.
              </p>
            </div>
          )}

          {/* Special Requests */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Special Requests
            </label>
            <textarea
              value={form.special_requests || ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  special_requests: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Any special requests or notes..."
            />
          </div>

          {/* Error */}
          {createRegistration.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Failed to register camper. They may already be registered for this
              event.
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
              disabled={createRegistration.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createRegistration.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isEventFull ? 'Add to Waitlist' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
