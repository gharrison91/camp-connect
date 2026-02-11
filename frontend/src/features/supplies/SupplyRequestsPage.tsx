import { useState } from 'react'
import {
  Package,
  Plus,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Timer,
  ClipboardList,
  X,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { usePermissions } from '@/hooks/usePermissions'
import {
  useSupplyRequests,
  useSupplyStats,
  useCreateSupplyRequest,
  useApproveSupplyRequest,
  useRejectSupplyRequest,
  useDeleteSupplyRequest,
} from '@/hooks/useSupplyRequests'
import type { SupplyRequestData, SupplyRequestCreate } from '@/hooks/useSupplyRequests'

// ---- Constants ----

const CATEGORIES = [
  { value: 'office', label: 'Office' },
  { value: 'craft', label: 'Craft' },
  { value: 'sports', label: 'Sports' },
  { value: 'medical', label: 'Medical' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
] as const

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'received', label: 'Received' },
  { value: 'rejected', label: 'Rejected' },
] as const

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  ordered: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  received: 'bg-green-50 text-green-700 ring-green-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
}

const categoryColors: Record<string, string> = {
  office: 'bg-indigo-50 text-indigo-700',
  craft: 'bg-purple-50 text-purple-700',
  sports: 'bg-blue-50 text-blue-700',
  medical: 'bg-red-50 text-red-700',
  kitchen: 'bg-orange-50 text-orange-700',
  maintenance: 'bg-slate-100 text-slate-700',
  other: 'bg-gray-50 text-gray-600',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---- Stats Cards ----

function StatsCards() {
  const { data: stats, isLoading } = useSupplyStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
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
      label: 'Total Requests',
      value: stats?.total_requests ?? 0,
      icon: ClipboardList,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
    },
    {
      label: 'Pending',
      value: stats?.pending_count ?? 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Approved',
      value: stats?.approved_count ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Cost',
      value: formatCurrency(stats?.total_cost ?? 0),
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      isText: true,
    },
    {
      label: 'Avg. Fulfillment',
      value: stats?.avg_fulfillment_days != null ? `${stats.avg_fulfillment_days}d` : '\u2014',
      icon: Timer,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      isText: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
              {card.isText ? card.value : Number(card.value).toLocaleString()}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ---- Create Modal ----

function CreateRequestModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const createMutation = useCreateSupplyRequest()
  const [form, setForm] = useState<SupplyRequestCreate>({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    quantity: 1,
    estimated_cost: null,
    needed_by: null,
    requested_by: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    createMutation.mutate(form, {
      onSuccess: () => {
        toast({ type: 'success', message: 'Supply request created successfully' })
        onClose()
      },
      onError: () => {
        toast({ type: 'error', message: 'Failed to create supply request' })
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">New Supply Request</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Colored markers for arts cabin"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Additional details about the request..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity + Cost row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estimated Cost ($)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.estimated_cost ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimated_cost: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Needed By + Requested By */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Needed By</label>
              <input
                type="date"
                value={form.needed_by || ''}
                onChange={(e) => setForm({ ...form, needed_by: e.target.value || null })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Requested By</label>
              <input
                type="text"
                value={form.requested_by || ''}
                onChange={(e) => setForm({ ...form, requested_by: e.target.value })}
                placeholder="Your name (auto-filled)"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !form.title.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
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

// ---- Confirm Modal ----

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmColor: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full bg-amber-100 p-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50',
              confirmColor,
            )}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Main Page ----

export function SupplyRequestsPage() {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission('core.campers.update')

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'delete'
    request: SupplyRequestData
  } | null>(null)

  // Queries
  const {
    data: requests = [],
    isLoading,
    error,
  } = useSupplyRequests({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    search: search || undefined,
  })

  // Mutations
  const approveMutation = useApproveSupplyRequest()
  const rejectMutation = useRejectSupplyRequest()
  const deleteMutation = useDeleteSupplyRequest()

  const handleConfirmAction = () => {
    if (!confirmAction) return
    const { type, request: req } = confirmAction

    if (type === 'approve') {
      approveMutation.mutate(
        { id: req.id },
        {
          onSuccess: () => {
            toast({ type: 'success', message: `"${req.title}" approved` })
            setConfirmAction(null)
          },
          onError: () => {
            toast({ type: 'error', message: 'Failed to approve request' })
          },
        },
      )
    } else if (type === 'reject') {
      rejectMutation.mutate(
        { id: req.id },
        {
          onSuccess: () => {
            toast({ type: 'success', message: `"${req.title}" rejected` })
            setConfirmAction(null)
          },
          onError: () => {
            toast({ type: 'error', message: 'Failed to reject request' })
          },
        },
      )
    } else if (type === 'delete') {
      deleteMutation.mutate(req.id, {
        onSuccess: () => {
          toast({ type: 'success', message: `"${req.title}" deleted` })
          setConfirmAction(null)
        },
        onError: () => {
          toast({ type: 'error', message: 'Failed to delete request' })
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Supply Requests
          </h1>
          {!isLoading && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {requests.length}
            </span>
          )}
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search supply requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load supply requests. Please try again.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-16">
          <Package className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No supply requests</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new request.</p>
          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Request
            </button>
          )}
        </div>
      )}

      {/* Requests Table */}
      {!isLoading && !error && requests.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Request
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Needed By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Requested By
                  </th>
                  {canEdit && (
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Title + description */}
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{req.title}</p>
                        {req.description && (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{req.description}</p>
                        )}
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                          categoryColors[req.category] || categoryColors.other,
                        )}
                      >
                        {req.category}
                      </span>
                    </td>
                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                          priorityColors[req.priority] || priorityColors.medium,
                        )}
                      >
                        {req.priority}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
                          statusColors[req.status] || statusColors.pending,
                        )}
                      >
                        {req.status}
                      </span>
                    </td>
                    {/* Quantity */}
                    <td className="px-4 py-3 text-sm text-gray-700">{req.quantity}</td>
                    {/* Cost */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {req.estimated_cost != null ? formatCurrency(req.estimated_cost) : '\u2014'}
                    </td>
                    {/* Needed by */}
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(req.needed_by)}</td>
                    {/* Requested by */}
                    <td className="px-4 py-3 text-sm text-gray-500">{req.requested_by || '\u2014'}</td>
                    {/* Actions */}
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setConfirmAction({ type: 'approve', request: req })}
                                title="Approve"
                                className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: 'reject', request: req })}
                                title="Reject"
                                className="rounded-md p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setConfirmAction({ type: 'delete', request: req })}
                            title="Delete"
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && <CreateRequestModal onClose={() => setShowCreateModal(false)} />}

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === 'approve'
              ? 'Approve Request'
              : confirmAction.type === 'reject'
                ? 'Reject Request'
                : 'Delete Request'
          }
          message={
            confirmAction.type === 'approve'
              ? `Are you sure you want to approve "${confirmAction.request.title}"?`
              : confirmAction.type === 'reject'
                ? `Are you sure you want to reject "${confirmAction.request.title}"?`
                : `Are you sure you want to delete "${confirmAction.request.title}"? This cannot be undone.`
          }
          confirmLabel={
            confirmAction.type === 'approve'
              ? 'Approve'
              : confirmAction.type === 'reject'
                ? 'Reject'
                : 'Delete'
          }
          confirmColor={
            confirmAction.type === 'approve'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-red-600 hover:bg-red-700'
          }
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          isPending={
            approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending
          }
        />
      )}
    </div>
  )
}
