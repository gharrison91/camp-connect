/**
 * Camp Connect - Feedback Collection Page
 * View, create, and manage feedback from parents, campers, and staff.
 */

import { useState } from 'react'
import {
  MessageSquareText,
  Plus,
  Search,
  Star,
  BarChart3,
  Clock,
  Archive,
  Eye,
  X,
  Trash2,
  Edit3,
  Send,
  Users,
  ShieldAlert,
  Utensils,
  MapPin,
  Activity,
  HelpCircle,
  UserCircle,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useFeedbackEntries,
  useFeedbackStats,
  useCreateFeedback,
  useUpdateFeedback,
  useDeleteFeedback,
} from '@/hooks/useFeedback'
import type { FeedbackEntry } from '@/hooks/useFeedback'

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: 'New', bg: 'bg-amber-50', text: 'text-amber-700' },
  reviewed: { label: 'Reviewed', bg: 'bg-blue-50', text: 'text-blue-700' },
  addressed: { label: 'Addressed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  archived: { label: 'Archived', bg: 'bg-gray-50', text: 'text-gray-600' },
}

const CATEGORY_CFG: Record<string, { label: string; icon: typeof MessageSquareText; color: string }> = {
  general: { label: 'General', icon: MessageSquareText, color: 'text-gray-500' },
  activity: { label: 'Activity', icon: Activity, color: 'text-blue-500' },
  facility: { label: 'Facility', icon: MapPin, color: 'text-purple-500' },
  food: { label: 'Food', icon: Utensils, color: 'text-orange-500' },
  staff: { label: 'Staff', icon: Users, color: 'text-teal-500' },
  safety: { label: 'Safety', icon: ShieldAlert, color: 'text-red-500' },
  other: { label: 'Other', icon: HelpCircle, color: 'text-gray-400' },
}

const SUBMITTER_CFG: Record<string, { label: string; bg: string; text: string }> = {
  parent: { label: 'Parent', bg: 'bg-purple-50', text: 'text-purple-700' },
  camper: { label: 'Camper', bg: 'bg-amber-50', text: 'text-amber-700' },
  staff: { label: 'Staff', bg: 'bg-blue-50', text: 'text-blue-700' },
}

function fmtDate(d: string | null) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sz} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

function InteractiveStarRating({ rating, onChange }: { rating: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              i <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function FeedbackPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [submitterFilter, setSubmitterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<FeedbackEntry | null>(null)
  const [respondingTo, setRespondingTo] = useState<FeedbackEntry | null>(null)
  const [responseText, setResponseText] = useState('')
  const [form, setForm] = useState({
    submitted_by: '',
    submitter_type: 'parent',
    category: 'general',
    rating: 5,
    title: '',
    comment: '',
    is_anonymous: false,
    status: 'new',
  })

  const { data: entries = [], isLoading } = useFeedbackEntries({
    category: categoryFilter || undefined,
    submitter_type: submitterFilter || undefined,
    status: statusFilter || undefined,
    rating: ratingFilter ? Number(ratingFilter) : undefined,
    search: search || undefined,
  })
  const { data: stats } = useFeedbackStats()
  const createFeedback = useCreateFeedback()
  const updateFeedback = useUpdateFeedback()
  const deleteFeedback = useDeleteFeedback()

  function openCreate() {
    setEditing(null)
    setForm({
      submitted_by: '',
      submitter_type: 'parent',
      category: 'general',
      rating: 5,
      title: '',
      comment: '',
      is_anonymous: false,
      status: 'new',
    })
    setShowModal(true)
  }

  function openEdit(entry: FeedbackEntry) {
    setEditing(entry)
    setForm({
      submitted_by: entry.submitted_by,
      submitter_type: entry.submitter_type,
      category: entry.category,
      rating: entry.rating,
      title: entry.title,
      comment: entry.comment,
      is_anonymous: entry.is_anonymous,
      status: entry.status,
    })
    setShowModal(true)
  }

  function handleSave() {
    const payload = {
      submitted_by: form.submitted_by,
      submitter_type: form.submitter_type,
      category: form.category,
      rating: form.rating,
      title: form.title,
      comment: form.comment,
      is_anonymous: form.is_anonymous,
      status: form.status,
    }
    if (editing) {
      updateFeedback.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast({ type: 'success', message: 'Feedback updated' })
            setShowModal(false)
          },
          onError: () => toast({ type: 'error', message: 'Failed to update feedback' }),
        }
      )
    } else {
      createFeedback.mutate(payload, {
        onSuccess: () => {
          toast({ type: 'success', message: 'Feedback submitted' })
          setShowModal(false)
        },
        onError: () => toast({ type: 'error', message: 'Failed to submit feedback' }),
      })
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this feedback entry?')) return
    deleteFeedback.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Feedback deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete feedback' }),
    })
  }

  function handleRespond() {
    if (!respondingTo || !responseText.trim()) return
    updateFeedback.mutate(
      {
        id: respondingTo.id,
        data: {
          response: responseText,
          responded_by: 'Admin',
          responded_at: new Date().toISOString(),
          status: 'addressed',
        },
      },
      {
        onSuccess: () => {
          toast({ type: 'success', message: 'Response sent' })
          setRespondingTo(null)
          setResponseText('')
        },
        onError: () => toast({ type: 'error', message: 'Failed to send response' }),
      }
    )
  }

  function handleStatusChange(entry: FeedbackEntry, newStatus: string) {
    updateFeedback.mutate(
      { id: entry.id, data: { status: newStatus } },
      {
        onSuccess: () => toast({ type: 'success', message: `Status updated to ${newStatus}` }),
        onError: () => toast({ type: 'error', message: 'Failed to update status' }),
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <MessageSquareText className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback Collection</h1>
            <p className="text-sm text-gray-500">Collect and manage feedback from parents, campers, and staff</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Feedback
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Total Feedback',
              value: stats.total,
              icon: MessageSquareText,
              color: 'text-gray-600',
              bg: 'bg-gray-100',
            },
            {
              label: 'Avg Rating',
              value: stats.avg_rating.toFixed(1),
              icon: Star,
              color: 'text-amber-600',
              bg: 'bg-amber-100',
            },
            {
              label: 'New / Unreviewed',
              value: stats.new_count,
              icon: Clock,
              color: 'text-red-600',
              bg: 'bg-red-100',
            },
            {
              label: 'Categories',
              value: Object.keys(stats.by_category).length,
              icon: BarChart3,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100',
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
            placeholder="Search feedback..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Categories</option>
          <option value="general">General</option>
          <option value="activity">Activity</option>
          <option value="facility">Facility</option>
          <option value="food">Food</option>
          <option value="staff">Staff</option>
          <option value="safety">Safety</option>
          <option value="other">Other</option>
        </select>
        <select
          value={submitterFilter}
          onChange={(e) => setSubmitterFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Submitters</option>
          <option value="parent">Parent</option>
          <option value="camper">Camper</option>
          <option value="staff">Staff</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="addressed">Addressed</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {/* Feedback list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-gray-200 bg-white">
          <MessageSquareText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No feedback yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start collecting feedback from your camp community.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const st = STATUS_CFG[entry.status] || STATUS_CFG.new
            const cat = CATEGORY_CFG[entry.category] || CATEGORY_CFG.general
            const sub = SUBMITTER_CFG[entry.submitter_type] || SUBMITTER_CFG.parent
            const CatIcon = cat.icon

            return (
              <div
                key={entry.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50">
                      {entry.is_anonymous ? (
                        <UserCircle className="h-5 w-5 text-gray-400" />
                      ) : (
                        <CatIcon className={`h-5 w-5 ${cat.color}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {entry.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.bg} ${st.text}`}
                        >
                          {st.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sub.bg} ${sub.text}`}
                        >
                          {sub.label}
                        </span>
                        <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                          {cat.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          {entry.is_anonymous ? 'Anonymous' : entry.submitted_by}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {fmtDate(entry.created_at)}
                        </span>
                        <StarRating rating={entry.rating} />
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {entry.comment}
                      </p>

                      {/* Response section */}
                      {entry.response && (
                        <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                          <div className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <Send className="h-3 w-3" /> Response from {entry.responded_by || 'Admin'}
                            {entry.responded_at && (
                              <span className="text-emerald-500 ml-1">
                                {fmtDate(entry.responded_at)}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-emerald-800">{entry.response}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!entry.response && (
                        <button
                          onClick={() => {
                            setRespondingTo(entry)
                            setResponseText('')
                          }}
                          className="rounded-md p-1.5 text-emerald-500 hover:bg-emerald-50"
                          title="Respond"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {entry.status === 'new' && (
                        <button
                          onClick={() => handleStatusChange(entry, 'reviewed')}
                          className="rounded-md p-1.5 text-blue-500 hover:bg-blue-50"
                          title="Mark Reviewed"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {entry.status !== 'archived' && (
                        <button
                          onClick={() => handleStatusChange(entry, 'archived')}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(entry)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Respond Modal */}
      {respondingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Respond to Feedback
              </h3>
              <button
                onClick={() => setRespondingTo(null)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{respondingTo.title}</p>
              <p className="mt-1 text-sm text-gray-600">{respondingTo.comment}</p>
              <div className="mt-2 flex items-center gap-2">
                <StarRating rating={respondingTo.rating} />
                <span className="text-xs text-gray-500">
                  by {respondingTo.is_anonymous ? 'Anonymous' : respondingTo.submitted_by}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Response
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                placeholder="Write your response to this feedback..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRespondingTo(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={!responseText.trim() || updateFeedback.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {updateFeedback.isPending ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Feedback' : 'New Feedback'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Great swim program!"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment *
                </label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  rows={3}
                  placeholder="Detailed feedback..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating *
                </label>
                <InteractiveStarRating
                  rating={form.rating}
                  onChange={(v) => setForm({ ...form, rating: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submitted By *
                  </label>
                  <input
                    value={form.submitted_by}
                    onChange={(e) =>
                      setForm({ ...form, submitted_by: e.target.value })
                    }
                    placeholder="Name"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submitter Type
                  </label>
                  <select
                    value={form.submitter_type}
                    onChange={(e) =>
                      setForm({ ...form, submitter_type: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="parent">Parent</option>
                    <option value="camper">Camper</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="general">General</option>
                    <option value="activity">Activity</option>
                    <option value="facility">Facility</option>
                    <option value="food">Food</option>
                    <option value="staff">Staff</option>
                    <option value="safety">Safety</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="addressed">Addressed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_anonymous"
                  checked={form.is_anonymous}
                  onChange={(e) =>
                    setForm({ ...form, is_anonymous: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="is_anonymous"
                  className="text-sm text-gray-700"
                >
                  Submit anonymously
                </label>
              </div>
            </div>
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
                  !form.title ||
                  !form.comment ||
                  !form.submitted_by ||
                  createFeedback.isPending ||
                  updateFeedback.isPending
                }
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {createFeedback.isPending || updateFeedback.isPending
                  ? 'Saving...'
                  : editing
                    ? 'Update'
                    : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
