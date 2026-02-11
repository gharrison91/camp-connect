/**
 * Camp Connect - Attendance Tracking Page
 * Tabs: Take Attendance | Reports | History
 */

import { useState, useMemo } from 'react'
import {
  ClipboardCheck,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  BarChart,
  Search,
  ChevronDown,
  Loader2,
  Save,
  Users,
  Star,
  AlertTriangle,
} from 'lucide-react'
import { useActivities } from '@/hooks/useActivities'
import {
  useAttendanceStats,
  useBulkAttendance,
  useCamperAttendanceHistory,
} from '@/hooks/useAttendance'
import { useToast } from '@/components/ui/Toast'

// --- Types ---

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

interface CamperRow {
  id: string
  name: string
  photo: string | null
  status: AttendanceStatus
  notes: string
}

const TABS = ['Take Attendance', 'Reports', 'History'] as const
type Tab = (typeof TABS)[number]

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: typeof UserCheck }> = {
  present: { label: 'Present', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', icon: UserCheck },
  absent: { label: 'Absent', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: UserX },
  late: { label: 'Late', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: Clock },
  excused: { label: 'Excused', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', icon: CalendarDays },
}

// Mock camper data (would come from API in production)
const MOCK_CAMPERS = [
  { id: 'c1', first_name: 'Emma', last_name: 'Johnson', photo_url: null },
  { id: 'c2', first_name: 'Liam', last_name: 'Smith', photo_url: null },
  { id: 'c3', first_name: 'Olivia', last_name: 'Williams', photo_url: null },
  { id: 'c4', first_name: 'Noah', last_name: 'Brown', photo_url: null },
  { id: 'c5', first_name: 'Ava', last_name: 'Davis', photo_url: null },
  { id: 'c6', first_name: 'Ethan', last_name: 'Martinez', photo_url: null },
  { id: 'c7', first_name: 'Sophia', last_name: 'Garcia', photo_url: null },
  { id: 'c8', first_name: 'Mason', last_name: 'Wilson', photo_url: null },
  { id: 'c9', first_name: 'Isabella', last_name: 'Taylor', photo_url: null },
  { id: 'c10', first_name: 'Lucas', last_name: 'Anderson', photo_url: null },
  { id: 'c11', first_name: 'Mia', last_name: 'Thomas', photo_url: null },
  { id: 'c12', first_name: 'James', last_name: 'Jackson', photo_url: null },
]

// --- Component ---

export function AttendancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('Take Attendance')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">Track and manage camper attendance across activities</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Take Attendance' && <TakeAttendanceTab />}
      {activeTab === 'Reports' && <ReportsTab />}
      {activeTab === 'History' && <HistoryTab />}
    </div>
  )
}

// --- Take Attendance Tab ---

function TakeAttendanceTab() {
  const { toast } = useToast()
  const { data: activities } = useActivities({ is_active: true })
  const bulkMutation = useBulkAttendance()

  const [selectedActivity, setSelectedActivity] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [search, setSearch] = useState('')
  const [camperRows, setCamperRows] = useState<CamperRow[]>(() =>
    MOCK_CAMPERS.map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      photo: c.photo_url,
      status: 'present' as AttendanceStatus,
      notes: '',
    }))
  )

  const filteredRows = useMemo(() => {
    if (!search.trim()) return camperRows
    const q = search.toLowerCase()
    return camperRows.filter((r) => r.name.toLowerCase().includes(q))
  }, [camperRows, search])

  const stats = useMemo(() => {
    const total = camperRows.length
    const present = camperRows.filter((r) => r.status === 'present').length
    const absent = camperRows.filter((r) => r.status === 'absent').length
    const late = camperRows.filter((r) => r.status === 'late').length
    const excused = camperRows.filter((r) => r.status === 'excused').length
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    return { total, present, absent, late, excused, rate }
  }, [camperRows])

  const updateStatus = (id: string, status: AttendanceStatus) => {
    setCamperRows((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  const markAll = (status: AttendanceStatus) => {
    setCamperRows((rows) => rows.map((r) => ({ ...r, status })))
  }

  const selectedActivityObj = activities?.find((a) => a.id === selectedActivity)

  const handleSave = () => {
    if (!selectedActivity) {
      toast({ type: 'error', message: 'Please select an activity first' })
      return
    }

    const payload = {
      activity_id: selectedActivity,
      activity_name: selectedActivityObj?.name || 'Unknown',
      date: selectedDate,
      period: null,
      records: camperRows.map((r) => ({
        camper_id: r.id,
        camper_name: r.name,
        activity_id: selectedActivity,
        activity_name: selectedActivityObj?.name || 'Unknown',
        date: selectedDate,
        status: r.status,
        notes: r.notes || null,
      })),
    }

    bulkMutation.mutate(payload, {
      onSuccess: () => toast({ type: 'success', message: `Attendance saved for ${camperRows.length} campers` }),
      onError: () => toast({ type: 'error', message: 'Failed to save attendance' }),
    })
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Activity</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
              >
                <option value="">Select activity...</option>
                {activities?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search Campers</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">{stats.total} campers</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-700">{stats.present} present</span>
          </div>
          <div className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{stats.absent} absent</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-700">{stats.late} late</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-700">{stats.excused} excused</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2.5 w-32 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${stats.rate}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-emerald-700">{stats.rate}%</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Mark all:</span>
        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
          const cfg = STATUS_CONFIG[status]
          return (
            <button
              key={status}
              onClick={() => markAll(status)}
              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Camper List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Camper
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                        {row.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                        const cfg = STATUS_CONFIG[status]
                        const active = row.status === status
                        const Icon = cfg.icon
                        return (
                          <button
                            key={status}
                            onClick={() => updateStatus(row.id, status)}
                            title={cfg.label}
                            className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
                              active
                                ? `${cfg.bg} ${cfg.color} border`
                                : 'border-transparent bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">{cfg.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <input
                      type="text"
                      placeholder="Add note..."
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-xs text-slate-600 transition-colors focus:border-slate-300 focus:bg-white focus:outline-none"
                      value={row.notes}
                      onChange={(e) =>
                        setCamperRows((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, notes: e.target.value } : r))
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={bulkMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
        >
          {bulkMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Attendance
        </button>
      </div>
    </div>
  )
}

// --- Reports Tab ---

function ReportsTab() {
  const { data: activities } = useActivities({ is_active: true })
  const [activityFilter, setActivityFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filters = useMemo(() => {
    const f: Record<string, string> = {}
    if (activityFilter) f.activity_id = activityFilter
    if (startDate) f.start_date = startDate
    if (endDate) f.end_date = endDate
    return f
  }, [activityFilter, startDate, endDate])

  const { data: stats, isLoading } = useAttendanceStats(filters)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-slate-600">Activity</label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
            >
              <option value="">All Activities</option>
              {activities?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Start Date</label>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">End Date</label>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Attendance Rate */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <BarChart className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Attendance Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.attendance_rate ?? 0}%</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${stats?.attendance_rate ?? 0}%` }}
                />
              </div>
            </div>

            {/* Total Sessions */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Sessions</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.total_sessions ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Perfect Attendance */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Perfect Attendance</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.perfect_attendance_count ?? 0}</p>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">Campers with zero absences</p>
            </div>
          </div>

          {/* Frequent Absences */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-slate-800">Frequent Absences</h3>
            </div>
            {stats?.frequent_absences && stats.frequent_absences.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {stats.frequent_absences.map((fa) => (
                  <li key={fa.camper_id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                        {fa.camper_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{fa.camper_name}</span>
                    </div>
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      {fa.absence_count} absences
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                No frequent absences found. Take attendance to start tracking.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// --- History Tab ---

function HistoryTab() {
  const [selectedCamper, setSelectedCamper] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filters = useMemo(() => {
    const f: Record<string, string> = {}
    if (startDate) f.start_date = startDate
    if (endDate) f.end_date = endDate
    return f
  }, [startDate, endDate])

  const { data: history, isLoading } = useCamperAttendanceHistory(
    selectedCamper || undefined,
    filters,
  )

  // Generate a calendar heatmap for the last 30 days
  const heatmapDays = useMemo(() => {
    const days: { date: string; status: AttendanceStatus | null; dayLabel: string }[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const record = history?.find((h) => h.date === iso)
      days.push({
        date: iso,
        status: record ? (record.status as AttendanceStatus) : null,
        dayLabel: d.getDate().toString(),
      })
    }
    return days
  }, [history])

  const heatmapColor = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-400'
      case 'absent':
        return 'bg-red-400'
      case 'late':
        return 'bg-amber-400'
      case 'excused':
        return 'bg-blue-400'
      default:
        return 'bg-slate-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Camper Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Select Camper</label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={selectedCamper}
              onChange={(e) => setSelectedCamper(e.target.value)}
            >
              <option value="">Choose a camper...</option>
              {MOCK_CAMPERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Start Date</label>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">End Date</label>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!selectedCamper ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <ClipboardCheck className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">Select a camper to view their attendance history</p>
        </div>
      ) : (
        <>
          {/* Calendar Heatmap */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Last 30 Days</h3>
            <div className="flex flex-wrap gap-1.5">
              {heatmapDays.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.status || 'No record'}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-[10px] font-medium transition-transform hover:scale-110 ${heatmapColor(day.status)} ${
                    day.status ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {day.dayLabel}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-emerald-400" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-red-400" /> Absent
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-amber-400" /> Late
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-blue-400" /> Excused
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-slate-100" /> No record
              </span>
            </div>
          </div>

          {/* History Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-800">Attendance Records</h3>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Date
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Activity
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="hidden px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((record) => {
                      const cfg = STATUS_CONFIG[record.status as AttendanceStatus] || STATUS_CONFIG.present
                      return (
                        <tr key={record.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-2.5 text-sm text-slate-700">{record.date}</td>
                          <td className="px-5 py-2.5 text-sm text-slate-700">{record.activity_name}</td>
                          <td className="px-5 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="hidden px-5 py-2.5 text-xs text-slate-500 sm:table-cell">
                            {record.notes || '\u2014'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-400">
                No attendance records found for this camper.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
