/**
 * Camp Connect - StaffScheduleView
 * Read-only table showing each staff member's daily schedule.
 * Rows = staff members, columns = unique time slots, cells = assigned activities.
 */

import { useMemo } from 'react'
import { Loader2, Users, Calendar } from 'lucide-react'
import { useStaffScheduleView } from '@/hooks/useSchedules'
import { cn } from '@/lib/utils'
import type { StaffScheduleEntry, StaffScheduleSession } from '@/types'

interface StaffScheduleViewProps {
  eventId: string
  date: string
}

const ACTIVITY_COLORS: Record<string, string> = {
  sports: 'bg-green-100 text-green-800 border-green-200',
  arts: 'bg-purple-100 text-purple-800 border-purple-200',
  nature: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  water: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  education: 'bg-amber-100 text-amber-800 border-amber-200',
  other: 'bg-blue-100 text-blue-800 border-blue-200',
}

function getColorForActivity(activityName: string): string {
  const hash = activityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const keys = Object.keys(ACTIVITY_COLORS)
  return ACTIVITY_COLORS[keys[hash % keys.length]]
}

function formatTimeSlot(time: string): string {
  const parts = time.split(':')
  const hour = parseInt(parts[0], 10)
  const minute = parts[1] || '00'
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minute} ${ampm}`
}

export function StaffScheduleView({ eventId, date }: StaffScheduleViewProps) {
  const { data: staffEntries = [], isLoading } = useStaffScheduleView(eventId, date)

  const timeSlots = useMemo(() => {
    const slotSet = new Set<string>()
    for (const entry of staffEntries) {
      for (const session of entry.sessions) {
        slotSet.add(`${session.start_time}-${session.end_time}`)
      }
    }
    return Array.from(slotSet).sort()
  }, [staffEntries])

  const staffSessionMap = useMemo(() => {
    const map = new Map<string, Map<string, StaffScheduleSession>>()
    for (const entry of staffEntries) {
      const sessionMap = new Map<string, StaffScheduleSession>()
      for (const session of entry.sessions) {
        const key = `${session.start_time}-${session.end_time}`
        sessionMap.set(key, session)
      }
      map.set(entry.user_id, sessionMap)
    }
    return map
  }, [staffEntries])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (staffEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
        <Users className="h-8 w-8 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-900">No staff schedules</p>
        <p className="mt-1 text-sm text-gray-500">
          Assign staff to sessions to see their schedules here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-x-auto">
      <table className="w-full min-w[600px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[160px]">
              Staff Member
            </th>
            {timeSlots.map((slot) => {
              const [start, end] = slot.split('-')
              return (
                <th
                  key={slot}
                  className="bg-gray-50 px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w[140px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatTimeSlot(start)}
                  </div>
                  <div className="text-[10px] font-normal text-gray-400 mt-0.5">
                    to {formatTimeSlot(end)}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {staffEntries.map((entry: StaffScheduleEntry) => {
            const sessionMap = staffSessionMap.get(entry.user_id)
            return (
              <tr key={entry.user_id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                <td className="sticky left-0 z-10 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {entry.first_name.charAt(0)}{entry.last_name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {entry.first_name} {entry.last_name}
                    </span>
                  </div>
                </td>
                {timeSlots.map((slot) => {
                  const session = sessionMap?.get(slot)
                  if (!session) {
                    return (
                      <td key={slot} className="px-3 py-3 text-center">
                        <span className="text-xs text-gray-300">--</span>
                      </td>
                    )
                  }
                  const colorClass = getColorForActivity(session.activity_name)
                  return (
                    <td key={slot} className="px-3 py-3">
                      <div
                        className={cn(
                          'rounded-lg border px-2.5 py-1.5 text-center',
                          colorClass
                        )}
                      >
                        <p className="text-xs font-semibold truncate">
                          {session.activity_name}
                        </p>
                        {session.location && (
                          <p className="text-[10px] opacity-70 truncate mt-0.5">
                            {session.location}
                          </p>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
