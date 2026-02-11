/**
 * Camp Connect - SessionAssignmentModal
 * Modal for managing camper/bunk assignments to a schedule session.
 * Shows session details, current assignments, and add camper/bunk controls.
 */

import { useState, useMemo } from 'react'
import { X, Loader2, Search, UserPlus, Home, Trash2, Clock, MapPin, Users } from 'lucide-react'
import { useCreateAssignment, useDeleteAssignment } from '@/hooks/useSchedules'
import { useCampers } from '@/hooks/useCampers'
import { useBunks } from '@/hooks/useBunks'
import { useToast } from '@/components/ui/Toast'
import type { Schedule, ScheduleAssignment } from '@/types'

interface SessionAssignmentModalProps {
  schedule: Schedule
  onClose: () => void
}

export function SessionAssignmentModal({ schedule, onClose }: SessionAssignmentModalProps) {
  const { toast } = useToast()
  const createAssignment = useCreateAssignment()
  const deleteAssignment = useDeleteAssignment()

  const [camperSearch, setCamperSearch] = useState('')
  const [selectedCamperId, setSelectedCamperId] = useState('')
  const [selectedBunkId, setSelectedBunkId] = useState('')
  const [showCamperDropdown, setShowCamperDropdown] = useState(false)

  const { data: camperData } = useCampers({ search: camperSearch || undefined, limit: 20 })
  const { data: bunks = [] } = useBunks()

  const campers = camperData?.items || []
  const assignments = schedule.assignments || []
  const assignmentCount = assignments.length
  const maxCapacity = schedule.max_capacity
  const capacityPercent = maxCapacity ? Math.min(100, Math.round((assignmentCount / maxCapacity) * 100)) : 0

  // Filter out already-assigned camper IDs from the search results
  const assignedCamperIds = useMemo(() => {
    const ids = new Set<string>()
    for (const a of assignments) {
      if (a.camper_id) ids.add(a.camper_id)
    }
    return ids
  }, [assignments])

  const filteredCampers = campers.filter((c) => !assignedCamperIds.has(c.id))

  async function handleAddCamper() {
    if (!selectedCamperId) {
      toast({ type: 'error', message: 'Please select a camper.' })
      return
    }
    try {
      await createAssignment.mutateAsync({
        schedule_id: schedule.id,
        camper_id: selectedCamperId,
      })
      toast({ type: 'success', message: 'Camper assigned.' })
      setSelectedCamperId('')
      setCamperSearch('')
      setShowCamperDropdown(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign camper.'
      toast({ type: 'error', message })
    }
  }

  async function handleAddBunk() {
    if (!selectedBunkId) {
      toast({ type: 'error', message: 'Please select a bunk.' })
      return
    }
    try {
      await createAssignment.mutateAsync({
        schedule_id: schedule.id,
        bunk_id: selectedBunkId,
      })
      toast({ type: 'success', message: 'Bunk assigned.' })
      setSelectedBunkId('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign bunk.'
      toast({ type: 'error', message })
    }
  }

  async function handleRemoveAssignment(assignment: ScheduleAssignment) {
    try {
      await deleteAssignment.mutateAsync(assignment.id)
      toast({ type: 'success', message: 'Assignment removed.' })
    } catch {
      toast({ type: 'error', message: 'Failed to remove assignment.' })
    }
  }

  function selectCamper(camperId: string, camperName: string) {
    setSelectedCamperId(camperId)
    setCamperSearch(camperName)
    setShowCamperDropdown(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Session Assignments
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Session details */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {schedule.activity_name || 'Activity'}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
              </span>
              {schedule.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {schedule.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {assignmentCount}{maxCapacity ? `/${maxCapacity}` : ''} assigned
              </span>
            </div>
          </div>

          {/* Capacity bar */}
          {maxCapacity && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Capacity</span>
                <span className="text-xs font-medium text-gray-900">
                  {assignmentCount} / {maxCapacity}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={
                    'h-full rounded-full transition-all ' +
                    (capacityPercent >= 90
                      ? 'bg-red-500'
                      : capacityPercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-blue-500')
                  }
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Current assignments */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Current Assignments ({assignmentCount})
            </h4>
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No campers assigned yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 shrink-0">
                        {assignment.camper_name
                          ? assignment.camper_name.charAt(0).toUpperCase()
                          : assignment.bunk_name
                            ? assignment.bunk_name.charAt(0).toUpperCase()
                            : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {assignment.camper_name || assignment.bunk_name || 'Unknown'}
                        </p>
                        {assignment.bunk_name && assignment.camper_name && (
                          <p className="text-xs text-gray-500">{assignment.bunk_name}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(assignment)}
                      disabled={deleteAssignment.isPending}
                      className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Camper */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" />
              Add Camper
            </h4>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={camperSearch}
                  onChange={(e) => {
                    setCamperSearch(e.target.value)
                    setSelectedCamperId('')
                    setShowCamperDropdown(true)
                  }}
                  onFocus={() => setShowCamperDropdown(true)}
                  placeholder="Search campers..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {showCamperDropdown && camperSearch && filteredCampers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                    {filteredCampers.map((camper) => (
                      <button
                        key={camper.id}
                        onClick={() =>
                          selectCamper(camper.id, `${camper.first_name} ${camper.last_name}`)
                        }
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {camper.first_name} {camper.last_name}
                        {camper.age !== null && (
                          <span className="ml-1 text-xs text-gray-400">
                            (age {camper.age})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddCamper}
                disabled={!selectedCamperId || createAssignment.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {createAssignment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Add
              </button>
            </div>
          </div>

          {/* Add Bunk */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              Add Bunk
            </h4>
            <div className="flex gap-2">
              <select
                value={selectedBunkId}
                onChange={(e) => setSelectedBunkId(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a bunk...</option>
                {bunks.map((bunk) => (
                  <option key={bunk.id} value={bunk.id}>
                    {bunk.name} (Cap: {bunk.capacity})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddBunk}
                disabled={!selectedBunkId || createAssignment.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {createAssignment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Home className="h-4 w-4" />
                )}
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
