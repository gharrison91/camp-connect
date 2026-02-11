/**
 * Camp Connect - SchedulePage
 * Full calendar view system with Monthly, Weekly, Daily, and Staff views.
 * Supports drill-down: Month -> Week -> Day with smooth navigation.
 */

import { useState, useCallback } from 'react'
import {
  CalendarDays,
  Plus,
  Loader2,
  Users,
  Calendar,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useEvents } from '@/hooks/useEvents'
import { useDailyView, useDeleteSchedule } from '@/hooks/useSchedules'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/Toast'
import { DayView } from './DayView'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { ScheduleSessionModal } from './ScheduleSessionModal'
import { SessionAssignmentModal } from './SessionAssignmentModal'
import { StaffScheduleView } from './StaffScheduleView'
import { cn } from '@/lib/utils'
import type { Schedule } from '@/types'

type ViewMode = 'month' | 'week' | 'day' | 'staff'

/** Get the Monday (start of week) for a given date string */
function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

/** Shift a date string by N days */
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/** Format a date for the day view header */
function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const VIEW_TABS: { key: ViewMode; label: string; icon: typeof CalendarDays }[] = [
  { key: 'month', label: 'Month', icon: LayoutGrid },
  { key: 'week', label: 'Week', icon: Calendar },
  { key: 'day', label: 'Day', icon: CalendarDays },
  { key: 'staff', label: 'Staff', icon: Users },
]

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
  const [assigningSchedule, setAssigningSchedule] = useState<Schedule | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  // Derived state for month/week views
  const selectedDateObj = new Date(selectedDate + 'T00:00:00')
  const currentYear = selectedDateObj.getFullYear()
  const currentMonth = selectedDateObj.getMonth() + 1 // 1-indexed
  const currentWeekStart = getMonday(selectedDate)

  // Daily view data - only fetched when in day/staff view
  const { data: sessions = [], isLoading: sessionsLoading } = useDailyView(
    selectedEventId && (viewMode === 'day') ? selectedEventId : undefined,
    selectedEventId && (viewMode === 'day') ? selectedDate : undefined
  )

  const deleteSchedule = useDeleteSchedule()

  function handleEdit(schedule: Schedule) {
    setEditingSchedule(schedule)
    setShowModal(true)
  }

  function handleAssign(schedule: Schedule) {
    setAssigningSchedule(schedule)
  }

  async function handleDelete(scheduleId: string) {
    try {
      await deleteSchedule.mutateAsync(scheduleId)
      toast({ type: 'success', message: 'Session deleted.' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete session.' })
    }
  }

  // Month navigation
  const handlePrevMonth = useCallback(() => {
    const d = new Date(currentYear, currentMonth - 2, 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }, [currentYear, currentMonth])

  const handleNextMonth = useCallback(() => {
    const d = new Date(currentYear, currentMonth, 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }, [currentYear, currentMonth])

  // Week navigation
  const handlePrevWeek = useCallback(() => {
    setSelectedDate(shiftDate(currentWeekStart, -7))
  }, [currentWeekStart])

  const handleNextWeek = useCallback(() => {
    setSelectedDate(shiftDate(currentWeekStart, 7))
  }, [currentWeekStart])

  // Day navigation
  const handlePrevDay = useCallback(() => {
    setSelectedDate(shiftDate(selectedDate, -1))
  }, [selectedDate])

  const handleNextDay = useCallback(() => {
    setSelectedDate(shiftDate(selectedDate, 1))
  }, [selectedDate])

  // Drill-down handlers
  const handleSelectDayFromMonth = useCallback((date: string) => {
    setSelectedDate(date)
    setViewMode('day')
  }, [])

  const handleSelectDayFromWeek = useCallback((date: string) => {
    setSelectedDate(date)
    setViewMode('day')
  }, [])

  const handleSelectSessionFromWeek = useCallback((schedule: Schedule) => {
    setAssigningSchedule(schedule)
  }, [])

  // Handle date picker change - update the date context for the current view
  function handleDateChange(newDate: string) {
    setSelectedDate(newDate)
  }

  const isLoading = eventsLoading || (viewMode === 'day' && sessionsLoading)

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
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select an event...</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>{evt.name}</option>
            ))}
          </select>

          {/* Date picker - context-aware */}
          {viewMode === 'month' && (
            <input
              type="month"
              value={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-')
                setSelectedDate(`${y}-${m}-01`)
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          )}
          {viewMode === 'week' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          )}
          {(viewMode === 'day' || viewMode === 'staff') && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          )}

          {hasPermission('scheduling.sessions.create') && selectedEventId && (
            <button
              onClick={() => { setEditingSchedule(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Add Session
            </button>
          )}
        </div>
      </div>

      {/* View mode toggle */}
      {selectedEventId && (
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!selectedEventId && !eventsLoading && (
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
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Month View */}
      {selectedEventId && !eventsLoading && viewMode === 'month' && (
        <MonthView
          eventId={selectedEventId}
          year={currentYear}
          month={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectDay={handleSelectDayFromMonth}
        />
      )}

      {/* Week View */}
      {selectedEventId && !eventsLoading && viewMode === 'week' && (
        <WeekView
          eventId={selectedEventId}
          startDate={currentWeekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onSelectDay={handleSelectDayFromWeek}
          onSelectSession={handleSelectSessionFromWeek}
        />
      )}

      {/* Day View */}
      {selectedEventId && !isLoading && viewMode === 'day' && (
        <div>
          {/* Day navigation header */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-3 shadow-sm">
            <button
              onClick={handlePrevDay}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {formatDayHeader(selectedDate)}
            </h2>
            <button
              onClick={handleNextDay}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <DayView
            sessions={sessions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAssign={handleAssign}
            canEdit={hasPermission('scheduling.sessions.update')}
            canDelete={hasPermission('scheduling.sessions.delete')}
          />
        </div>
      )}

      {/* Staff Schedule View */}
      {selectedEventId && !eventsLoading && viewMode === 'staff' && (
        <StaffScheduleView eventId={selectedEventId} date={selectedDate} />
      )}

      {/* Create/Edit Session Modal */}
      {showModal && (
        <ScheduleSessionModal
          eventId={selectedEventId}
          date={selectedDate}
          schedule={editingSchedule}
          onClose={() => { setShowModal(false); setEditingSchedule(null) }}
        />
      )}

      {/* Assignment Modal */}
      {assigningSchedule && (
        <SessionAssignmentModal
          schedule={assigningSchedule}
          onClose={() => setAssigningSchedule(null)}
        />
      )}
    </div>
  )
}
