/**
 * Camp Connect - NurseSchedulePage
 * Daily medicine administration dashboard and schedule management for camp nurses.
 */

import { useState, useMemo } from 'react'
import {
  Heart,
  Pill,
  Clock,
  Check,
  AlertCircle,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  ChevronDown,
  Search,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useEvents } from '@/hooks/useEvents'
import { useCampers } from '@/hooks/useCampers'
import {
  useNurseView,
  useMedicineSchedules,
  useCreateMedicineSchedule,
  useUpdateMedicineSchedule,
  useDeleteMedicineSchedule,
  useRecordAdministration,
} from '@/hooks/useMedicine'
import type {
  NurseViewItem,
  MedicineSchedule,
  MedicineScheduleCreate,
  MedicineScheduleUpdate,
} from '@/hooks/useMedicine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatTime12(time24: string): string {
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr ?? '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${m} ${ampm}`
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function sortedTimeKeys(slots: Record<string, NurseViewItem[]>): string[] {
  return Object.keys(slots).sort((a, b) => a.localeCompare(b))
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'dashboard' | 'schedules'

type AdminStatus = 'given' | 'skipped' | 'refused'

// ---------------------------------------------------------------------------
// NurseSchedulePage (main export)
// ---------------------------------------------------------------------------

export function NurseSchedulePage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Nurse Schedule
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Administer daily medications and manage camper medicine schedules
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              'flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors',
              activeTab === 'dashboard'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            <Heart className="h-4 w-4" />
            Nurse Dashboard
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={cn(
              'flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors',
              activeTab === 'schedules'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            <Pill className="h-4 w-4" />
            Medicine Schedules
          </button>
        </nav>
      </div>

      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'schedules' && <SchedulesTab />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════════════════

function DashboardTab() {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [eventFilter, setEventFilter] = useState<string>('')
  const [adminTarget, setAdminTarget] = useState<NurseViewItem | null>(null)

  const { data: events = [] } = useEvents()
  const { data: nurseView, isLoading } = useNurseView(
    selectedDate,
    eventFilter || undefined
  )

  const recordAdmin = useRecordAdministration()

  const total = nurseView?.total ?? 0
  const completed = nurseView?.completed ?? 0
  const pct = nurseView?.completion_pct ?? 0

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Date picker */}
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {/* Event filter */}
          <div className="relative">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(todayISO())}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
        </div>
      </div>

      {/* Progress card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Daily Completion
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {completed}{' '}
              <span className="text-base font-normal text-gray-500">
                of {total}
              </span>
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <span className="text-lg font-bold text-emerald-600">
              {Math.round(pct)}%
            </span>
          </div>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        {total > 0 && completed === total && (
          <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            All medications administered for today
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Time-slot sections */}
      {!isLoading && nurseView && (
        <div className="space-y-6">
          {sortedTimeKeys(nurseView.time_slots).length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
              <Pill className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                No medications scheduled
              </p>
              <p className="mt-1 text-sm text-gray-500">
                No medicine administrations are scheduled for this date
              </p>
            </div>
          )}

          {sortedTimeKeys(nurseView.time_slots).map((timeKey) => {
            const items = nurseView.time_slots[timeKey]
            const slotCompleted = items.filter((i) => i.administered).length
            const slotTotal = items.length
            return (
              <div key={timeKey}>
                {/* Time header */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">
                      {formatTime12(timeKey)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {slotCompleted}/{slotTotal} completed
                  </span>
                  {slotCompleted === slotTotal && slotTotal > 0 && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <NurseCard
                      key={`${item.schedule_id}-${item.scheduled_time}`}
                      item={item}
                      onAdminister={() => setAdminTarget(item)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Administer modal */}
      {adminTarget && (
        <AdministerModal
          item={adminTarget}
          date={selectedDate}
          isPending={recordAdmin.isPending}
          onClose={() => setAdminTarget(null)}
          onSubmit={async (status, notes) => {
            try {
              await recordAdmin.mutateAsync({
                schedule_id: adminTarget.schedule_id,
                scheduled_time: adminTarget.scheduled_time,
                administration_date: selectedDate,
                status,
                notes: notes || undefined,
              })
              toast({ type: 'success', message: 'Administration recorded.' })
              setAdminTarget(null)
            } catch {
              toast({
                type: 'error',
                message: 'Failed to record administration.',
              })
            }
          }}
        />
      )}
    </div>
  )
}

// ─── Nurse Card ────────────────────────────────────────────────

function NurseCard({
  item,
  onAdminister,
}: {
  item: NurseViewItem
  onAdminister: () => void
}) {
  const done = !!item.administered

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
        done ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {item.camper_name || 'Unknown Camper'}
          </p>
          {item.bunk_name && (
            <p className="text-xs text-gray-500">{item.bunk_name}</p>
          )}
        </div>
        {done && (
          <span
            className={cn(
              'ml-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
              item.administered!.status === 'given'
                ? 'bg-emerald-100 text-emerald-700'
                : item.administered!.status === 'skipped'
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-red-100 text-red-700'
            )}
          >
            <Check className="h-3 w-3" />
            {item.administered!.status === 'given'
              ? 'Given'
              : item.administered!.status === 'skipped'
                ? 'Skipped'
                : item.administered!.status === 'refused'
                  ? 'Refused'
                  : item.administered!.status}
          </span>
        )}
      </div>

      {/* Medicine info */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2">
          <Pill className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span className="text-sm font-medium text-gray-800">
            {item.medicine_name}
          </span>
        </div>
        <p className="pl-[22px] text-xs text-gray-600">
          Dosage: <span className="font-medium">{item.dosage}</span>
        </p>
        {item.special_instructions && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-800">
              {item.special_instructions}
            </p>
          </div>
        )}
      </div>

      {/* Action / status */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        {done ? (
          <div className="space-y-0.5">
            <p className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Recorded at{' '}
              {formatTimestamp(item.administered!.administered_at)}
            </p>
            {item.administered!.notes && (
              <p className="pl-5 text-xs text-gray-500">
                {item.administered!.notes}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={onAdminister}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" />
            Administer
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Administer Modal ──────────────────────────────────────────

function AdministerModal({
  item,
  date,
  isPending,
  onClose,
  onSubmit,
}: {
  item: NurseViewItem
  date: string
  isPending: boolean
  onClose: () => void
  onSubmit: (status: AdminStatus, notes: string) => void
}) {
  const [status, setStatus] = useState<AdminStatus>('given')
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Record Administration
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-900">
            {item.camper_name}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {item.medicine_name} &mdash; {item.dosage}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Scheduled: {formatTime12(item.scheduled_time)} on {date}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {/* Status */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Status
            </label>
            <div className="flex gap-2">
              {(
                [
                  {
                    value: 'given' as const,
                    label: 'Given',
                    icon: CheckCircle2,
                    color: 'emerald',
                  },
                  {
                    value: 'skipped' as const,
                    label: 'Skipped',
                    icon: XCircle,
                    color: 'amber',
                  },
                  {
                    value: 'refused' as const,
                    label: 'Refused',
                    icon: XCircle,
                    color: 'red',
                  },
                ]
              ).map((opt) => {
                const Icon = opt.icon
                const selected = status === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors',
                      selected &&
                        opt.color === 'emerald' &&
                        'border-emerald-500 bg-emerald-50 text-emerald-700',
                      selected &&
                        opt.color === 'amber' &&
                        'border-amber-500 bg-amber-50 text-amber-700',
                      selected &&
                        opt.color === 'red' &&
                        'border-red-500 bg-red-50 text-red-700',
                      !selected &&
                        'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes{' '}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any observations or notes..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(status, notes)}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULES TAB
// ═══════════════════════════════════════════════════════════════════════════

function SchedulesTab() {
  const { toast } = useToast()
  const [eventFilter, setEventFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] =
    useState<MedicineSchedule | null>(null)

  const { data: events = [] } = useEvents()

  const isActiveFilter =
    activeFilter === 'active'
      ? true
      : activeFilter === 'inactive'
        ? false
        : undefined

  const { data: schedules = [], isLoading } = useMedicineSchedules({
    event_id: eventFilter || undefined,
    is_active: isActiveFilter,
  })

  const deleteSchedule = useDeleteMedicineSchedule()

  const filteredSchedules = useMemo(() => {
    if (!searchQuery) return schedules
    const q = searchQuery.toLowerCase()
    return schedules.filter(
      (s) =>
        (s.camper_name ?? '').toLowerCase().includes(q) ||
        s.medicine_name.toLowerCase().includes(q)
    )
  }, [schedules, searchQuery])

  function openCreate() {
    setEditingSchedule(null)
    setShowModal(true)
  }

  function openEdit(schedule: MedicineSchedule) {
    setEditingSchedule(schedule)
    setShowModal(true)
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        'Delete this medicine schedule? This cannot be undone.'
      )
    )
      return
    try {
      await deleteSchedule.mutateAsync(id)
      toast({ type: 'success', message: 'Schedule deleted.' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete schedule.' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search camper or medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="relative">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Schedule
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredSchedules.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Pill className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No medicine schedules
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Add a schedule to start tracking medications
          </p>
        </div>
      )}

      {/* Schedule table */}
      {!isLoading && filteredSchedules.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Camper
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Medicine
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Dosage
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                  Frequency
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                  Times
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                  Dates
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {schedule.camper_name || 'Unknown'}
                      </p>
                      {schedule.bunk_name && (
                        <p className="text-xs text-gray-500">
                          {schedule.bunk_name}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {schedule.medicine_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {schedule.dosage}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-600 md:table-cell">
                    {schedule.frequency || '-'}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {schedule.scheduled_times ? (
                        schedule.scheduled_times.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700"
                          >
                            {formatTime12(t)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-gray-500 md:table-cell">
                    {new Date(schedule.start_date).toLocaleDateString()}
                    {schedule.end_date && (
                      <>
                        {' '}
                        &ndash;{' '}
                        {new Date(schedule.end_date).toLocaleDateString()}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        schedule.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(schedule)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <ScheduleFormModal
          existing={editingSchedule}
          onClose={() => {
            setShowModal(false)
            setEditingSchedule(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Schedule Form Modal ──────────────────────────────────────

const DEFAULT_TIMES = ['08:00', '12:00', '18:00', '21:00']

function ScheduleFormModal({
  existing,
  onClose,
}: {
  existing: MedicineSchedule | null
  onClose: () => void
}) {
  const { toast } = useToast()
  const { data: events = [] } = useEvents()
  const { data: campersData } = useCampers({ limit: 500 })
  const campers = campersData?.items ?? []

  const createSchedule = useCreateMedicineSchedule()
  const updateSchedule = useUpdateMedicineSchedule()

  const isEdit = !!existing

  // Form state
  const [camperId, setCamperId] = useState(existing?.camper_id ?? '')
  const [eventId, setEventId] = useState(existing?.event_id ?? '')
  const [medicineName, setMedicineName] = useState(
    existing?.medicine_name ?? ''
  )
  const [dosage, setDosage] = useState(existing?.dosage ?? '')
  const [frequency, setFrequency] = useState(existing?.frequency ?? '')
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(
    existing?.scheduled_times ?? ['08:00']
  )
  const [specialInstructions, setSpecialInstructions] = useState(
    existing?.special_instructions ?? ''
  )
  const [prescribedBy, setPrescribedBy] = useState(
    existing?.prescribed_by ?? ''
  )
  const [startDate, setStartDate] = useState(
    existing?.start_date ?? todayISO()
  )
  const [endDate, setEndDate] = useState(existing?.end_date ?? '')
  const [isActive, setIsActive] = useState(existing?.is_active ?? true)
  const [camperSearch, setCamperSearch] = useState('')

  const filteredCampers = useMemo(() => {
    if (!camperSearch) return campers
    const q = camperSearch.toLowerCase()
    return campers.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q)
    )
  }, [campers, camperSearch])

  function addTimeSlot() {
    const unused = DEFAULT_TIMES.find((t) => !scheduledTimes.includes(t))
    setScheduledTimes([...scheduledTimes, unused ?? '12:00'])
  }

  function removeTimeSlot(index: number) {
    setScheduledTimes(scheduledTimes.filter((_, i) => i !== index))
  }

  function updateTimeSlot(index: number, value: string) {
    const copy = [...scheduledTimes]
    copy[index] = value
    setScheduledTimes(copy)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isEdit) {
      const data: MedicineScheduleUpdate = {
        medicine_name: medicineName,
        dosage,
        frequency: frequency || undefined,
        scheduled_times:
          scheduledTimes.length > 0 ? scheduledTimes : undefined,
        special_instructions: specialInstructions || undefined,
        start_date: startDate,
        end_date: endDate || undefined,
        is_active: isActive,
      }
      try {
        await updateSchedule.mutateAsync({ id: existing!.id, data })
        toast({ type: 'success', message: 'Schedule updated.' })
        onClose()
      } catch {
        toast({ type: 'error', message: 'Failed to update schedule.' })
      }
    } else {
      const data: MedicineScheduleCreate = {
        camper_id: camperId,
        event_id: eventId,
        medicine_name: medicineName,
        dosage,
        frequency: frequency || undefined,
        scheduled_times:
          scheduledTimes.length > 0 ? scheduledTimes : undefined,
        special_instructions: specialInstructions || undefined,
        prescribed_by: prescribedBy || undefined,
        start_date: startDate,
        end_date: endDate || undefined,
      }
      try {
        await createSchedule.mutateAsync(data)
        toast({ type: 'success', message: 'Schedule created.' })
        onClose()
      } catch {
        toast({ type: 'error', message: 'Failed to create schedule.' })
      }
    }
  }

  const saving = createSchedule.isPending || updateSchedule.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Medicine Schedule' : 'Add Medicine Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Camper (only for create) */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Camper <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campers..."
                  value={camperSearch}
                  onChange={(e) => setCamperSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <select
                value={camperId}
                onChange={(e) => setCamperId(e.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                size={Math.min(filteredCampers.length + 1, 6)}
              >
                <option value="">Select a camper</option>
                {filteredCampers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Event (only for create) */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Event <span className="text-red-500">*</span>
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select an event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Medicine name & dosage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                required
                placeholder="e.g. Ibuprofen"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Dosage <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                required
                placeholder="e.g. 200mg"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select frequency</option>
              <option value="once_daily">Once Daily</option>
              <option value="twice_daily">Twice Daily</option>
              <option value="three_times_daily">Three Times Daily</option>
              <option value="four_times_daily">Four Times Daily</option>
              <option value="as_needed">As Needed</option>
              <option value="with_meals">With Meals</option>
              <option value="bedtime">Bedtime Only</option>
            </select>
          </div>

          {/* Scheduled times */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Scheduled Times
              </label>
              <button
                type="button"
                onClick={addTimeSlot}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-3 w-3" />
                Add time
              </button>
            </div>
            <div className="space-y-2">
              {scheduledTimes.map((time, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateTimeSlot(idx, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {scheduledTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(idx)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Prescribed by (only for create) */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Prescribed By
              </label>
              <input
                type="text"
                value={prescribedBy}
                onChange={(e) => setPrescribedBy(e.target.value)}
                placeholder="Doctor's name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Special instructions */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={2}
              placeholder="e.g. Take with food, avoid dairy..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Active toggle (only for edit) */}
          {isEdit && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              Active
            </label>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
