import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useHealthTemplates, useAssignHealthForm } from '@/hooks/useHealthForms'
import { useCampers } from '@/hooks/useCampers'
import { useEvents } from '@/hooks/useEvents'

interface Props {
  onClose: () => void
}

export function AssignFormModal({ onClose }: Props) {
  const [templateId, setTemplateId] = useState('')
  const [camperId, setCamperId] = useState('')
  const [eventId, setEventId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [camperSearch, setCamperSearch] = useState('')

  const { data: templates = [] } = useHealthTemplates()
  const { data: campersData } = useCampers({ search: camperSearch || undefined })
  const campers = Array.isArray(campersData) ? campersData : campersData?.items || []
  const { data: events = [] } = useEvents()
  const assignForm = useAssignHealthForm()

  const handleAssign = async () => {
    if (!templateId || !camperId) return
    await assignForm.mutateAsync({
      template_id: templateId,
      camper_id: camperId,
      event_id: eventId || undefined,
      due_date: dueDate || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Assign Health Form</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Template */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Form Template *
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select a template...</option>
              {templates
                .filter((t) => t.is_active)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
            </select>
          </div>

          {/* Camper Search */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Camper *
            </label>
            <input
              type="text"
              value={camperSearch}
              onChange={(e) => setCamperSearch(e.target.value)}
              placeholder="Search campers..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {camperSearch && campers.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                {campers.slice(0, 5).map((c: { id: string; first_name: string; last_name: string }) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCamperId(c.id)
                      setCamperSearch(`${c.first_name} ${c.last_name}`)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    {c.first_name} {c.last_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Event (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Event (optional)
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">No specific event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Due Date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!templateId || !camperId || assignForm.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {assignForm.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Assign Form
          </button>
        </div>
      </div>
    </div>
  )
}
