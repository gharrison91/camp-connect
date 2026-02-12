/**
 * Camp Connect - Program Evaluation Page
 * View, create, edit, and delete program evaluations with stats dashboard.
 */

import { useState } from 'react'
import {
  Award,
  Plus,
  Search,
  Star,
  Shield,
  TrendingUp,
  X,
  Trash2,
  Edit3,
  Users,
  Calendar,
  ClipboardCheck,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useProgramEvals,
  useProgramEvalStats,
  useCreateProgramEval,
  useUpdateProgramEval,
  useDeleteProgramEval,
} from '@/hooks/useProgramEval'
import type { ProgramEval } from '@/hooks/useProgramEval'

const CATEGORIES: Record<string, { label: string; bg: string; text: string }> = {
  arts: { label: 'Arts', bg: 'bg-purple-50', text: 'text-purple-700' },
  sports: { label: 'Sports', bg: 'bg-blue-50', text: 'text-blue-700' },
  outdoor: { label: 'Outdoor', bg: 'bg-green-50', text: 'text-green-700' },
  academic: { label: 'Academic', bg: 'bg-amber-50', text: 'text-amber-700' },
  social: { label: 'Social', bg: 'bg-pink-50', text: 'text-pink-700' },
  other: { label: 'Other', bg: 'bg-gray-50', text: 'text-gray-600' },
}

const ENGAGEMENT_CFG: Record<string, { label: string; bg: string; text: string }> = {
  low: { label: 'Low', bg: 'bg-red-50', text: 'text-red-700' },
  medium: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700' },
  high: { label: 'High', bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

function StarRatingInput({
  value,
  onChange,
  max = 5,
}: {
  value: number
  onChange: (v: number) => void
  max?: number
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className="rounded p-0.5 hover:scale-110 transition-transform"
        >
          <Star
            className={`h-6 w-6 ${
              i < value ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function fmtDate(d: string | null) {
  if (!d) return '--'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const EMPTY_FORM = {
  program_name: '',
  category: 'other',
  evaluator_name: '',
  rating: 3,
  strengths: '',
  improvements: '',
  camper_engagement: 'medium',
  safety_rating: 3,
  notes: '',
  eval_date: '',
}

export function ProgramEvalPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [minRating, setMinRating] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ProgramEval | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const { data: evals = [], isLoading } = useProgramEvals({
    search: search || undefined,
    category: categoryFilter || undefined,
    min_rating: minRating ? Number(minRating) : undefined,
  })
  const { data: stats } = useProgramEvalStats()
  const createEval = useCreateProgramEval()
  const updateEval = useUpdateProgramEval()
  const deleteEval = useDeleteProgramEval()

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(ev: ProgramEval) {
    setEditing(ev)
    setForm({
      program_name: ev.program_name,
      category: ev.category,
      evaluator_name: ev.evaluator_name,
      rating: ev.rating,
      strengths: ev.strengths || '',
      improvements: ev.improvements || '',
      camper_engagement: ev.camper_engagement,
      safety_rating: ev.safety_rating,
      notes: ev.notes || '',
      eval_date: ev.eval_date || '',
    })
    setShowModal(true)
  }

  function handleSave() {
    const payload = {
      program_name: form.program_name,
      category: form.category,
      evaluator_name: form.evaluator_name,
      rating: form.rating,
      strengths: form.strengths || undefined,
      improvements: form.improvements || undefined,
      camper_engagement: form.camper_engagement,
      safety_rating: form.safety_rating,
      notes: form.notes || undefined,
      eval_date: form.eval_date || undefined,
    }
    if (editing) {
      updateEval.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast({ type: 'success', message: 'Evaluation updated' })
            setShowModal(false)
          },
          onError: () => toast({ type: 'error', message: 'Failed to update' }),
        },
      )
    } else {
      createEval.mutate(payload, {
        onSuccess: () => {
          toast({ type: 'success', message: 'Evaluation created' })
          setShowModal(false)
        },
        onError: () => toast({ type: 'error', message: 'Failed to create' }),
      })
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this evaluation?')) return
    deleteEval.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Evaluation deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete' }),
    })
  }

  const topProgram = stats?.top_programs?.[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Program Evaluation</h1>
            <p className="text-sm text-gray-500">
              Track and analyze program quality, safety, and engagement
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> New Evaluation
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Total Evaluations',
              value: stats.total_evals,
              icon: ClipboardCheck,
              color: 'text-gray-600',
              bg: 'bg-gray-100',
            },
            {
              label: 'Avg Rating',
              value: stats.avg_rating.toFixed(1),
              icon: Star,
              color: 'text-amber-600',
              bg: 'bg-amber-100',
              extra: (
                <StarRating rating={Math.round(stats.avg_rating)} />
              ),
            },
            {
              label: 'Avg Safety',
              value: stats.avg_safety.toFixed(1),
              icon: Shield,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100',
            },
            {
              label: 'Top Program',
              value: topProgram?.program_name || '--',
              icon: TrendingUp,
              color: 'text-blue-600',
              bg: 'bg-blue-100',
              small: true,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}
                >
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p
                    className={`font-bold text-gray-900 ${
                      s.small ? 'text-sm truncate' : 'text-xl'
                    }`}
                  >
                    {s.value}
                  </p>
                  {s.extra && <div className="mt-0.5">{s.extra}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evaluations..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Categories</option>
          <option value="arts">Arts</option>
          <option value="sports">Sports</option>
          <option value="outdoor">Outdoor</option>
          <option value="academic">Academic</option>
          <option value="social">Social</option>
          <option value="other">Other</option>
        </select>
        <select
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">Min Rating</option>
          <option value="2">2+ Stars</option>
          <option value="3">3+ Stars</option>
          <option value="4">4+ Stars</option>
          <option value="5">5 Stars</option>
        </select>
      </div>

      {/* Evaluation Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : evals.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Award className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No evaluations</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first program evaluation to start tracking quality.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evals.map((ev) => {
            const cat = CATEGORIES[ev.category] || CATEGORIES.other
            const eng = ENGAGEMENT_CFG[ev.camper_engagement] || ENGAGEMENT_CFG.medium
            return (
              <div
                key={ev.id}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                      {ev.program_name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.bg} ${cat.text}`}
                      >
                        {cat.label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${eng.bg} ${eng.text}`}
                      >
                        <Users className="mr-0.5 inline h-3 w-3" />
                        {eng.label} Engagement
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(ev)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Ratings */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Rating</span>
                    <StarRating rating={ev.rating} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Safety</span>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {ev.safety_rating}/5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strengths / Improvements */}
                {(ev.strengths || ev.improvements) && (
                  <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                    {ev.strengths && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium text-emerald-600">Strengths:</span>{' '}
                        {ev.strengths.length > 80
                          ? ev.strengths.slice(0, 80) + '...'
                          : ev.strengths}
                      </p>
                    )}
                    {ev.improvements && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium text-amber-600">Improve:</span>{' '}
                        {ev.improvements.length > 80
                          ? ev.improvements.slice(0, 80) + '...'
                          : ev.improvements}
                      </p>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {ev.evaluator_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {fmtDate(ev.eval_date || ev.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Evaluation' : 'New Evaluation'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Program Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Program Name *
                </label>
                <input
                  value={form.program_name}
                  onChange={(e) => setForm({ ...form, program_name: e.target.value })}
                  placeholder="e.g. Arts & Crafts"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category + Evaluator */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="arts">Arts</option>
                    <option value="sports">Sports</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="academic">Academic</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Evaluator *
                  </label>
                  <input
                    value={form.evaluator_name}
                    onChange={(e) =>
                      setForm({ ...form, evaluator_name: e.target.value })
                    }
                    placeholder="e.g. Jane Smith"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Overall Rating *
                </label>
                <StarRatingInput
                  value={form.rating}
                  onChange={(v) => setForm({ ...form, rating: v })}
                />
              </div>

              {/* Safety Rating */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Safety Rating *
                </label>
                <StarRatingInput
                  value={form.safety_rating}
                  onChange={(v) => setForm({ ...form, safety_rating: v })}
                />
              </div>

              {/* Engagement + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Camper Engagement
                  </label>
                  <select
                    value={form.camper_engagement}
                    onChange={(e) =>
                      setForm({ ...form, camper_engagement: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Evaluation Date
                  </label>
                  <input
                    type="date"
                    value={form.eval_date}
                    onChange={(e) => setForm({ ...form, eval_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Strengths */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Strengths
                </label>
                <textarea
                  value={form.strengths}
                  onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                  rows={2}
                  placeholder="What worked well..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {/* Improvements */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Areas for Improvement
                </label>
                <textarea
                  value={form.improvements}
                  onChange={(e) => setForm({ ...form, improvements: e.target.value })}
                  rows={2}
                  placeholder="What could be better..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !form.program_name ||
                  !form.evaluator_name ||
                  createEval.isPending ||
                  updateEval.isPending
                }
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {createEval.isPending || updateEval.isPending
                  ? 'Saving...'
                  : editing
                    ? 'Update'
                    : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
