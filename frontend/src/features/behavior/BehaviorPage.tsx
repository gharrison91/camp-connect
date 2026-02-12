/**
 * Camp Connect - Behavior Tracking Page
 * Full behavior log management with stats, filters, timeline, and CRUD modals.
 */

import { useState, useMemo } from 'react'
import {
  MessageSquare,
  AlertTriangle,
  ThumbsUp,
  Clock,
  Plus,
  Search,
  X,
  Loader2,
  Edit2,
  Trash2,
  ChevronDown,
  Bell,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useBehaviorLogs,
  useBehaviorStats,
  useCreateBehaviorLog,
  useUpdateBehaviorLog,
  useDeleteBehaviorLog,
} from '@/hooks/useBehavior'
import type { BehaviorLog, BehaviorFilters } from '@/hooks/useBehavior'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'positive', label: 'Positive' },
  { value: 'concern', label: 'Concern' },
  { value: 'incident', label: 'Incident' },
  { value: 'follow_up', label: 'Follow-Up' },
]

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const CATEGORY_OPTIONS = [
  { value: 'social', label: 'Social' },
  { value: 'academic', label: 'Academic' },
  { value: 'safety', label: 'Safety' },
  { value: 'health', label: 'Health' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'other', label: 'Other' },
]

const TYPE_CONFIG: Record<string, { icon: typeof ThumbsUp; color: string; bg: string; label: string }> = {
  positive: { icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Positive' },
  concern: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Concern' },
  incident: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Incident' },
  follow_up: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Follow-Up' },
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  low: { color: 'text-slate-600', bg: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  high: { color: 'text-orange-600', bg: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  critical: { color: 'text-red-600', bg: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
}

const CATEGORY_CONFIG: Record<string, string> = {
  social: 'bg-purple-100 text-purple-700',
  academic: 'bg-blue-100 text-blue-700',
  safety: 'bg-red-100 text-red-700',
  health: 'bg-green-100 text-green-700',
  behavioral: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-700',
}

// ---------------------------------------------------------------------------
// Empty form
// ---------------------------------------------------------------------------

interface FormData {
  camper_id: string
  camper_name: string
  type: string
  category: string
  description: string
  severity: string
  reported_by: string
  action_taken: string
  follow_up_required: boolean
  follow_up_date: string
  parent_notified: boolean
  notes: string
}

const EMPTY_FORM: FormData = {
  camper_id: '',
  camper_name: '',
  type: 'concern',
  category: 'other',
  description: '',
  severity: 'low',
  reported_by: '',
  action_taken: '',
  follow_up_required: false,
  follow_up_date: '',
  parent_notified: false,
  notes: '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BehaviorPage() {
  const { toast } = useToast()

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')

  const filters: BehaviorFilters = useMemo(() => {
    const f: BehaviorFilters = {}
    if (searchInput.trim()) f.search = searchInput.trim()
    if (typeFilter) f.type = typeFilter
    if (severityFilter) f.severity = severityFilter
    return f
  }, [searchInput, typeFilter, severityFilter])

  // Data
  const { data: logs = [], isLoading } = useBehaviorLogs(filters)
  const { data: stats } = useBehaviorStats()
  const createMutation = useCreateBehaviorLog()
  const updateMutation = useUpdateBehaviorLog()
  const deleteMutation = useDeleteBehaviorLog()

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingLog, setEditingLog] = useState<BehaviorLog | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Handlers
  const openCreate = () => {
    setEditingLog(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (log: BehaviorLog) => {
    setEditingLog(log)
    setForm({
      camper_id: log.camper_id,
      camper_name: log.camper_name,
      type: log.type,
      category: log.category,
      description: log.description,
      severity: log.severity,
      reported_by: log.reported_by,
      action_taken: log.action_taken || '',
      follow_up_required: log.follow_up_required,
      follow_up_date: log.follow_up_date || '',
      parent_notified: log.parent_notified,
      notes: log.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.camper_name.trim() || !form.description.trim() || !form.reported_by.trim()) {
      toast({ type: 'error', message: 'Please fill in all required fields' })
      return
    }

    const payload = {
      ...form,
      type: form.type as BehaviorLog['type'],
      category: form.category as BehaviorLog['category'],
      severity: form.severity as BehaviorLog['severity'],
      camper_id: form.camper_id || crypto.randomUUID(),
      action_taken: form.action_taken || null,
      follow_up_date: form.follow_up_date || null,
      notes: form.notes || null,
    }

    try {
      if (editingLog) {
        await updateMutation.mutateAsync({ id: editingLog.id, data: payload })
        toast({ type: 'success', message: 'Behavior log updated' })
      } else {
        await createMutation.mutateAsync(payload as never)
        toast({ type: 'success', message: 'Behavior log created' })
      }
      setShowModal(false)
    } catch {
      toast({ type: 'error', message: 'Failed to save behavior log' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast({ type: 'success', message: 'Behavior log deleted' })
      setDeleteConfirm(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete behavior log' })
    }
  }

  const clearFilters = () => {
    setSearchInput('')
    setTypeFilter('')
    setSeverityFilter('')
  }

  const hasFilters = searchInput || typeFilter || severityFilter

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Behavior Tracking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Log and track camper behavior, incidents, and positive moments
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Log Entry
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            label="Total Logs"
            value={stats.total_logs}
            icon={FileText}
            color="text-slate-600"
            bg="bg-slate-50"
          />
          <StatsCard
            label="Positive"
            value={stats.positive}
            icon={ThumbsUp}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatsCard
            label="Concerns"
            value={stats.concerns}
            icon={AlertCircle}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatsCard
            label="Follow-Ups Pending"
            value={stats.follow_ups_pending}
            icon={Clock}
            color="text-blue-600"
            bg="bg-blue-50"
          />
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by camper, description, or reporter..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {SEVERITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timeline / Card View */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16">
          <MessageSquare className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-700">No behavior logs found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {hasFilters ? 'Try adjusting your filters' : 'Create your first behavior log to get started'}
          </p>
          {!hasFilters && (
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              New Log Entry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const typeConf = TYPE_CONFIG[log.type] || TYPE_CONFIG.concern
            const sevConf = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.low
            const catClass = CATEGORY_CONFIG[log.category] || CATEGORY_CONFIG.other
            const TypeIcon = typeConf.icon

            return (
              <div
                key={log.id}
                className={cn(
                  'rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md',
                  log.severity === 'critical' && 'border-red-200 ring-1 ring-red-100',
                  log.severity === 'high' && 'border-orange-200',
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border', typeConf.bg)}>
                    <TypeIcon className={cn('h-5 w-5', typeConf.color)} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{log.camper_name}</h3>
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', typeConf.bg)}>
                        {typeConf.label}
                      </span>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', sevConf.bg)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', sevConf.dot)} />
                        {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                      </span>
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', catClass)}>
                        {log.category.charAt(0).toUpperCase() + log.category.slice(1)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-700 leading-relaxed">{log.description}</p>

                    {log.action_taken && (
                      <div className="mt-2 rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Action Taken</p>
                        <p className="mt-1 text-sm text-slate-700">{log.action_taken}</p>
                      </div>
                    )}

                    {log.notes && (
                      <p className="mt-2 text-sm text-slate-500 italic">{log.notes}</p>
                    )}

                    {/* Meta row */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {log.reported_by}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(log.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {log.follow_up_required && (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                          <Bell className="h-3.5 w-3.5" />
                          Follow-up{log.follow_up_date ? ` by ${log.follow_up_date}` : ' required'}
                        </span>
                      )}
                      {log.parent_notified && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Parent notified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEdit(log)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {deleteConfirm === log.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(log.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingLog ? 'Edit Behavior Log' : 'New Behavior Log'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Row 1: Camper name + Type */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Camper Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.camper_name}
                    onChange={(e) => setForm({ ...form, camper_name: e.target.value })}
                    placeholder="Enter camper name"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="positive">Positive</option>
                    <option value="concern">Concern</option>
                    <option value="incident">Incident</option>
                    <option value="follow_up">Follow-Up</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Category + Severity */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the behavior or incident..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Reported By */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reported By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.reported_by}
                  onChange={(e) => setForm({ ...form, reported_by: e.target.value })}
                  placeholder="Staff member name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Action Taken */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Action Taken</label>
                <textarea
                  value={form.action_taken}
                  onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
                  rows={2}
                  placeholder="What action was taken (if any)..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Follow-up + Parent */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.follow_up_required}
                      onChange={(e) => setForm({ ...form, follow_up_required: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Follow-up Required</span>
                  </label>
                  {form.follow_up_required && (
                    <input
                      type="date"
                      value={form.follow_up_date}
                      onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.parent_notified}
                      onChange={(e) => setForm({ ...form, parent_notified: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Parent Notified</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {editingLog ? 'Update Log' : 'Create Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stats Card Sub-component
// ---------------------------------------------------------------------------

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: number
  icon: typeof FileText
  color: string
  bg: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', bg)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}
