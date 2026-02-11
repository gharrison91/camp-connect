/**
 * Camp Connect - WeekView
 * 7-column layout showing sessions for each day of the week.
 * Click a day header to drill into DayView, click a session to open assignment modal.
 */

import { ChevronLeft, ChevronRight, Loader2, Clock, MapPin, Users, CalendarDays } from 'lucide-react'
import { useWeekView } from '@/hooks/useSchedules'
import { cn } from '@/lib/utils'
import type { Schedule } from '@/types'

interface WeekViewProps {
  eventId: string
  startDate: string // ISO date string for the Monday of the week
  onPrevWeek: () => void
  onNextWeek: () => void
  onSelectDay: (date: string) => void
  onSelectSession: (schedule: Schedule) => void
}

const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('default', { month: 'short', day: 'numeric' })
}

function formatWeekRange(startDate: string): string {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const startMonth = start.toLocaleDateString('default', { month: 'short' })
  const endMonth = end.toLocaleDateString('default', { month: 'short' })
  const startDay = start.getDate()
  const endDay = end.getDate()
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
}

function formatTime(timeStr: string): string {
  const parts = timeStr.split(':')
  const hour = parseInt(parts[0], 10)
  const minute = parts[1] || '00'
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minute} ${ampm}`
}

function getSessionColor(category?: string): string {
  switch (category) {
    case 'sports':
      return 'border-green-200 bg-green-50 hover:border-green-300'
    case 'arts':
      return 'border-purple-200 bg-purple-50 hover:border-purple-300'
    case 'nature':
      return 'border-emerald-200 bg-emerald-50 hover:border-emerald-300'
    case 'water':
      return 'border-cyan-200 bg-cyan-50 hover:border-cyan-300'
    case 'education':
      return 'border-amber-200 bg-amber-50 hover:border-amber-300'
    default:
      return 'border-blue-200 bg-blue-50 hover:border-blue-300'
  }
}

export function WeekView({
  eventId,
  startDate,
  onPrevWeek,
  onNextWeek,
  onSelectDay,
  onSelectSession,
}: WeekViewProps) {
  const { data: weekDays, isLoading } = useWeekView(eventId, startDate)

  const today = new Date().toISOString().split('T')[0]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  const days = weekDays || []
  const hasAnySessions = days.some((d) => d.sessions.length > 0)

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Week header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <button
          onClick={onPrevWeek}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {formatWeekRange(startDate)}
        </h2>
        <button
          onClick={onNextWeek}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {!hasAnySessions && (
        <div className="flex flex-col items-center justify-center py-16">
          <CalendarDays className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No sessions this week</p>
          <p className="mt-1 text-sm text-gray-500">
            Create sessions to see them here.
          </p>
        </div>
      )}

      {hasAnySessions && (
        <>
          {/* Desktop: 7-column layout */}
          <div className="hidden lg:grid lg:grid-cols-7 lg:divide-x lg:divide-gray-100">
            {days.map((day, idx) => {
              const isToday = day.date === today
              return (
                <div key={day.date} className="min-h-[200px]">
                  {/* Day header */}
                  <button
                    onClick={() => onSelectDay(day.date)}
                    className={cn(
                      'flex w-full flex-col items-center border-b border-gray-100 py-3 transition-colors hover:bg-gray-50',
                      isToday && 'bg-emerald-50/50'
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {DAY_NAMES_SHORT[idx]}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                        isToday
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-900'
                      )}
                    >
                      {new Date(day.date + 'T00:00:00').getDate()}
                    </span>
                  </button>

                  {/* Sessions */}
                  <div className="space-y-1.5 p-1.5">
                    {day.sessions.map((session) => {
                      const assignmentCount = session.assignments?.length || 0
                      return (
                        <button
                          key={session.id}
                          onClick={() => onSelectSession(session)}
                          className={cn(
                            'w-full rounded-lg border p-2 text-left transition-all hover:shadow-sm',
                            session.is_cancelled
                              ? 'border-gray-200 bg-gray-50 opacity-60'
                              : getSessionColor(session.activity_category)
                          )}
                        >
                          <p
                            className={cn(
                              'text-xs font-semibold truncate',
                              session.is_cancelled
                                ? 'text-gray-400 line-through'
                                : 'text-gray-900'
                            )}
                          >
                            {session.activity_name || 'Activity'}
                          </p>
                          <div className="mt-1 space-y-0.5">
                            <p className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTime(session.start_time)} - {formatTime(session.end_time)}
                            </p>
                            {session.location && (
                              <p className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                {session.location}
                              </p>
                            )}
                            <p className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Users className="h-2.5 w-2.5" />
                              {assignmentCount}{session.max_capacity ? `/${session.max_capacity}` : ''}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tablet/mobile: stacked list */}
          <div className="lg:hidden divide-y divide-gray-100">
            {days.map((day, idx) => {
              const isToday = day.date === today
              if (day.sessions.length === 0) return null
              return (
                <div key={day.date}>
                  {/* Day header */}
                  <button
                    onClick={() => onSelectDay(day.date)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50',
                      isToday && 'bg-emerald-50/50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg',
                        isToday
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      <span className="text-[10px] font-medium uppercase leading-none">
                        {DAY_NAMES_SHORT[idx]}
                      </span>
                      <span className="text-sm font-bold leading-none mt-0.5">
                        {new Date(day.date + 'T00:00:00').getDate()}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDateShort(day.date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>

                  {/* Sessions */}
                  <div className="space-y-2 px-4 pb-3">
                    {day.sessions.map((session) => {
                      const assignmentCount = session.assignments?.length || 0
                      return (
                        <button
                          key={session.id}
                          onClick={() => onSelectSession(session)}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm',
                            session.is_cancelled
                              ? 'border-gray-200 bg-gray-50 opacity-60'
                              : getSessionColor(session.activity_category)
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-sm font-semibold',
                                session.is_cancelled
                                  ? 'text-gray-400 line-through'
                                  : 'text-gray-900'
                              )}
                            >
                              {session.activity_name || 'Activity'}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                              </span>
                              {session.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {session.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {assignmentCount}{session.max_capacity ? `/${session.max_capacity}` : ''} assigned
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
