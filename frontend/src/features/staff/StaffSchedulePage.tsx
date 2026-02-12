/**
 * Camp Connect - Staff Schedule Page
 * Weekly shift grid with stats cards, day-of-week filtering, create/edit modal.
 */

import { useState, useMemo } from 'react'
import {
  CalendarDays,
  Clock,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  AlertTriangle,
  X,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useStaffShifts,
  useStaffScheduleStats,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
} from '@/hooks/useStaffSchedule'
import type { Shift } from '@/hooks/useStaffSchedule'

// ---- Constants ----

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
] as const

const SHIFT_TYPES = [
  { value: 'morning', label: 'Morning', icon: Sunrise },
  { value: 'afternoon', label: 'Afternoon', icon: Sun },
  { value: 'evening', label: 'Evening', icon: Sunset },
  { value: 'overnight', label: 'Overnight', icon: Moon },
  { value: 'full_day', label: 'Full Day', icon: Clock },
] as const

const STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const shiftTypeColors: Record<string, string> = {
  morning: 'bg-amber-50 text-amber-700 border-amber-200',
  afternoon: 'bg-sky-50 text-sky-700 border-sky-200',
  evening: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  overnight: 'bg-purple-50 text-purple-700 border-purple-200',
  full_day: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-700',
}

function shiftTypeIcon(type: string) {
  const found = SHIFT_TYPES.find((s) => s.value === type)
  return found?.icon ?? Clock
}

// ---- Stats Cards ----

function StatsCards() {
  const { data: stats, isLoading } = useStaffScheduleStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="mt-2 h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Shifts',
      value: stats?.total_shifts ?? 0,
      icon: CalendarDays,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Staff Scheduled',
      value: stats?.staff_count ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Coverage Gaps',
      value: stats?.coverage_gaps ?? 0,
      icon: AlertTriangle,
      color: stats?.coverage_gaps ? 'text-red-600' : 'text-green-600',
      bg: stats?.coverage_gaps ? 'bg-red-50' : 'bg-green-50',
    },
    {
      label: 'Shift Types',
      value: Object.keys(stats?.by_shift_type ?? {}).length,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className={cn('rounded-lg p-1.5', card.bg)}>
                <Icon className={cn('h-4 w-4', card.color)} />
              </div>
              <span className="text-xs font-medium text-gray-500">{card.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {Number(card.value).toLocaleString()}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ---- Shift Card ----

function ShiftCard({
  shift,
  onEdit,
  onDelete,
}: {
  shift: Shift
  onEdit: (s: Shift) => void
  onDelete: (s: Shift) => void
}) {
  const Icon = shiftTypeIcon(shift.shift_type)

  return (
    <div
      className={cn(
        'group rounded-lg border p-3 transition-all hover:shadow-md',
        shiftTypeColors[shift.shift_type] || 'bg-gray-50 text-gray-700 border-gray-200',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="font-medium text-sm">{shift.staff_name}</span>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(shift)}
            className="rounded p-1 hover:bg-white/60"
            title="Edit shift"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(shift)}
            className="rounded p-1 hover:bg-white/60 text-red-600"
            title="Delete shift"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs opacity-80">{shift.role}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-70">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {shift.start_time} - {shift.end_time}
        </span>
        {shift.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {shift.location}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
            statusColors[shift.status] || 'bg-gray-100 text-gray-600',
          )}
        >
          {shift.status}
        </span>
      </div>
      {shift.notes && (
        <p className="mt-1.5 text-[11px] italic opacity-60 line-clamp-2">{shift.notes}</p>
      )}
    </div>
  )
}

// ---- Create/Edit Modal ----

interface ShiftFormData {
  staff_name: string
  staff_id: string
  role: string
  shift_type: string
  start_time: string
  end_time: string
  location: string
  day_of_week: string
  notes: string
  status: string
}

const emptyForm: ShiftFormData = {
  staff_name: '',
  staff_id: '',
  role: '',
  shift_type: 'full_day',
  start_time: '08:00',
  end_time: '17:00',
  location: '',
  day_of_week: 'monday',
  notes: '',
  status: 'scheduled',
}

function ShiftModal({
  editingShift,
  onClose,
}: {
  editingShift: Shift | null
  onClose: () => void
}) {
  const { toast } = useToast()
  const createMutation = useCreateShift()
  const updateMutation = useUpdateShift()

  const [form, setForm] = useState<ShiftFormData>(() => {
    if (editingShift) {
      return {
        staff_name: editingShift.staff_name,
        staff_id: editingShift.staff_id || '',
        role: editingShift.role,
        shift_type: editingShift.shift_type,
        start_time: editingShift.start_time,
        end_time: editingShift.end_time,
        location: editingShift.location || '',
        day_of_week: editingShift.day_of_week,
        notes: editingShift.notes || '',
        status: editingShift.status,
      }
    }
    return { ...emptyForm }
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function handleChange(field: keyof ShiftFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.staff_name.trim() || !form.role.trim()) return

    const payload = {
      ...form,
      staff_id: form.staff_id || null,
      location: form.location || null,
      notes: form.notes || null,
    }

    if (editingShift) {
      updateMutation.mutate(
        { id: editingShift.id, data: payload },
        {
          onSuccess: () => {
            toast({ type: 'success', message: 'Shift updated successfully' })
            onClose()
          },
          onError: () => {
            toast({ type: 'error', message: 'Failed to update shift' })
          },
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast({ type: 'success', message: 'Shift created successfully' })
          onClose()
        },
        onError: () => {
          toast({ type: 'error', message: 'Failed to create shift' })
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingShift ? 'Edit Shift' : 'Create Shift'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Staff Name + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Staff Name *</label>
              <input
                type="text"
                required
                value={form.staff_name}
                onChange={(e) => handleChange('staff_name', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role *</label>
              <input
                type="text"
                required
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Counselor"
              />
            </div>
          </div>

          {/* Day + Shift Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Day of Week *</label>
              <div className="relative">
                <select
                  required
                  value={form.day_of_week}
                  onChange={(e) => handleChange('day_of_week', e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Shift Type</label>
              <div className="relative">
                <select
                  value={form.shift_type}
                  onChange={(e) => handleChange('shift_type', e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {SHIFT_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Start/End Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Time *</label>
              <input
                type="time"
                required
                value={form.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Time *</label>
              <input
                type="time"
                required
                value={form.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Location + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Main Hall"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Optional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingShift ? 'Update Shift' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Delete Confirmation Modal ----

function DeleteConfirmModal({
  shift,
  onClose,
  onConfirm,
  isPending,
}: {
  shift: Shift
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 text-red-600">
          <div className="rounded-full bg-red-50 p-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">Delete Shift</h3>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Are you sure you want to delete the shift for{' '}
          <span className="font-medium text-gray-900">{shift.staff_name}</span> on{' '}
          <span className="font-medium text-gray-900 capitalize">{shift.day_of_week}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Main Page Component ----

export function StaffSchedulePage() {
  const { toast } = useToast()

  // Filters
  const [selectedDay, setSelectedDay] = useState<string>('')
  const [selectedShiftType, setSelectedShiftType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null)

  const filters = useMemo(() => ({
    day_of_week: selectedDay || undefined,
    shift_type: selectedShiftType || undefined,
    search: searchQuery || undefined,
  }), [selectedDay, selectedShiftType, searchQuery])

  const { data: shifts, isLoading, error } = useStaffShifts(filters)
  const deleteMutation = useDeleteShift()

  // Group shifts by day of week for the grid
  const shiftsByDay = useMemo(() => {
    const groups: Record<string, Shift[]> = {}
    for (const day of DAYS_OF_WEEK) {
      groups[day.value] = []
    }
    if (shifts) {
      for (const s of shifts) {
        if (groups[s.day_of_week]) {
          groups[s.day_of_week].push(s)
        }
      }
    }
    return groups
  }, [shifts])

  function handleDelete() {
    if (!deletingShift) return
    deleteMutation.mutate(deletingShift.id, {
      onSuccess: () => {
        toast({ type: 'success', message: 'Shift deleted successfully' })
        setDeletingShift(null)
      },
      onError: () => {
        toast({ type: 'error', message: 'Failed to delete shift' })
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Staff Schedule
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage weekly staff shift assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Shift
        </button>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff, role, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Day filter */}
        <div className="relative">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Days</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Shift type filter */}
        <div className="relative">
          <select
            value={selectedShiftType}
            onChange={(e) => setSelectedShiftType(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Shift Types</option>
            {SHIFT_TYPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Day Tabs (quick filter) */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setSelectedDay('')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
            !selectedDay
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
          )}
        >
          All Days
        </button>
        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day.value}
            onClick={() => setSelectedDay(day.value === selectedDay ? '' : day.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
              selectedDay === day.value
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {day.short}
            {shifts && (
              <span className="ml-1 text-xs text-gray-400">
                ({shiftsByDay[day.value]?.length ?? 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm text-red-600">Failed to load schedule. Please try again.</p>
        </div>
      ) : !shifts?.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No shifts scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first shift to the schedule.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Shift
          </button>
        </div>
      ) : selectedDay ? (
        /* Single day view - shows cards */
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 capitalize">{selectedDay}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shiftsByDay[selectedDay]?.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onEdit={(s) => setEditingShift(s)}
                onDelete={(s) => setDeletingShift(s)}
              />
            ))}
            {!shiftsByDay[selectedDay]?.length && (
              <p className="col-span-full text-sm text-gray-500 py-8 text-center">
                No shifts for this day.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Weekly grid view */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayShifts = shiftsByDay[day.value] || []
            return (
              <div key={day.value} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <h3 className="font-semibold text-gray-900">{day.label}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {dayShifts.length}
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  {dayShifts.length === 0 ? (
                    <p className="py-4 text-center text-xs text-gray-400">No shifts</p>
                  ) : (
                    dayShifts.map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        shift={shift}
                        onEdit={(s) => setEditingShift(s)}
                        onDelete={(s) => setDeletingShift(s)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingShift) && (
        <ShiftModal
          editingShift={editingShift}
          onClose={() => {
            setShowCreateModal(false)
            setEditingShift(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingShift && (
        <DeleteConfirmModal
          shift={deletingShift}
          onClose={() => setDeletingShift(null)}
          onConfirm={handleDelete}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
