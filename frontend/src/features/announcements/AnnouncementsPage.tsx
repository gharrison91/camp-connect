/**
 * Camp Connect -- Announcement Board
 * Create, manage, and view announcements with filtering, priority badges,
 * pin/unpin, and create/edit modals.
 */

import { useState } from 'react'
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  PinOff,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Shield,
  Calendar,
  Cloud,
  Info,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useAnnouncements,
  useAnnouncementStats,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  useTogglePin,
} from '@/hooks/useAnnouncements'
import type { AnnouncementData } from '@/hooks/useAnnouncements'

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const CATEGORY_CFG: Record<string, { label: string; icon: typeof Megaphone; bg: string; text: string }> = {
  general: { label: 'General', icon: Info, bg: 'bg-gray-50', text: 'text-gray-600' },
  event: { label: 'Event', icon: Calendar, bg: 'bg-blue-50', text: 'text-blue-700' },
  safety: { label: 'Safety', icon: Shield, bg: 'bg-red-50', text: 'text-red-700' },
  schedule: { label: 'Schedule', icon: Clock, bg: 'bg-violet-50', text: 'text-violet-700' },
  weather: { label: 'Weather', icon: Cloud, bg: 'bg-amber-50', text: 'text-amber-700' },
  other: { label: 'Other', icon: Megaphone, bg: 'bg-slate-50', text: 'text-slate-600' },
}

const PRIORITY_CFG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  low: { label: 'Low', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-l-gray-300' },
  normal: { label: 'Normal', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400' },
  high: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-l-orange-400' },
  urgent: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-700', border: 'border-l-red-500' },
}

const AUDIENCE_CFG: Record<string, { label: string; bg: string; text: string }> = {
  all: { label: 'Everyone', bg: 'bg-gray-50', text: 'text-gray-600' },
  staff: { label: 'Staff', bg: 'bg-blue-50', text: 'text-blue-700' },
  parents: { label: 'Parents', bg: 'bg-purple-50', text: 'text-purple-700' },
  campers: { label: 'Campers', bg: 'bg-amber-50', text: 'text-amber-700' },
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function timeAgo(d: string) {
  const now = Date.now()
  const then = new Date(d).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EMPTY_FORM = {
  title: '',
  content: '',
  category: 'general',
  priority: 'normal',
  author: '',
  target_audience: 'all',
  is_pinned: false,
  expires_at: '',
}

export function AnnouncementsPage() {
  const { toast } = useToast()

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AnnouncementData | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Data
  const { data: announcements = [], isLoading } = useAnnouncements({
    category: categoryFilter || undefined,
    priority: priorityFilter || undefined,
    target_audience: audienceFilter || undefined,
    search: search || undefined,
  })
  const { data: stats } = useAnnouncementStats()
  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncement = useUpdateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()
  const togglePin = useTogglePin()

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(a: AnnouncementData) {
    setEditing(a)
    setForm({
      title: a.title,
      content: a.content,
      category: a.category,
      priority: a.priority,
      author: a.author,
      target_audience: a.target_audience,
      is_pinned: a.is_pinned,
      expires_at: a.expires_at ? a.expires_at.slice(0, 16) : '',
    })
    setShowModal(true)
  }

  function handleSave() {
    const payload = {
      title: form.title,
      content: form.content,
      category: form.category,
      priority: form.priority,
      author: form.author,
      target_audience: form.target_audience,
      is_pinned: form.is_pinned,
      expires_at: form.expires_at || null,
    }
    if (editing) {
      updateAnnouncement.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast({ type: 'success', message: 'Announcement updated' })
            setShowModal(false)
          },
          onError: () => toast({ type: 'error', message: 'Failed to update' }),
        },
      )
    } else {
      createAnnouncement.mutate(payload, {
        onSuccess: () => {
          toast({ type: 'success', message: 'Announcement created' })
          setShowModal(false)
        },
        onError: () => toast({ type: 'error', message: 'Failed to create' }),
      })
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return
    deleteAnnouncement.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Announcement deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete' }),
    })
  }

  function handleTogglePin(id: string) {
    togglePin.mutate(id, {
      onSuccess: (data) => {
        const msg = data.is_pinned ? 'Announcement pinned' : 'Announcement unpinned'
        toast({ type: 'success', message: msg })
      },
      onError: () => toast({ type: 'error', message: 'Failed to update pin' }),
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Megaphone className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcement Board</h1>
            <p className="text-sm text-gray-500">
              Share important updates with staff, parents, and campers
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Total',
              value: stats.total,
              icon: Megaphone,
              color: 'text-gray-600',
              bg: 'bg-gray-100',
            },
            {
              label: 'Active',
              value: stats.active,
              icon: CheckCircle2,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100',
            },
            {
              label: 'Pinned',
              value: stats.pinned,
              icon: Pin,
              color: 'text-blue-600',
              bg: 'bg-blue-100',
            },
            {
              label: 'Urgent',
              value: stats.by_priority?.urgent || 0,
              icon: AlertTriangle,
              color: 'text-red-600',
              bg: 'bg-red-100',
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
            placeholder="Search announcements..."
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
          <option value="event">Event</option>
          <option value="safety">Safety</option>
          <option value="schedule">Schedule</option>
          <option value="weather">Weather</option>
          <option value="other">Other</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Audiences</option>
          <option value="all">Everyone</option>
          <option value="staff">Staff</option>
          <option value="parents">Parents</option>
          <option value="campers">Campers</option>
        </select>
      </div>

      {/* Announcement Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-gray-200 bg-white">
          <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No announcements</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first announcement to share updates with your camp community.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const cat = CATEGORY_CFG[announcement.category] || CATEGORY_CFG.general
            const pri = PRIORITY_CFG[announcement.priority] || PRIORITY_CFG.normal
            const aud = AUDIENCE_CFG[announcement.target_audience] || AUDIENCE_CFG.all
            const CatIcon = cat.icon
            const isExpired =
              announcement.expires_at && new Date(announcement.expires_at) < new Date()

            return (
              <div
                key={announcement.id}
                className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden border-l-4 ${pri.border} ${
                  isExpired ? 'opacity-60' : ''
                }`}
              >
                <div className="p-4">
                  {/* Top row: pin badge + title + actions */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cat.bg}`}
                    >
                      <CatIcon className={`h-4 w-4 ${cat.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {announcement.is_pinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                            <Pin className="h-3 w-3" /> Pinned
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {announcement.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${pri.bg} ${pri.text}`}
                        >
                          {pri.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.bg} ${cat.text}`}
                        >
                          {cat.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${aud.bg} ${aud.text}`}
                        >
                          <Users className="mr-0.5 inline h-3 w-3" />
                          {aud.label}
                        </span>
                        {isExpired && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            Expired
                          </span>
                        )}
                      </div>

                      {/* Content preview */}
                      <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">
                        {announcement.content}
                      </p>

                      {/* Meta row */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>By {announcement.author}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(announcement.created_at)}
                        </span>
                        {announcement.expires_at && (
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Expires {fmtDate(announcement.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleTogglePin(announcement.id)}
                        className={`rounded-md p-1.5 transition-colors ${
                          announcement.is_pinned
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        {announcement.is_pinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(announcement)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors"
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Camp-wide Water Safety Reminder"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  placeholder="Write your announcement details here..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author *
                </label>
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="e.g. Camp Director"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="safety">Safety</option>
                    <option value="schedule">Schedule</option>
                    <option value="weather">Weather</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Audience + Expires */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={form.target_audience}
                    onChange={(e) =>
                      setForm({ ...form, target_audience: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="all">Everyone</option>
                    <option value="staff">Staff</option>
                    <option value="parents">Parents</option>
                    <option value="campers">Campers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) =>
                      setForm({ ...form, expires_at: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pinned toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) =>
                    setForm({ ...form, is_pinned: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Pin this announcement</span>
              </label>
            </div>

            {/* Footer */}
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
                  !form.content ||
                  !form.author ||
                  createAnnouncement.isPending ||
                  updateAnnouncement.isPending
                }
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {createAnnouncement.isPending || updateAnnouncement.isPending
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
