/**
 * Camp Connect - ScheduleSessionModal
 * Create or edit a schedule session.
 */

import { useState, useMemo } from 'react'
import { X, Loader2, Search, Check } from 'lucide-react'
import { useActivities } from '@/hooks/useActivities'
import { useStaffList } from '@/hooks/useStaff'
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
  const { data: staffData } = useStaffList({ limit: 200 })
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
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
    schedule?.staff_user_ids || []
  )
  const [staffSearch, setStaffSearch] = useState('')

  const isEditing = !!schedule
  const isSubmitting = createSchedule.isPending || updateSchedule.isPending

  const staffMembers = useMemo(
    () => (staffData?.items || []).filter((s) => s.status === 'active'),
    [staffData]
  )

  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return staffMembers
    const q = staffSearch.toLowerCase()
    return staffMembers.filter(
      (s) =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        (s.job_title && s.job_title.toLowerCase().includes(q))
    )
  }, [staffMembers, staffSearch])

  function toggleStaff(userId: string) {
    setSelectedStaffIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  function getStaffName(userId: string): string {
    const s = staffMembers.find((m) => m.user_id === userId)
    return s ? `${s.first_name} ${s.last_name}` : userId
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activityId) {
      toast({ type: 'error', message: 'Please select an activity.' })
      return
    }

    try {
      const staffPayload = selectedStaffIds.length > 0 ? selectedStaffIds : undefined

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
            staff_user_ids: staffPayload,
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
          staff_user_ids: staffPayload,
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
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Session' : 'Add Session'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Activity</label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Staff Assignment */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Assigned Staff
            </label>

            {/* Selected staff tags */}
            {selectedStaffIds.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {selectedStaffIds.map((userId) => (
                  <span
                    key={userId}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200"
                  >
                    {getStaffName(userId)}
                    <button
                      type="button"
                      onClick={() => toggleStaff(userId)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Search staff by name or title..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Staff list with checkboxes */}
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-50">
              {filteredStaff.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-400 italic">
                  {staffSearch ? 'No staff found.' : 'No staff available.'}
                </p>
              ) : (
                filteredStaff.map((staff) => {
                  const isSelected = selectedStaffIds.includes(staff.user_id)
                  return (
                    <button
                      key={staff.user_id}
                      type="button"
                      onClick={() => toggleStaff(staff.user_id)}
                      className={
                        'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ' +
                        (isSelected
                          ? 'bg-emerald-50/50'
                          : 'hover:bg-gray-50')
                      }
                    >
                      <div
                        className={
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ' +
                          (isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-300 bg-white')
                        }
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {staff.first_name} {staff.last_name}
                        </p>
                        {staff.job_title && (
                          <p className="text-xs text-gray-500 truncate">{staff.job_title}</p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
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
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
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
