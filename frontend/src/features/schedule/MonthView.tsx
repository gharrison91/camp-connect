/**
 * Camp Connect - MonthView
 * Full month calendar grid showing session counts per day.
 * Click on a day to drill down to DayView.
 */

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from 'lucide-react'
import { useMonthOverview } from '@/hooks/useSchedules'
import type { MonthOverviewDay } from '@/hooks/useSchedules'
import { cn } from '@/lib/utils'

interface MonthViewProps {
  eventId: string
  year: number
  month: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onSelectDay: (date: string) => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getMonthName(month: number): string {
  return new Date(2026, month - 1, 1).toLocaleString('default', { month: 'long' })
}

function getDotColor(index: number): string {
  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-rose-500',
  ]
  return colors[index % colors.length]
}

export function MonthView({
  eventId,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: MonthViewProps) {
  const { data: overview, isLoading } = useMonthOverview(eventId, year, month)

  const today = new Date().toISOString().split('T')[0]

  const calendarDays = useMemo(() => {
    const firstDayDate = new Date(year, month - 1, 1)
    const lastDayDate = new Date(year, month, 0)
    const startDayOfWeek = firstDayDate.getDay() // 0=Sun
    const daysInMonth = lastDayDate.getDate()

    // Previous month trailing days
    const prevMonthDate = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonthDate.getDate()

    const cells: Array<{
      date: string
      day: number
      isCurrentMonth: boolean
      isToday: boolean
      data: MonthOverviewDay | null
    }> = []

    // Leading days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      const m = month - 1 <= 0 ? 12 : month - 1
      const y = month - 1 <= 0 ? year - 1 : year
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        date: dateStr,
        day: d,
        isCurrentMonth: false,
        isToday: dateStr === today,
        data: null,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === today,
        data: overview?.days[dateStr] || null,
      })
    }

    // Trailing days from next month
    const remaining = 42 - cells.length // Always show 6 rows
    for (let d = 1; d <= remaining; d++) {
      const m = month + 1 > 12 ? 1 : month + 1
      const y = month + 1 > 12 ? year + 1 : year
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        date: dateStr,
        day: d,
        isCurrentMonth: false,
        isToday: dateStr === today,
        data: null,
      })
    }

    return cells
  }, [year, month, overview, today])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Month header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <button
          onClick={onPrevMonth}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {getMonthName(month)} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid - desktop */}
      <div className="hidden sm:grid sm:grid-cols-7">
        {calendarDays.map((cell, i) => {
          const hasData = cell.data !== null && cell.data.count > 0
          const activities = cell.data?.activities || []
          const visibleActivities = activities.slice(0, 3)
          const overflow = activities.length > 3 ? activities.length - 3 : 0

          return (
            <button
              key={`${cell.date}-${i}`}
              onClick={() => onSelectDay(cell.date)}
              className={cn(
                'relative flex min-h-[90px] flex-col border-b border-r border-gray-50 p-2 text-left transition-colors hover:bg-gray-50',
                !cell.isCurrentMonth && 'bg-gray-50/50',
                cell.isCurrentMonth && hasData && 'hover:bg-emerald-50/50'
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                  cell.isToday
                    ? 'bg-emerald-600 text-white'
                    : cell.isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-300'
                )}
              >
                {cell.day}
              </span>

              {/* Activity dots/badges */}
              {hasData && cell.isCurrentMonth && (
                <div className="mt-1 space-y-0.5">
                  {visibleActivities.map((activity, idx) => (
                    <div
                      key={activity}
                      className="flex items-center gap-1 truncate"
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          getDotColor(idx)
                        )}
                      />
                      <span className="truncate text-[10px] text-gray-600">
                        {activity}
                      </span>
                    </div>
                  ))}
                  {overflow > 0 && (
                    <span className="text-[10px] font-medium text-gray-400">
                      +{overflow} more
                    </span>
                  )}
                </div>
              )}

              {/* Session count badge */}
              {hasData && cell.isCurrentMonth && cell.data && (
                <span className="absolute right-1.5 top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-100 px-1 text-[10px] font-bold text-emerald-700">
                  {cell.data.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Calendar list - mobile */}
      <div className="sm:hidden divide-y divide-gray-50">
        {calendarDays
          .filter((cell) => cell.isCurrentMonth && cell.data !== null && cell.data.count > 0)
          .map((cell) => {
            const dayOfWeek = new Date(cell.date).toLocaleDateString('default', {
              weekday: 'short',
            })
            return (
              <button
                key={cell.date}
                onClick={() => onSelectDay(cell.date)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg',
                    cell.isToday
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  <span className="text-[10px] font-medium uppercase leading-none">
                    {dayOfWeek}
                  </span>
                  <span className="text-sm font-bold leading-none mt-0.5">
                    {cell.day}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {cell.data!.count} session{cell.data!.count !== 1 ? 's' : ''}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {cell.data!.activities.join(', ')}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              </button>
            )
          })}
        {calendarDays.filter(
          (cell) => cell.isCurrentMonth && cell.data !== null && cell.data.count > 0
        ).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              No sessions this month
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Create sessions to see them on the calendar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
