/**
 * Camp Connect - DayView
 * Time-slot grid showing schedule sessions for a day (6am-9pm).
 */

import { Clock, MapPin, Users, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Schedule } from '@/types'

interface DayViewProps {
  sessions: Schedule[]
  onEdit: (schedule: Schedule) => void
  onDelete: (scheduleId: string) => void
  canEdit: boolean
  canDelete: boolean
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6am to 9pm

function formatHour(hour: number): string {
  if (hour === 0 || hour === 12) return `${hour === 0 ? 12 : 12}:00 ${hour < 12 ? 'AM' : 'PM'}`
  return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
}

function getHourFromTime(timeStr: string): number {
  return parseInt(timeStr.split(':')[0], 10)
}

export function DayView({ sessions, onEdit, onDelete, canEdit, canDelete }: DayViewProps) {
  // Group sessions by start hour
  const sessionsByHour: Record<number, Schedule[]> = {}
  for (const session of sessions) {
    const hour = getHourFromTime(session.start_time)
    if (!sessionsByHour[hour]) sessionsByHour[hour] = []
    sessionsByHour[hour].push(session)
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
        <Clock className="h-8 w-8 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-900">No sessions scheduled</p>
        <p className="mt-1 text-sm text-gray-500">Add a session to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      {HOURS.map((hour) => {
        const hourSessions = sessionsByHour[hour] || []
        return (
          <div
            key={hour}
            className={cn(
              'flex border-b border-gray-50 last:border-b-0',
              hourSessions.length > 0 ? 'bg-white' : 'bg-gray-50/30'
            )}
          >
            {/* Time label */}
            <div className="w-24 shrink-0 border-r border-gray-100 px-3 py-3">
              <span className="text-xs font-medium text-gray-500">
                {formatHour(hour)}
              </span>
            </div>

            {/* Sessions in this hour */}
            <div className="flex-1 p-2">
              {hourSessions.length === 0 ? (
                <div className="h-8" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {hourSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        'flex-1 min-w-[200px] rounded-lg border p-3 transition-all',
                        session.is_cancelled
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : 'border-blue-100 bg-blue-50/50 hover:border-blue-200'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4
                            className={cn(
                              'text-sm font-semibold',
                              session.is_cancelled
                                ? 'text-gray-400 line-through'
                                : 'text-gray-900'
                            )}
                          >
                            {session.activity_name || 'Activity'}
                          </h4>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                            </span>
                            {session.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.location}
                              </span>
                            )}
                            {session.max_capacity && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Cap: {session.max_capacity}
                              </span>
                            )}
                          </div>
                          {session.is_cancelled && (
                            <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                              Cancelled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => onEdit(session)}
                              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => onDelete(session.id)}
                              className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
