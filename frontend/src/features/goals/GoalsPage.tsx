/**
 * Camp Connect - Goal Setting Page
 * Camper goal management with stats, filters, progress tracking, milestones, and CRUD modals.
 */

import { useState, useMemo } from 'react'
import {
  Target,
  Plus,
  Search,
  X,
  Loader2,
  Edit2,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Clock,
  Circle,
  XCircle,
  Trophy,
  TrendingUp,
  BarChart3,
  BookOpen,
  Users,
  Dumbbell,
  Palette,
  User,
  MoreHorizontal,
  Calendar,
  StickyNote,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useGoals,
  useGoalStats,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from '@/hooks/useGoals'
import type { GoalRecord, GoalFilters, GoalMilestone } from '@/hooks/useGoals'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'academic', label: 'Academic' },
  { value: 'social', label: 'Social' },
  { value: 'physical', label: 'Physical' },
  { value: 'creative', label: 'Creative' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_FORM_OPTIONS = [
  { value: 'academic', label: 'Academic' },
  { value: 'social', label: 'Social' },
  { value: 'physical', label: 'Physical' },
  { value: 'creative', label: 'Creative' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
]

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bg: string; label: string }> = {
  not_started: { icon: Circle, color: 'text-slate-500', bg: 'bg-slate-100 text-slate-700', label: 'Not Started' },
  in_progress: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 text-blue-700', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
  abandoned: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 text-red-700', label: 'Abandoned' },
}

const CATEGORY_CONFIG: Record<string, { icon: typeof BookOpen; color: string; bg: string }> = {
  academic: { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100 text-blue-700' },
  social: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100 text-purple-700' },
  physical: { icon: Dumbbell, color: 'text-orange-600', bg: 'bg-orange-100 text-orange-700' },
  creative: { icon: Palette, color: 'text-pink-600', bg: 'bg-pink-100 text-pink-700' },
  personal: { icon: User, color: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-700' },
  other: { icon: MoreHorizontal, color: 'text-slate-600', bg: 'bg-slate-100 text-slate-700' },
}

// ---------------------------------------------------------------------------
// Form type
// ---------------------------------------------------------------------------

interface FormData {
  camper_id: string
  camper_name: string
  title: string
  description: string
  category: string
  target_date: string
  status: string
  progress: number
  milestones: GoalMilestone[]
  counselor_notes: string
}

const EMPTY_FORM: FormData = {
  camper_id: '',
  camper_name: '',
  title: '',
  description: '',
  category: 'personal',
  target_date: '',
  status: 'not_started',
  progress: 0,
  milestones: [],
  counselor_notes: '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoalsPage() {
  const { toast } = useToast()

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filters: GoalFilters = useMemo(() => {
    const f: GoalFilters = {}
    if (searchInput.trim()) f.search = searchInput.trim()
    if (statusFilter) f.status = statusFilter
    if (categoryFilter) f.category = categoryFilter
    return f
  }, [searchInput, statusFilter, categoryFilter])

  // Data
  const { data: goals = [], isLoading } = useGoals(filters)
  const { data: stats } = useGoalStats()
  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()
  const deleteMutation = useDeleteGoal()

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalRecord | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [newMilestone, setNewMilestone] = useState('')
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)

  // Handlers
  const openCreate = () => {
    setEditingGoal(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (goal: GoalRecord) => {
    setEditingGoal(goal)
    setForm({
      camper_id: goal.camper_id,
      camper_name: goal.camper_name,
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      target_date: goal.target_date || '',
      status: goal.status,
      progress: goal.progress,
      milestones: goal.milestones || [],
      counselor_notes: goal.counselor_notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.camper_name.trim() || !form.title.trim()) {
      toast({ type: 'error', message: 'Please fill in camper name and goal title' })
      return
    }

    const payload = {
      ...form,
      camper_id: form.camper_id || crypto.randomUUID(),
      description: form.description || null,
      target_date: form.target_date || null,
      milestones: form.milestones.length > 0 ? form.milestones : null,
      counselor_notes: form.counselor_notes || null,
    }

    try {
      if (editingGoal) {
        await updateMutation.mutateAsync({ id: editingGoal.id, data: payload as Partial<GoalRecord> })
        toast({ type: 'success', message: 'Goal updated successfully' })
      } else {
        await createMutation.mutateAsync(payload as any)
        toast({ type: 'success', message: 'Goal created successfully' })
      }
      setShowModal(false)
    } catch {
      toast({ type: 'error', message: 'Failed to save goal' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast({ type: 'success', message: 'Goal deleted' })
      setDeleteConfirm(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete goal' })
    }
  }

  const addMilestone = () => {
    if (!newMilestone.trim()) return
    setForm((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { title: newMilestone.trim(), completed: false }],
    }))
    setNewMilestone('')
  }

  const removeMilestone = (index: number) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }))
  }

  const toggleMilestone = (index: number) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) =>
        i === index ? { ...m, completed: !m.completed } : m
      ),
    }))
  }

  const quickUpdateProgress = async (goal: GoalRecord, progress: number) => {
    const newStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : goal.status
    try {
      await updateMutation.mutateAsync({ id: goal.id, data: { progress, status: newStatus } })
      toast({ type: 'success', message: `Progress updated to ${progress}%` })
    } catch {
      toast({ type: 'error', message: 'Failed to update progress' })
    }
  }

  // Stats data
  const statCards = [
    {
      label: 'Total Goals',
      value: stats?.total ?? 0,
      icon: Target,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Completed',
      value: stats?.completed ?? 0,
      icon: Trophy,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'In Progress',
      value: stats?.in_progress ?? 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Completion Rate',
      value: `${stats?.completion_rate ?? 0}%`,
      icon: BarChart3,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goal Setting</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage camper goals, milestones, and progress
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2', card.bg)}>
                  <Icon className={cn('h-5 w-5', card.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search goals by title, camper, or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Goals list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16">
          <Target className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-600">No goals found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {searchInput || statusFilter || categoryFilter
              ? 'Try adjusting your filters'
              : 'Create your first camper goal to get started'}
          </p>
          {!searchInput && !statusFilter && !categoryFilter && (
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Goal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const statusCfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.not_started
            const catCfg = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.other
            const StatusIcon = statusCfg.icon
            const CatIcon = catCfg.icon
            const isExpanded = expandedGoal === goal.id

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Card header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">
                      <StatusIcon className={cn('h-5 w-5', statusCfg.color)} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                          <p className="mt-0.5 text-sm text-gray-500">{goal.camper_name}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => openEdit(goal)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="Edit goal"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(goal.id)}
                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete goal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', statusCfg.bg)}>
                          {statusCfg.label}
                        </span>
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', catCfg.bg)}>
                          <CatIcon className="h-3 w-3" />
                          {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
                        </span>
                        {goal.target_date && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {goal.target_date}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {goal.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{goal.description}</p>
                      )}

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-500">Progress</span>
                          <span className="font-semibold text-gray-700">{goal.progress}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              goal.progress === 100
                                ? 'bg-emerald-500'
                                : goal.progress >= 50
                                  ? 'bg-blue-500'
                                  : goal.progress > 0
                                    ? 'bg-amber-500'
                                    : 'bg-gray-300'
                            )}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        {/* Quick progress buttons */}
                        {goal.status !== 'completed' && goal.status !== 'abandoned' && (
                          <div className="mt-2 flex gap-1">
                            {[25, 50, 75, 100].map((p) => (
                              <button
                                key={p}
                                onClick={() => quickUpdateProgress(goal, p)}
                                disabled={updateMutation.isPending}
                                className={cn(
                                  'rounded px-2 py-0.5 text-xs font-medium transition-colors',
                                  goal.progress >= p
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                                )}
                              >
                                {p}%
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expand toggle for milestones / notes */}
                      {(goal.milestones?.length || goal.counselor_notes) && (
                        <button
                          onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          <ChevronRight
                            className={cn(
                              'h-3.5 w-3.5 transition-transform',
                              isExpanded && 'rotate-90'
                            )}
                          />
                          {isExpanded ? 'Hide details' : 'Show details'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded section */}
                  {isExpanded && (
                    <div className="mt-3 ml-8 space-y-3 border-t border-gray-100 pt-3">
                      {/* Milestones */}
                      {goal.milestones && goal.milestones.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Milestones
                          </h4>
                          <ul className="mt-1.5 space-y-1">
                            {goal.milestones.map((m, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-2 text-sm"
                              >
                                {m.completed ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                ) : (
                                  <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                                )}
                                <span
                                  className={cn(
                                    m.completed && 'text-gray-400 line-through'
                                  )}
                                >
                                  {m.title}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Counselor notes */}
                      {goal.counselor_notes && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Counselor Notes
                          </h4>
                          <div className="mt-1.5 flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                            <p className="text-sm text-gray-600">{goal.counselor_notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Goal</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this goal? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh]">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
              {/* Camper name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Camper Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.camper_name}
                  onChange={(e) => setForm((p) => ({ ...p, camper_name: e.target.value }))}
                  placeholder="Enter camper name"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Goal Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Learn to swim 50 meters"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe the goal..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {CATEGORY_FORM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </div>
              </div>

              {/* Target date + Progress */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Date</label>
                  <input
                    type="date"
                    value={form.target_date}
                    onChange={(e) => setForm((p) => ({ ...p, target_date: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Progress: {form.progress}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={form.progress}
                    onChange={(e) => setForm((p) => ({ ...p, progress: parseInt(e.target.value) }))}
                    className="mt-3 w-full accent-emerald-600"
                  />
                </div>
              </div>

              {/* Milestones */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Milestones</label>
                <div className="mt-1 space-y-2">
                  {form.milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMilestone(i)}
                        className="shrink-0"
                      >
                        {m.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
                      <span
                        className={cn(
                          'flex-1 text-sm',
                          m.completed && 'text-gray-400 line-through'
                        )}
                      >
                        {m.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMilestone(i)}
                        className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                      placeholder="Add a milestone..."
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Counselor notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Counselor Notes</label>
                <textarea
                  value={form.counselor_notes}
                  onChange={(e) => setForm((p) => ({ ...p, counselor_notes: e.target.value }))}
                  rows={3}
                  placeholder="Private notes for counselors..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
