/**
 * Camp Connect - Check-In / Check-Out Page
 * Daily camper check-in and check-out management with stats, search,
 * filter, guardian info capture modal, and quick actions.
 */

import { useState, useMemo } from 'react'
import {
  LogIn,
  LogOut,
  Search,
  Users,
  UserCheck,
  Clock,
  Shield,
  Bus,
  Car,
  X,
  Loader2,
  Filter,
  ChevronDown,
  ClipboardList,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import {
  useCheckInToday,
  useCreateCheckIn,
} from '@/hooks/useCheckIn'
import type {
  TodayStatus,
  CheckInCreatePayload,
  CheckInStats,
} from '@/hooks/useCheckIn'
import { useToast } from '@/components/ui/Toast'

type StatusFilter = 'all' | 'checked_in' | 'checked_out' | 'pending'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Campers' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'pending', label: 'Pending' },
]

const METHOD_OPTIONS = [
  { value: 'in_person' as const, label: 'In Person', icon: UserCheck },
  { value: 'carpool' as const, label: 'Carpool', icon: Car },
  { value: 'bus' as const, label: 'Bus', icon: Bus },
]

const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Guardian',
  'Grandparent',
  'Sibling (18+)',
  'Authorized Pickup',
  'Other',
]

function statusBadge(status: string) {
  switch (status) {
    case 'checked_in':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    case 'checked_out':
      return 'bg-slate-100 text-slate-600 border border-slate-200'
    case 'pending':
      return 'bg-amber-100 text-amber-700 border border-amber-200'
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'checked_in':
      return 'Checked In'
    case 'checked_out':
      return 'Checked Out'
    case 'pending':
      return 'Pending'
    default:
      return status
  }
}

function methodIcon(method: string) {
  switch (method) {
    case 'bus':
      return Bus
    case 'carpool':
      return Car
    default:
      return UserCheck
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

function StatsCards({ stats }: { stats: CheckInStats }) {
  const cards = [
    { label: 'Total Campers', value: stats.total_today, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    { label: 'Checked In', value: stats.checked_in, icon: LogIn, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Checked Out', value: stats.checked_out, icon: LogOut, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { label: 'Attendance Rate', value: `${stats.attendance_rate}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border p-4 ${c.bg} flex flex-col gap-1`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <span className={`text-2xl font-bold ${c.color}`}>{c.value}</span>
        </div>
      ))}
    </div>
  )
}

interface GuardianModalProps {
  camper: TodayStatus
  actionType: 'check_in' | 'check_out'
  onClose: () => void
  onSubmit: (payload: CheckInCreatePayload) => void
  isLoading: boolean
}

function GuardianModal({ camper, actionType, onClose, onSubmit, isLoading }: GuardianModalProps) {
  const [guardianName, setGuardianName] = useState('')
  const [relationship, setRelationship] = useState('Parent')
  const [idVerified, setIdVerified] = useState(false)
  const [method, setMethod] = useState<'in_person' | 'carpool' | 'bus'>('in_person')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    onSubmit({
      camper_id: camper.camper_id,
      camper_name: camper.camper_name,
      type: actionType,
      guardian_name: guardianName || undefined,
      guardian_relationship: relationship,
      guardian_id_verified: idVerified,
      method,
      notes: notes || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            {actionType === 'check_in' ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <LogIn className="h-5 w-5 text-emerald-600" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                <LogOut className="h-5 w-5 text-slate-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {actionType === 'check_in' ? 'Check In' : 'Check Out'}
              </h3>
              <p className="text-sm text-slate-500">{camper.camper_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Guardian / Pickup Name</label>
            <input type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Enter guardian name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Relationship</label>
            <select value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              {RELATIONSHIP_OPTIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
            <input type="checkbox" checked={idVerified} onChange={(e) => setIdVerified(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Photo ID Verified</span>
            </div>
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Method</label>
            <div className="flex gap-2">
              {METHOD_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setMethod(opt.value)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${method === opt.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${actionType === 'check_in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-600 hover:bg-slate-700'}`}>
            {isLoading ? (<Loader2 className="h-4 w-4 animate-spin" />) : actionType === 'check_in' ? (<LogIn className="h-4 w-4" />) : (<LogOut className="h-4 w-4" />)}
            {actionType === 'check_in' ? 'Check In' : 'Check Out'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface CamperRowProps {
  camper: TodayStatus
  onCheckIn: (camper: TodayStatus) => void
  onCheckOut: (camper: TodayStatus) => void
  onQuickCheckIn: (camper: TodayStatus) => void
}

function CamperRow({ camper, onCheckIn, onCheckOut, onQuickCheckIn }: CamperRowProps) {
  const MethodIcon = camper.last_action ? methodIcon(camper.last_action.method) : null

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
        {camper.camper_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{camper.camper_name}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {camper.last_action ? (
            <>
              {MethodIcon && <MethodIcon className="h-3 w-3" />}
              <span className="capitalize">{camper.last_action.method.replace('_', ' ')}</span>
              <span className="text-slate-300">|</span>
              <span>{formatTime(camper.last_action.created_at)}</span>
              {camper.last_action.guardian_name && (
                <>
                  <span className="text-slate-300">|</span>
                  <span>{camper.last_action.guardian_name}</span>
                </>
              )}
              {camper.last_action.guardian_id_verified && (<Shield className="h-3 w-3 text-emerald-500" />)}
            </>
          ) : (
            <span className="italic text-slate-400">No activity today</span>
          )}
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(camper.status)}`}>
        {statusLabel(camper.status)}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {camper.status === 'pending' && (
          <>
            <button onClick={() => onQuickCheckIn(camper)} title="Quick check in" className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
              <LogIn className="h-3.5 w-3.5" />Quick In
            </button>
            <button onClick={() => onCheckIn(camper)} title="Check in with details" className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
              Details
            </button>
          </>
        )}
        {camper.status === 'checked_in' && (
          <button onClick={() => onCheckOut(camper)} title="Check out" className="flex items-center gap-1.5 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors">
            <LogOut className="h-3.5 w-3.5" />Check Out
          </button>
        )}
        {camper.status === 'checked_out' && (
          <button onClick={() => onCheckIn(camper)} title="Re-check in" className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <LogIn className="h-3.5 w-3.5" />Re-Check In
          </button>
        )}
      </div>
    </div>
  )
}

export function CheckInOutPage() {
  const { toast } = useToast()
  const { data, isLoading, error } = useCheckInToday()
  const createCheckIn = useCreateCheckIn()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalState, setModalState] = useState<{ camper: TodayStatus; actionType: 'check_in' | 'check_out' } | null>(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const filteredCampers = useMemo(() => {
    if (!data?.campers) return []
    let list = data.campers
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.camper_name.toLowerCase().includes(q))
    }
    return list
  }, [data?.campers, statusFilter, search])

  const handleQuickCheckIn = (camper: TodayStatus) => {
    createCheckIn.mutate(
      { camper_id: camper.camper_id, camper_name: camper.camper_name, type: 'check_in', method: 'in_person' },
      {
        onSuccess: () => { toast({ type: 'success', message: `${camper.camper_name} checked in` }) },
        onError: () => { toast({ type: 'error', message: `Failed to check in ${camper.camper_name}` }) },
      }
    )
  }

  const handleOpenModal = (camper: TodayStatus, actionType: 'check_in' | 'check_out') => {
    setModalState({ camper, actionType })
  }

  const handleModalSubmit = (payload: CheckInCreatePayload) => {
    createCheckIn.mutate(payload, {
      onSuccess: () => {
        const label = payload.type === 'check_in' ? 'checked in' : 'checked out'
        toast({ type: 'success', message: `${payload.camper_name} ${label}` })
        setModalState(null)
      },
      onError: () => {
        toast({ type: 'error', message: `Failed to process ${payload.camper_name}` })
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-500">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm">Failed to load check-in data</p>
      </div>
    )
  }

  const stats = data?.stats ?? { total_today: 0, checked_in: 0, checked_out: 0, pending: 0, attendance_rate: 0 }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-emerald-600" />
            Check-In / Check-Out
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manage daily camper arrivals and departures</p>
        </div>
        <div className="text-sm text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campers..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            {STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>
          {showFilterDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {STATUS_FILTERS.map((f) => (
                  <button key={f.value} onClick={() => { setStatusFilter(f.value); setShowFilterDropdown(false) }} className={`w-full px-4 py-2 text-left text-sm transition-colors ${statusFilter === f.value ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {filteredCampers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-16 text-slate-400">
            <Users className="h-8 w-8" />
            <p className="text-sm">{search ? 'No campers match your search' : 'No campers in this filter'}</p>
          </div>
        ) : (
          filteredCampers.map((camper) => (
            <CamperRow key={camper.camper_id} camper={camper} onCheckIn={(c) => handleOpenModal(c, 'check_in')} onCheckOut={(c) => handleOpenModal(c, 'check_out')} onQuickCheckIn={handleQuickCheckIn} />
          ))
        )}
      </div>

      {filteredCampers.length > 0 && (
        <p className="text-center text-xs text-slate-400">Showing {filteredCampers.length} of {data?.campers.length ?? 0} campers</p>
      )}

      {modalState && (
        <GuardianModal camper={modalState.camper} actionType={modalState.actionType} onClose={() => setModalState(null)} onSubmit={handleModalSubmit} isLoading={createCheckIn.isPending} />
      )}
    </div>
  )
}
