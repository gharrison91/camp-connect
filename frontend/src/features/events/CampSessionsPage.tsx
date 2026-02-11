/**
 * Camp Connect – Camp Sessions Management
 */

import { useState } from 'react'
import {
  CalendarRange,
  Plus,
  Search,
  Users,
  BarChart3,
  Edit,
  Trash2,
  X,
  Clock,
  DollarSign,
  UserPlus,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useCampSessions,
  useCampSessionStats,
  useCreateCampSession,
  useUpdateCampSession,
  useDeleteCampSession,
} from '@/hooks/useCampSessions'
import type { CampSessionData } from '@/hooks/useCampSessions'

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  upcoming: { label: 'Upcoming', bg: 'bg-blue-50', text: 'text-blue-700' },
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  completed: { label: 'Completed', bg: 'bg-gray-50', text: 'text-gray-600' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700' },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function capacityColor(pct: number) {
  if (pct >= 95) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function CampSessionsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CampSessionData | null>(null)
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '', capacity: '50', price: '', age_min: '', age_max: '' })

  const { data: sessions = [], isLoading } = useCampSessions({
    status: statusFilter || undefined,
    search: search || undefined,
  })
  const { data: stats } = useCampSessionStats()
  const createSession = useCreateCampSession()
  const updateSession = useUpdateCampSession()
  const deleteSession = useDeleteCampSession()

  function openCreate() {
    setEditing(null)
    setForm({ name: '', description: '', start_date: '', end_date: '', capacity: '50', price: '', age_min: '', age_max: '' })
    setShowModal(true)
  }

  function openEdit(s: CampSessionData) {
    setEditing(s)
    setForm({
      name: s.name,
      description: s.description || '',
      start_date: s.start_date,
      end_date: s.end_date,
      capacity: String(s.capacity),
      price: s.price != null ? String(s.price) : '',
      age_min: s.age_min != null ? String(s.age_min) : '',
      age_max: s.age_max != null ? String(s.age_max) : '',
    })
    setShowModal(true)
  }

  function handleSave() {
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || null,
      start_date: form.start_date,
      end_date: form.end_date,
      capacity: parseInt(form.capacity) || 50,
      price: form.price ? parseFloat(form.price) : null,
      age_min: form.age_min ? parseInt(form.age_min) : null,
      age_max: form.age_max ? parseInt(form.age_max) : null,
    }
    if (editing) {
      updateSession.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => { toast({ type: 'success', message: 'Session updated' }); setShowModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to update session' }),
      })
    } else {
      createSession.mutate(payload, {
        onSuccess: () => { toast({ type: 'success', message: 'Session created' }); setShowModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to create session' }),
      })
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this session?')) return
    deleteSession.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Session deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete session' }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <CalendarRange className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Camp Sessions</h1>
            <p className="text-sm text-gray-500">Manage session periods and enrollment</p>
          </div>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Session
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            { label: 'Total Sessions', value: stats.total_sessions, icon: CalendarRange, color: 'text-gray-600', bg: 'bg-gray-100' },
            { label: 'Active Now', value: stats.active_sessions, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Total Enrolled', value: stats.total_enrolled, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Total Capacity', value: stats.total_capacity, icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-100' },
            { label: 'Occupancy', value: `${stats.occupancy_rate}%`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-100' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Session Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-gray-200 bg-white">
          <CalendarRange className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No sessions found</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first camp session to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const cfg = STATUS_CFG[s.status] || STATUS_CFG.upcoming
            const pct = s.capacity > 0 ? Math.round((s.enrolled_count / s.capacity) * 100) : 0
            return (
              <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                    {s.description && <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{s.description}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDate(s.start_date)} – {fmtDate(s.end_date)}</span>
                  {s.age_min != null && s.age_max != null && (
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Ages {s.age_min}–{s.age_max}</span>
                  )}
                  {s.price != null && (
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${s.price}</span>
                  )}
                </div>

                {/* Capacity bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Enrollment</span>
                    <span className="font-medium text-gray-700">{s.enrolled_count} / {s.capacity} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${capacityColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => openEdit(s)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Edit">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="ml-auto inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                    View Enrollments <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Session' : 'New Session'}</h3>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                  <input type="number" value={form.age_min} onChange={(e) => setForm({ ...form, age_min: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
                  <input type="number" value={form.age_max} onChange={(e) => setForm({ ...form, age_max: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.start_date || !form.end_date || createSession.isPending || updateSession.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {createSession.isPending || updateSession.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
