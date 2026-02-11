/**
 * Camp Connect - Visitor Management & Check-In/Out Page
 * Tabs: Check-In | Current Visitors | Visitor Log | Pre-Register
 */

import { useState, useMemo } from 'react'
import {
  UserPlus,
  LogIn,
  LogOut,
  Shield,
  Clock,
  Car,
  X,
  Search,
  Users,
  Loader2,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react'
import {
  useCurrentVisitors,
  useVisitorLog,
  useVisitorStats,
  useCreateVisitor,
  usePreRegisterVisitor,
  useCheckInVisitor,
  useCheckOutVisitor,
} from '@/hooks/useVisitors'
import { useToast } from '@/components/ui/Toast'
import type { Visitor } from '@/types'

const TABS = ['Check-In', 'Current Visitors', 'Visitor Log', 'Pre-Register'] as const
type Tab = (typeof TABS)[number]

const VISITOR_TYPES = ['parent', 'vendor', 'inspector', 'guest', 'contractor'] as const

function typeBadge(t: string) {
  switch (t) {
    case 'parent': return 'bg-blue-100 text-blue-700'
    case 'vendor': return 'bg-purple-100 text-purple-700'
    case 'inspector': return 'bg-amber-100 text-amber-700'
    case 'guest': return 'bg-green-100 text-green-700'
    case 'contractor': return 'bg-slate-100 text-slate-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

function statusBadge(s: string) {
  switch (s) {
    case 'pre_registered': return 'bg-blue-100 text-blue-700'
    case 'checked_in': return 'bg-green-100 text-green-700'
    case 'checked_out': return 'bg-slate-100 text-slate-600'
    case 'denied': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-600'
  }
}

function formatTime(iso: string | null) {
  if (!iso) return '--'
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--'
  }
}

function timeElapsed(checkInTime: string | null) {
  if (!checkInTime) return '--'
  try {
    const mins = Math.floor((Date.now() - new Date(checkInTime).getTime()) / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    const rem = mins % 60
    return `${hrs}h ${rem}m`
  } catch {
    return '--'
  }
}

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  company: '',
  visitor_type: 'guest' as Visitor['visitor_type'],
  purpose: '',
  visiting_camper_name: '',
  host_staff_name: '',
  badge_number: '',
  vehicle_info: '',
  id_verified: false,
  notes: '',
}

// ─── Check-In Tab ─────────────────────────────────────────────

function CheckInTab() {
  const { toast } = useToast()
  const createVisitor = useCreateVisitor()
  const [form, setForm] = useState({ ...emptyForm })

  const set = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }))

  const submit = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ message: 'First and last name are required', type: 'error' })
      return
    }
    createVisitor.mutate(
      { ...form, status: 'checked_in' } as Partial<Visitor>,
      {
        onSuccess: () => {
          toast({ message: `${form.first_name} ${form.last_name} checked in`, type: 'success' })
          setForm({ ...emptyForm })
        },
        onError: () => toast({ message: 'Failed to check in visitor', type: 'error' }),
      },
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <LogIn className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Visitor Check-In</h2>
            <p className="text-sm text-slate-500">Register and check in a new visitor</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">First Name *</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="First name" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Last Name *</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Last name" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Visitor Type</label>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" value={form.visitor_type} onChange={(e) => set('visitor_type', e.target.value)}>
                {VISITOR_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Company</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Company / Organization" value={form.company} onChange={(e) => set('company', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Purpose of Visit</label>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Reason for visiting" value={form.purpose} onChange={(e) => set('purpose', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Visiting Camper</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Camper name (if applicable)" value={form.visiting_camper_name} onChange={(e) => set('visiting_camper_name', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Host Staff</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Staff member hosting" value={form.host_staff_name} onChange={(e) => set('host_staff_name', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Badge Number</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="V-001" value={form.badge_number} onChange={(e) => set('badge_number', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Vehicle Info</label>
              <div className="relative">
                <Car className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="License plate / description" value={form.vehicle_info} onChange={(e) => set('vehicle_info', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
            <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" rows={2} placeholder="Additional notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" checked={form.id_verified} onChange={(e) => set('id_verified', e.target.checked)} />
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700">ID Verified</span>
          </label>

          <button
            onClick={submit}
            disabled={createVisitor.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {createVisitor.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Check In Visitor
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Current Visitors Tab ─────────────────────────────────────

function CurrentVisitorsTab() {
  const { toast } = useToast()
  const { data: visitors = [], isLoading } = useCurrentVisitors()
  const { data: stats } = useVisitorStats()
  const checkOut = useCheckOutVisitor()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return visitors
    const q = search.toLowerCase()
    return visitors.filter(
      (v) =>
        v.first_name.toLowerCase().includes(q) ||
        v.last_name.toLowerCase().includes(q) ||
        v.company.toLowerCase().includes(q) ||
        v.visitor_type.toLowerCase().includes(q),
    )
  }, [visitors, search])

  const handleCheckOut = (id: string, name: string) => {
    checkOut.mutate(id, {
      onSuccess: () => toast({ message: `${name} checked out`, type: 'success' }),
      onError: () => toast({ message: 'Failed to check out visitor', type: 'error' }),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Stats Row */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">On Campus Now</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.checked_in_today}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Today</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total_today}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Most Common Type</p>
            <p className="mt-1 text-lg font-semibold capitalize text-slate-800">{stats.most_common_type}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Avg Visit Duration</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{stats.avg_visit_duration > 0 ? `${stats.avg_visit_duration}m` : '--'}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Search current visitors..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No visitors currently on campus</p>
          <p className="mt-1 text-xs text-slate-400">Check in a visitor to see them here</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-800">
                    {v.first_name} {v.last_name}
                  </h3>
                  {v.company && <p className="truncate text-xs text-slate-500">{v.company}</p>}
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeBadge(v.visitor_type)}`}>
                  {v.visitor_type}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                {v.purpose && (
                  <p className="truncate"><span className="font-medium text-slate-600">Purpose:</span> {v.purpose}</p>
                )}
                {v.host_staff_name && (
                  <p className="truncate"><span className="font-medium text-slate-600">Host:</span> {v.host_staff_name}</p>
                )}
                {v.visiting_camper_name && (
                  <p className="truncate"><span className="font-medium text-slate-600">Visiting:</span> {v.visiting_camper_name}</p>
                )}
                {v.badge_number && (
                  <p><span className="font-medium text-slate-600">Badge:</span> {v.badge_number}</p>
                )}
                {v.vehicle_info && (
                  <p className="flex items-center gap-1"><Car className="h-3 w-3" /> {v.vehicle_info}</p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-medium text-emerald-600">{timeElapsed(v.check_in_time)}</span>
                  <span className="text-slate-400">on campus</span>
                </div>
                <div className="flex items-center gap-2">
                  {v.id_verified && (
                    <span title="ID Verified"><Shield className="h-4 w-4 text-emerald-500" /></span>
                  )}
                  <button
                    onClick={() => handleCheckOut(v.id, `${v.first_name} ${v.last_name}`)}
                    disabled={checkOut.isPending}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Check Out
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Visitor Log Tab ──────────────────────────────────────────

function VisitorLogTab() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')

  const { data: visitors = [], isLoading } = useVisitorLog({
    visitor_type: typeFilter || undefined,
    status: statusFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return visitors
    const q = search.toLowerCase()
    return visitors.filter(
      (v) =>
        v.first_name.toLowerCase().includes(q) ||
        v.last_name.toLowerCase().includes(q) ||
        v.company.toLowerCase().includes(q),
    )
  }, [visitors, search])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Search visitors..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {VISITOR_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pre_registered">Pre-Registered</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="denied">Denied</option>
        </select>
        <input type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span className="text-sm text-slate-400">to</span>
        <input type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <Filter className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No visitor records found</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 font-medium text-slate-600">Visitor</th>
                <th className="px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 font-medium text-slate-600">Purpose</th>
                <th className="px-4 py-3 font-medium text-slate-600">Check In</th>
                <th className="px-4 py-3 font-medium text-slate-600">Check Out</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 transition hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{v.first_name} {v.last_name}</p>
                      {v.company && <p className="text-xs text-slate-500">{v.company}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeBadge(v.visitor_type)}`}>
                      {v.visitor_type}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{v.purpose || '--'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatTime(v.check_in_time)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatTime(v.check_out_time)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(v.status)}`}>
                      {v.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {v.id_verified ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-300" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Pre-Register Tab ─────────────────────────────────────────

function PreRegisterTab() {
  const { toast } = useToast()
  const preRegister = usePreRegisterVisitor()
  const checkIn = useCheckInVisitor()
  const { data: preRegistered = [] } = useVisitorLog({ status: 'pre_registered' })
  const [form, setForm] = useState({ ...emptyForm })
  const [showForm, setShowForm] = useState(false)

  const set = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }))

  const submit = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ message: 'First and last name are required', type: 'error' })
      return
    }
    preRegister.mutate(form as Partial<Visitor>, {
      onSuccess: () => {
        toast({ message: `${form.first_name} ${form.last_name} pre-registered`, type: 'success' })
        setForm({ ...emptyForm })
        setShowForm(false)
      },
      onError: () => toast({ message: 'Failed to pre-register visitor', type: 'error' }),
    })
  }

  const handleQuickCheckIn = (v: Visitor) => {
    checkIn.mutate(v.id, {
      onSuccess: () => toast({ message: `${v.first_name} ${v.last_name} checked in`, type: 'success' }),
      onError: () => toast({ message: 'Failed to check in visitor', type: 'error' }),
    })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Expected Visitors</h2>
          <p className="text-sm text-slate-500">Pre-registered visitors awaiting arrival</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Pre-Register'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">First Name *</label>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="First name" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Last Name *</label>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Last name" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Visitor Type</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" value={form.visitor_type} onChange={(e) => set('visitor_type', e.target.value)}>
                  {VISITOR_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Company</label>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Company" value={form.company} onChange={(e) => set('company', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Purpose</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Purpose of visit" value={form.purpose} onChange={(e) => set('purpose', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Visiting Camper</label>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Camper name" value={form.visiting_camper_name} onChange={(e) => set('visiting_camper_name', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Host Staff</label>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Staff host" value={form.host_staff_name} onChange={(e) => set('host_staff_name', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
              <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" rows={2} placeholder="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
            <button
              onClick={submit}
              disabled={preRegister.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {preRegister.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Pre-Register Visitor
            </button>
          </div>
        </div>
      )}

      {preRegistered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <UserPlus className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No pre-registered visitors</p>
          <p className="mt-1 text-xs text-slate-400">Pre-register expected visitors for quick check-in</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {preRegistered.map((v) => (
            <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-800">
                    {v.first_name} {v.last_name}
                  </h3>
                  {v.company && <p className="truncate text-xs text-slate-500">{v.company}</p>}
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeBadge(v.visitor_type)}`}>
                  {v.visitor_type}
                </span>
              </div>
              {v.purpose && (
                <p className="mt-2 truncate text-xs text-slate-500">{v.purpose}</p>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                  PRE-REGISTERED
                </span>
                <button
                  onClick={() => handleQuickCheckIn(v)}
                  disabled={checkIn.isPending}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Check In
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export function VisitorsPage() {
  const [tab, setTab] = useState<Tab>('Current Visitors')

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <UserPlus className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Visitor Management</h1>
            <p className="text-sm text-slate-500">Check in visitors, track who is on campus, and pre-register expected guests</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              tab === t
                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Check-In' && <CheckInTab />}
      {tab === 'Current Visitors' && <CurrentVisitorsTab />}
      {tab === 'Visitor Log' && <VisitorLogTab />}
      {tab === 'Pre-Register' && <PreRegisterTab />}
    </div>
  )
}
