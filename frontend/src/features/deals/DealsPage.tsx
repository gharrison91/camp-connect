import { useState } from 'react'
import {
  Target,
  Plus,
  Search,
  Calendar,
  X,
  Trash2,
  ArrowRight,
  User,
  Building2,
  AlertCircle,
} from 'lucide-react'
import { useDealPipeline, useCreateDeal, useUpdateDeal, useDeleteDeal, useMoveDealStage } from '@/hooks/useDeals'
import type { Deal, DealCreate, DealUpdate } from '@/types'

// ─── Constants ────────────────────────────────────────────────

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-slate-100 text-slate-700 border-slate-200', headerBg: 'bg-slate-50', accent: 'border-t-slate-400' },
  { key: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-700 border-blue-200', headerBg: 'bg-blue-50', accent: 'border-t-blue-400' },
  { key: 'proposal', label: 'Proposal', color: 'bg-amber-100 text-amber-700 border-amber-200', headerBg: 'bg-amber-50', accent: 'border-t-amber-400' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 text-purple-700 border-purple-200', headerBg: 'bg-purple-50', accent: 'border-t-purple-400' },
  { key: 'closed_won', label: 'Won', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', headerBg: 'bg-emerald-50', accent: 'border-t-emerald-400' },
  { key: 'closed_lost', label: 'Lost', color: 'bg-red-100 text-red-700 border-red-200', headerBg: 'bg-red-50', accent: 'border-t-red-400' },
] as const

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
]

const SOURCES = ['Website', 'Referral', 'Event', 'Walk-in', 'Email', 'Phone', 'Social Media', 'Other']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Deal Card ────────────────────────────────────────────────

function DealCard({
  deal,
  onEdit,
  onMove,
}: {
  deal: Deal
  onEdit: (deal: Deal) => void
  onMove: (dealId: string, stage: string) => void
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const priority = PRIORITIES.find((p) => p.value === deal.priority)
  return (
    <div
      className="group relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-slate-300 cursor-pointer"
      onClick={() => onEdit(deal)}
    >
      {/* Title & Value */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">{deal.title}</h4>
        <span className="shrink-0 text-sm font-bold text-emerald-600">{formatCurrency(deal.value)}</span>
      </div>

      {/* Contact / Family */}
      {(deal.contact_name || deal.family_name) && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
          {deal.contact_name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {deal.contact_name}
            </span>
          )}
          {deal.family_name && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {deal.family_name}
            </span>
          )}
        </div>
      )}

      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {priority && (
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${priority.color}`}>
            {priority.label}
          </span>
        )}
        {deal.source && (
          <span className="inline-flex items-center rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-100">
            {deal.source}
          </span>
        )}
        {deal.expected_close_date && (
          <span className="inline-flex items-center gap-0.5 rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 border border-slate-100">
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(deal.expected_close_date)}
          </span>
        )}
      </div>

      {/* Assigned to */}
      {deal.assigned_to_name && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700">
            {deal.assigned_to_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <span className="text-[11px] text-slate-500">{deal.assigned_to_name}</span>
        </div>
      )}

      {/* Move to dropdown */}
      <div className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu) }}
            className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowRight className="h-2.5 w-2.5" />
            Move
          </button>
          {showMoveMenu && (
            <div className="absolute right-0 bottom-full mb-1 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {STAGES.filter((s) => s.key !== deal.stage).map((s) => (
                <button
                  key={s.key}
                  onClick={(e) => { e.stopPropagation(); onMove(deal.id, s.key); setShowMoveMenu(false) }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <span className={`h-2 w-2 rounded-full ${s.accent.replace('border-t-', 'bg-')}`} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Pipeline Column ──────────────────────────────────────────

function PipelineColumn({
  stageConfig,
  deals,
  count,
  totalValue,
  onEditDeal,
  onMoveDeal,
}: {
  stageConfig: (typeof STAGES)[number]
  deals: Deal[]
  count: number
  totalValue: number
  onEditDeal: (deal: Deal) => void
  onMoveDeal: (dealId: string, stage: string) => void
}) {
  return (
    <div className={`flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50/50 border-t-4 ${stageConfig.accent}`}>
      {/* Column header */}
      <div className={`flex items-center justify-between gap-2 px-3 py-3 ${stageConfig.headerBg} rounded-t-lg`}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">{stageConfig.label}</h3>
          <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${stageConfig.color}`}>
            {count}
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500">{formatCurrency(totalValue)}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-2 rounded-full bg-slate-100 p-2">
              <Target className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400">No deals</p>
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onEdit={onEditDeal} onMove={onMoveDeal} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Deal Modal ───────────────────────────────────────────────

function DealModal({
  deal,
  onClose,
  onSave,
  onDelete,
}: {
  deal: Deal | null
  onClose: () => void
  onSave: (data: DealCreate | DealUpdate, id?: string) => void
  onDelete?: (id: string) => void
}) {
  const isEdit = !!deal
  const [form, setForm] = useState<DealCreate & { actual_close_date?: string }>({
    title: deal?.title || '',
    description: deal?.description || '',
    value: deal?.value || 0,
    stage: deal?.stage || 'lead',
    priority: deal?.priority || 'medium',
    source: deal?.source || '',
    expected_close_date: deal?.expected_close_date?.split('T')[0] || '',
    assigned_to: deal?.assigned_to || '',
    contact_id: deal?.contact_id || '',
    family_id: deal?.family_id || '',
    notes: deal?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(form)) {
      if (value === '') {
        if (key === 'title') cleaned[key] = value
        // skip empty strings (send undefined)
      } else {
        cleaned[key] = value
      }
    }
    // Convert expected_close_date to ISO
    if (cleaned.expected_close_date && typeof cleaned.expected_close_date === 'string') {
      cleaned.expected_close_date = new Date(cleaned.expected_close_date as string).toISOString()
    }

    if (isEdit && deal) {
      onSave(cleaned as unknown as DealUpdate, deal.id)
    } else {
      onSave(cleaned as unknown as DealCreate)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Edit Deal' : 'New Deal'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder="Deal title..."
                required
              />
            </div>

            {/* Value & Stage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Value ($)</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority & Source */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="">Select source...</option>
                  {SOURCES.map((s) => (
                    <option key={s} value={s.toLowerCase()}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expected Close Date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Expected Close Date</label>
              <input
                type="date"
                value={form.expected_close_date || ''}
                onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                rows={2}
                placeholder="Brief description..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                rows={2}
                placeholder="Internal notes..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              {isEdit && deal && onDelete && (
                <button
                  type="button"
                  onClick={() => { onDelete(deal.id); onClose() }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors shadow-sm"
              >
                {isEdit ? 'Save Changes' : 'Create Deal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export function DealsPage() {
  const { data: pipeline, isLoading, error } = useDealPipeline()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const deleteDeal = useDeleteDeal()
  const moveDealStage = useMoveDealStage()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleSave = (data: DealCreate | DealUpdate, id?: string) => {
    if (id) {
      updateDeal.mutate({ id, data: data as DealUpdate }, { onSuccess: () => setEditingDeal(null) })
    } else {
      createDeal.mutate(data as DealCreate, { onSuccess: () => setShowCreateModal(false) })
    }
  }

  const handleDelete = (id: string) => {
    deleteDeal.mutate(id)
  }

  const handleMove = (dealId: string, stage: string) => {
    moveDealStage.mutate({ id: dealId, stage, position: 0 })
  }

  // Filter deals by search
  const filterDeals = (deals: Deal[]) => {
    if (!searchQuery.trim()) return deals
    const q = searchQuery.toLowerCase()
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.contact_name?.toLowerCase().includes(q) ||
        d.family_name?.toLowerCase().includes(q)
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
          <p className="text-sm text-slate-600">Failed to load pipeline</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Target className="h-6 w-6 text-emerald-500" />
              Deal Pipeline
            </h1>
            {pipeline && (
              <p className="mt-1 text-sm text-slate-500">
                {pipeline.total_deals} deal{pipeline.total_deals !== 1 ? 's' : ''} &middot;{' '}
                <span className="font-semibold text-emerald-600">{formatCurrency(pipeline.total_value)}</span> total value
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder="Search deals..."
              />
            </div>

            {/* Add Deal */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Deal
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto p-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : pipeline ? (
          <div className="flex gap-3 pb-4" style={{ minWidth: 'fit-content' }}>
            {pipeline.stages.map((stageData) => {
              const stageConfig = STAGES.find((s) => s.key === stageData.stage)
              if (!stageConfig) return null
              const filteredDeals = filterDeals(stageData.deals)
              return (
                <PipelineColumn
                  key={stageData.stage}
                  stageConfig={stageConfig}
                  deals={filteredDeals}
                  count={filteredDeals.length}
                  totalValue={filteredDeals.reduce((sum, d) => sum + d.value, 0)}
                  onEditDeal={setEditingDeal}
                  onMoveDeal={handleMove}
                />
              )
            })}
          </div>
        ) : null}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <DealModal
          deal={null}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSave}
        />
      )}

      {editingDeal && (
        <DealModal
          deal={editingDeal}
          onClose={() => setEditingDeal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
