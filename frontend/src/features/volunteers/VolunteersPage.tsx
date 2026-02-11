/**
 * Camp Connect - Volunteers Page
 * Tabs: Volunteers | Shift Schedule | Hours Log
 */

import { useState, useMemo } from 'react'
import {
  HandHeart,
  Clock,
  CalendarDays,
  UserCheck,
  Plus,
  Search,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useVolunteers,
  useVolunteerStats,
  useCreateVolunteer,
  useDeleteVolunteer,
  useVolunteerShifts,
  useCreateShift,
  useLogHours,
} from '@/hooks/useVolunteers'
import type { Volunteer } from '@/types'

const TABS = ['Volunteers', 'Shift Schedule', 'Hours Log'] as const
type Tab = (typeof TABS)[number]

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  inactive: 'bg-slate-500/15 text-slate-400',
  pending: 'bg-amber-500/15 text-amber-400',
}

const BG_CHECK_COLORS: Record<string, string> = {
  cleared: 'bg-emerald-500/15 text-emerald-400',
  pending: 'bg-amber-500/15 text-amber-400',
  failed: 'bg-red-500/15 text-red-400',
}

const SHIFT_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/15 text-blue-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-slate-500/15 text-slate-400',
  no_show: 'bg-red-500/15 text-red-400',
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SKILLS_OPTIONS = ['First Aid', 'CPR', 'Lifeguard', 'Teaching', 'Sports', 'Arts & Crafts', 'Music', 'Cooking', 'Leadership', 'Counseling']

function getWeekDates(offset: number) {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  const monday = new Date(now.setDate(diff))
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Add Volunteer Modal ─────────────────────────────────────────

function AddVolunteerModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const createVolunteer = useCreateVolunteer()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'pending' as const,
    skills: [] as string[],
    availability: [] as string[],
    background_check_status: 'pending' as const,
    hours_logged: 0,
    start_date: '',
    notes: '',
  })

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter((d) => d !== day)
        : [...prev.availability, day],
    }))
  }

  const handleSubmit = () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast({ type: 'error', message: 'Name and email are required' })
      return
    }
    createVolunteer.mutate(
      {
        ...form,
        start_date: form.start_date || null,
        phone: form.phone || null,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          toast({ type: 'success', message: 'Volunteer added successfully' })
          onClose()
        },
        onError: () => toast({ type: 'error', message: 'Failed to add volunteer' }),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#1e293b] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Volunteer</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">First Name *</label>
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Last Name *</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    form.skills.includes(skill)
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Availability</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    form.availability.includes(day)
                      ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createVolunteer.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {createVolunteer.isPending ? 'Adding...' : 'Add Volunteer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Schedule Shift Modal ────────────────────────────────────────

function ScheduleShiftModal({
  volunteers,
  onClose,
}: {
  volunteers: Volunteer[]
  onClose: () => void
}) {
  const { toast } = useToast()
  const createShift = useCreateShift()
  const [form, setForm] = useState({
    volunteer_id: '',
    activity: '',
    location: '',
    date: '',
    start_time: '09:00',
    end_time: '12:00',
    notes: '',
  })

  const selectedVol = volunteers.find((v) => v.id === form.volunteer_id)
  const volunteerName = selectedVol ? `${selectedVol.first_name} ${selectedVol.last_name}` : ''

  const computeHours = () => {
    if (!form.start_time || !form.end_time) return 0
    const [sh, sm] = form.start_time.split(':').map(Number)
    const [eh, em] = form.end_time.split(':').map(Number)
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
  }

  const handleSubmit = () => {
    if (!form.volunteer_id || !form.activity || !form.date) {
      toast({ type: 'error', message: 'Volunteer, activity, and date are required' })
      return
    }
    createShift.mutate(
      {
        volunteer_id: form.volunteer_id,
        volunteer_name: volunteerName,
        activity: form.activity,
        location: form.location || null,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        hours: computeHours(),
        status: 'scheduled',
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          toast({ type: 'success', message: 'Shift scheduled successfully' })
          onClose()
        },
        onError: () => toast({ type: 'error', message: 'Failed to schedule shift' }),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1e293b] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Schedule Shift</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Volunteer *</label>
            <select
              value={form.volunteer_id}
              onChange={(e) => setForm({ ...form, volunteer_id: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select volunteer...</option>
              {volunteers
                .filter((v) => v.status === 'active')
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.first_name} {v.last_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Activity *</label>
            <input
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Arts & Crafts, Kitchen Help"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Main Hall, Field A"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createShift.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {createShift.isPending ? 'Scheduling...' : 'Schedule Shift'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ───────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: typeof HandHeart; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#1e293b] p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────

export function VolunteersPage() {
  const [tab, setTab] = useState<Tab>('Volunteers')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  const { data: volunteers = [], isLoading } = useVolunteers({
    status: statusFilter || undefined,
    search: search || undefined,
  })
  const { data: stats } = useVolunteerStats()
  const { data: shifts = [] } = useVolunteerShifts()
  const deleteVolunteer = useDeleteVolunteer()
  const logHours = useLogHours()
  const { toast } = useToast()

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  const weekShifts = useMemo(
    () => shifts.filter((s) => s.date >= weekDates[0] && s.date <= weekDates[6]),
    [shifts, weekDates],
  )

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Remove volunteer ${name}?`)) return
    deleteVolunteer.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Volunteer removed' }),
      onError: () => toast({ type: 'error', message: 'Failed to remove volunteer' }),
    })
  }

  const handleLogHours = (id: string) => {
    const input = window.prompt('Hours to log:')
    if (!input) return
    const hours = parseFloat(input)
    if (isNaN(hours) || hours <= 0) {
      toast({ type: 'error', message: 'Please enter a valid number' })
      return
    }
    logHours.mutate(
      { id, hours },
      {
        onSuccess: () => toast({ type: 'success', message: `Logged ${hours} hours` }),
        onError: () => toast({ type: 'error', message: 'Failed to log hours' }),
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Volunteers</h1>
          <p className="mt-1 text-sm text-slate-400">Manage volunteer roster, shifts, and hours</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            <CalendarDays className="h-4 w-4" />
            Schedule Shift
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Add Volunteer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={HandHeart} label="Total Volunteers" value={stats?.total_volunteers ?? 0} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard icon={UserCheck} label="Active" value={stats?.active ?? 0} color="bg-blue-500/15 text-blue-400" />
        <StatCard icon={Clock} label="Total Hours" value={stats?.total_hours?.toFixed(1) ?? '0.0'} color="bg-purple-500/15 text-purple-400" />
        <StatCard icon={CalendarDays} label="Upcoming Shifts" value={stats?.upcoming_shifts ?? 0} color="bg-amber-500/15 text-amber-400" />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06]">
        <div className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'Volunteers' && (
        <div>
          {/* Search / Filter */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search volunteers..."
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-400">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Email</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Skills</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Hours</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Background</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      Loading volunteers...
                    </td>
                  </tr>
                ) : volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <HandHeart className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                      No volunteers yet. Click "Add Volunteer" to get started.
                    </td>
                  </tr>
                ) : (
                  volunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-white">
                        {vol.first_name} {vol.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{vol.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[vol.status] ?? ''}`}>
                          {vol.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {vol.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                              {skill}
                            </span>
                          ))}
                          {vol.skills.length > 3 && (
                            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">
                              +{vol.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{vol.hours_logged.toFixed(1)}h</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${BG_CHECK_COLORS[vol.background_check_status] ?? ''}`}>
                          {vol.background_check_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleLogHours(vol.id)}
                            title="Log hours"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-emerald-400"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vol.id, `${vol.first_name} ${vol.last_name}`)}
                            title="Remove"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Shift Schedule' && (
        <div>
          {/* Week Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-medium text-white">
              {formatDate(weekDates[0])} &mdash; {formatDate(weekDates[6])}
            </h3>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekly Grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((dateStr, idx) => {
              const dayShifts = weekShifts.filter((s) => s.date === dateStr)
              return (
                <div key={dateStr} className="min-h-[140px] rounded-xl border border-white/[0.06] bg-[#1e293b] p-3">
                  <p className="mb-2 text-xs font-medium text-slate-400">{DAYS[idx]?.slice(0, 3)}</p>
                  <p className="mb-3 text-sm font-semibold text-white">{dateStr.split('-')[2]}</p>
                  <div className="space-y-1.5">
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="rounded-lg bg-emerald-500/10 p-2 text-xs"
                      >
                        <p className="font-medium text-emerald-400">{shift.volunteer_name}</p>
                        <p className="text-slate-400">
                          {shift.activity} {shift.start_time}-{shift.end_time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'Hours Log' && (
        <div>
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-400">Volunteer</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Activity</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Date</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Time</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Hours</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <Clock className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                      No shifts logged yet. Schedule shifts to track hours.
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-white">{shift.volunteer_name}</td>
                      <td className="px-4 py-3 text-slate-300">{shift.activity}</td>
                      <td className="px-4 py-3 text-slate-300">{formatDate(shift.date)}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {shift.start_time} - {shift.end_time}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{shift.hours.toFixed(1)}h</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${SHIFT_STATUS_COLORS[shift.status] ?? ''}`}>
                          {shift.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {shifts.length > 0 && (
                <tfoot className="border-t border-white/[0.06] bg-white/[0.02]">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-medium text-slate-400">
                      Total Hours:
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      {shifts.reduce((sum, s) => sum + s.hours, 0).toFixed(1)}h
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && <AddVolunteerModal onClose={() => setShowAddModal(false)} />}
      {showShiftModal && (
        <ScheduleShiftModal volunteers={volunteers} onClose={() => setShowShiftModal(false)} />
      )}
    </div>
  )
}
