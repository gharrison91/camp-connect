/**
 * Camp Connect - ScheduleSessionModal
 * Create or edit a schedule session.
 */

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useActivities } from '@/hooks/useActivities'
import { useCreateSchedule, useUpdateSchedule } from '@/hooks/useSchedules'
import { useToast } from '@/components/ui/Toast'
import type { Schedule } from '@/types'

interface ScheduleSessionModalProps {
  eventId: string
  date: string
  schedule: Schedule | null
  onClose: () => void
}

export function ScheduleSessionModal({ eventId, date, schedule, onClose }: ScheduleSessionModalProps) {
  const { toast } = useToast()
  const { data: activities = [] } = useActivities()
  const createSchedule = useCreateSchedule()
  const updateSchedule = useUpdateSchedule()

  const [activityId, setActivityId] = useState(schedule?.activity_id || '')
  const [startTime, setStartTime] = useState(schedule?.start_time?.slice(0, 5) || '09:00')
  const [endTime, setEndTime] = useState(schedule?.end_time?.slice(0, 5) || '10:00')
  const [location, setLocation] = useState(schedule?.location || '')
  const [maxCapacity, setMaxCapacity] = useState<string>(
    schedule?.max_capacity?.toString() || ''
  )
  const [notes, setNotes] = useState(schedule?.notes || '')

  const isEditing = !!schedule
  const isSubmitting = createSchedule.isPending || updateSchedule.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activityId) {
      toast({ type: 'error', message: 'Please select an activity.' })
      return
    }

    try {
      if (isEditing) {
        await updateSchedule.mutateAsync({
          id: schedule!.id,
          data: {
            activity_id: activityId,
            date,
            start_time: startTime,
            end_time: endTime,
            location: location || undefined,
            max_capacity: maxCapacity ? parseInt(maxCapacity) : undefined,
            notes: notes || undefined,
          },
        })
        toast({ type: 'success', message: 'Session updated.' })
      } else {
        await createSchedule.mutateAsync({
          event_id: eventId,
          activity_id: activityId,
          date,
          start_time: startTime,
          end_time: endTime,
          location: location || undefined,
          max_capacity: maxCapacity ? parseInt(maxCapacity) : undefined,
          notes: notes || undefined,
        })
        toast({ type: 'success', message: 'Session created.' })
      }
      onClose()
    } catch {
      toast({ type: 'error', message: `Failed to ${isEditing ? 'update' : 'create'} session.` })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Session' : 'Add Session'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Activity</label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select activity...</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Field A, Pool, Arts Center"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Max Capacity</label>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="Leave blank for unlimited"
              min="1"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
