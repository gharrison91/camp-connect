import { useState, useMemo } from 'react'
import {
  Wrench,
  Zap,
  Building2,
  Wind,
  TreePine,
  Armchair,
  HelpCircle,
  Plus,
  Search,
  Loader2,
  X,
  MapPin,
  User,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useMaintenanceRequests,
  useMaintenanceStats,
  useCreateMaintenanceRequest,
  useUpdateMaintenanceRequest,
  useCompleteMaintenanceRequest,
} from '@/hooks/useMaintenance'
import type { MaintenanceRequest } from '@/types'

// ─── Constants ───────────────────────────────────────────────

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing', icon: Wrench, color: 'text-blue-500' },
  { value: 'electrical', label: 'Electrical', icon: Zap, color: 'text-yellow-500' },
  { value: 'structural', label: 'Structural', icon: Building2, color: 'text-stone-500' },
  { value: 'hvac', label: 'HVAC', icon: Wind, color: 'text-cyan-500' },
  { value: 'grounds', label: 'Grounds', icon: TreePine, color: 'text-green-500' },
  { value: 'furniture', label: 'Furniture', icon: Armchair, color: 'text-purple-500' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-slate-500' },
] as const

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-700' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
] as const

const STATUS_COLUMNS = [
  { key: 'open', label: 'Open', headerColor: 'border-slate-400' },
  { key: 'assigned', label: 'Assigned', headerColor: 'border-blue-400' },
  { key: 'in_progress', label: 'In Progress', headerColor: 'border-amber-400' },
  { key: 'completed', label: 'Completed', headerColor: 'border-emerald-400' },
] as const

function getCategoryInfo(cat: string) {
  return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[6]
}

function getPriorityInfo(pri: string) {
  return PRIORITIES.find((p) => p.value === pri) || PRIORITIES[1]
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Card Component ──────────────────────────────────────────

function RequestCard({
  request,
  onStatusChange,
}: {
  request: MaintenanceRequest
  onStatusChange: (id: string, status: string) => void
}) {
  const catInfo = getCategoryInfo(request.category)
  const priInfo = getPriorityInfo(request.priority)
  const CatIcon = catInfo.icon

  const nextStatus: Record<string, string | null> = {
    open: 'assigned',
    assigned: 'in_progress',
    in_progress: 'completed',
    completed: null,
  }

  const next = nextStatus[request.status]

  return (
    <div className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <CatIcon className={cn('h-4 w-4 shrink-0', catInfo.color)} />
          <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{request.title}</h4>
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', priInfo.color)}>
          {priInfo.label}
        </span>
      </div>

      {request.description && (
        <p className="mb-3 text-xs text-slate-500 line-clamp-2">{request.description}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
        {request.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {request.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {request.reported_by_name}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo(request.created_at)}
        </span>
      </div>

      {request.assigned_to_name && (
        <div className="mb-3 flex items-center gap-1 text-[11px] text-blue-600">
          <User className="h-3 w-3" />
          <span>Assigned to {request.assigned_to_name}</span>
        </div>
      )}

      {request.estimated_cost != null && request.estimated_cost > 0 && (
        <div className="mb-3 flex items-center gap-1 text-[11px] text-slate-500">
          <DollarSign className="h-3 w-3" />
          <span>Est. ${request.estimated_cost.toLocaleString()}</span>
          {request.actual_cost != null && request.actual_cost > 0 && (
            <span className="text-emerald-600"> / Actual ${request.actual_cost.toLocaleString()}</span>
          )}
        </div>
      )}

      {next && (
        <button
          onClick={() => onStatusChange(request.id, next)}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          Move to {STATUS_COLUMNS.find((c) => c.key === next)?.label}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// ─── Create Modal ────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const createMutation = useCreateMaintenanceRequest()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    location: '',
    estimated_cost: '',
    scheduled_date: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast({ type: 'error', message: 'Title is required' })
      return
    }
    createMutation.mutate(
      {
        ...form,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : undefined,
        scheduled_date: form.scheduled_date || undefined,
      },
      {
        onSuccess: () => {
          toast({ type: 'success', message: 'Maintenance request created' })
          onClose()
        },
        onError: () => {
          toast({ type: 'error', message: 'Failed to create request' })
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">New Maintenance Request</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Leaking faucet in Cabin 3"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Detailed description of the issue..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Cabin 3, Main Lodge, Pool Area"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Estimated Cost</label>
                <input
                  type="number"
                  value={form.estimated_cost}
                  onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Scheduled Date</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export function MaintenancePage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: requests = [], isLoading } = useMaintenanceRequests({
    search: search || undefined,
    category: categoryFilter || undefined,
    priority: priorityFilter || undefined,
  })
  const { data: stats } = useMaintenanceStats()
  const updateMutation = useUpdateMaintenanceRequest()
  const completeMutation = useCompleteMaintenanceRequest()

  const columns = useMemo(() => {
    const grouped: Record<string, MaintenanceRequest[]> = {
      open: [],
      assigned: [],
      in_progress: [],
      completed: [],
    }
    for (const req of requests) {
      if (req.status in grouped) {
        grouped[req.status].push(req)
      }
    }
    return grouped
  }, [requests])

  const handleStatusChange = (id: string, newStatus: string) => {
    if (newStatus === 'completed') {
      completeMutation.mutate(
        { id },
        {
          onSuccess: () => toast({ type: 'success', message: 'Request marked as completed' }),
          onError: () => toast({ type: 'error', message: 'Failed to update status' }),
        }
      )
    } else {
      updateMutation.mutate(
        { id, data: { status: newStatus } },
        {
          onSuccess: () => toast({ type: 'success', message: `Status updated to ${newStatus.replace('_', ' ')}` }),
          onError: () => toast({ type: 'error', message: 'Failed to update status' }),
        }
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Facility Maintenance</h1>
            <p className="mt-1 text-sm text-slate-500">Track and manage maintenance requests across your facilities</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-2xl font-bold text-slate-900">{stats.open_count}</div>
              <div className="text-xs font-medium text-slate-500">Open Requests</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold text-red-700">{stats.urgent_count}</span>
              </div>
              <div className="text-xs font-medium text-red-600">Urgent</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-700">{stats.completed_this_week}</span>
              </div>
              <div className="text-xs font-medium text-emerald-600">Completed This Week</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-2xl font-bold text-slate-900">
                  {stats.avg_completion_hours != null ? `${stats.avg_completion_hours}h` : '--'}
                </span>
              </div>
              <div className="text-xs font-medium text-slate-500">Avg Completion Time</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="overflow-x-auto px-6 py-6">
          <div className="grid min-w-[900px] grid-cols-4 gap-4">
            {STATUS_COLUMNS.map((col) => (
              <div key={col.key} className="flex flex-col">
                <div className={cn('mb-3 flex items-center justify-between border-b-2 pb-2', col.headerColor)}>
                  <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {columns[col.key]?.length || 0}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {(columns[col.key] || []).map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                  {(columns[col.key] || []).length === 0 && (
                    <div className="rounded-lg border-2 border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                      No {col.label.toLowerCase()} requests
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
