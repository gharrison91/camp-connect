/**
 * Camp Connect - SchedulePage
 * Daily schedule management with event/date selection and session creation.
 */

import { useState } from 'react'
import { CalendarDays, Plus, Loader2 } from 'lucide-react'
import { useEvents } from '@/hooks/useEvents'
import { useDailyView, useDeleteSchedule } from '@/hooks/useSchedules'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/Toast'
import { DayView } from './DayView'
import { ScheduleSessionModal } from './ScheduleSessionModal'
import type { Schedule } from '@/types'

export function SchedulePage() {
  const { hasPermission } = usePermissions()
  const { toast } = useToast()
  const { data: events = [], isLoading: eventsLoading } = useEvents()

  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  const { data: sessions = [], isLoading: sessionsLoading } = useDailyView(
    selectedEventId || undefined,
    selectedEventId ? selectedDate : undefined
  )

  const deleteSchedule = useDeleteSchedule()

  function handleEdit(schedule: Schedule) {
    setEditingSchedule(schedule)
    setShowModal(true)
  }

  async function handleDelete(scheduleId: string) {
    try {
      await deleteSchedule.mutateAsync(scheduleId)
      toast({ type: 'success', message: 'Session deleted.' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete session.' })
    }
  }

  const isLoading = eventsLoading || sessionsLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Schedule
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select an event...</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>{evt.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {hasPermission('scheduling.sessions.create') && selectedEventId && (
            <button
              onClick={() => { setEditingSchedule(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Add Session
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!selectedEventId && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20">
          <CalendarDays className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            Select an event to view the schedule
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Choose an event and date from the controls above.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Day View */}
      {selectedEventId && !isLoading && (
        <DayView
          sessions={sessions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={hasPermission('scheduling.sessions.update')}
          canDelete={hasPermission('scheduling.sessions.delete')}
        />
      )}

      {/* Modal */}
      {showModal && (
        <ScheduleSessionModal
          eventId={selectedEventId}
          date={selectedDate}
          schedule={editingSchedule}
          onClose={() => { setShowModal(false); setEditingSchedule(null) }}
        />
      )}
    </div>
  )
}
