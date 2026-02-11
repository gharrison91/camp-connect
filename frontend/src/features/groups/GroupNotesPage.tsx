/**
 * Camp Connect - Group Notes Page
 * Shift-based notes feed with stats, filters, and create modal.
 */

import { useState } from 'react'
import {
  FileText,
  Plus,
  Search,
  X,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Users,
  Sun,
  Sunset,
  Moon,
  CloudMoon,
  Tag,
  Trash2,
  Filter,
  StickyNote,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useGroupNotes,
  useGroupNoteStats,
  useCreateGroupNote,
  useDeleteGroupNote,
} from '@/hooks/useGroupNotes'
import type { GroupNoteData, GroupNoteStats } from '@/hooks/useGroupNotes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUP_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'bunk', label: 'Bunk' },
  { value: 'activity', label: 'Activity' },
  { value: 'age_group', label: 'Age Group' },
  { value: 'custom', label: 'Custom' },
]

const SHIFTS = [
  { value: '', label: 'All Shifts' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'overnight', label: 'Overnight' },
]

const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
]

const shiftConfig: Record<string, { icon: typeof Sun; color: string; bg: string; label: string }> = {
  morning: { icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Morning' },
  afternoon: { icon: Sunset, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'Afternoon' },
  evening: { icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', label: 'Evening' },
  overnight: { icon: CloudMoon, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Overnight' },
}

const priorityConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  normal: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Normal' },
  important: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', label: 'Important' },
  urgent: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', label: 'Urgent' },
}

const groupTypeColors: Record<string, string> = {
  bunk: 'bg-emerald-100 text-emerald-700',
  activity: 'bg-blue-100 text-blue-700',
  age_group: 'bg-violet-100 text-violet-700',
  custom: 'bg-slate-100 text-slate-700',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500',
    'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500',
    'bg-indigo-500', 'bg-orange-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

// ---------------------------------------------------------------------------
// Stats Cards
// ---------------------------------------------------------------------------

function StatsBar({ stats }: { stats: GroupNoteStats | undefined }) {
  const items = [
    {
      label: 'Total Notes',
      value: stats?.total_notes ?? 0,
      icon: StickyNote,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Urgent',
      value: stats?.urgent_count ?? 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Groups',
      value: stats?.groups_with_notes ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Today',
      value: stats?.today_count ?? 0,
      icon: CalendarDays,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', item.bg)}>
                <Icon className={cn('h-5 w-5', item.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Note Card
// ---------------------------------------------------------------------------

function NoteCard({
  note,
  onDelete,
}: {
  note: GroupNoteData
  onDelete: (id: string) => void
}) {
  const shift = shiftConfig[note.shift] || shiftConfig.morning
  const prio = priorityConfig[note.priority] || priorityConfig.normal
  const ShiftIcon = shift.icon

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
        note.priority === 'urgent' && 'border-red-300 ring-1 ring-red-100',
        note.priority === 'important' && 'border-amber-300 ring-1 ring-amber-100',
        note.priority === 'normal' && 'border-gray-200',
      )}
    >
      {/* Priority indicator bar */}
      {note.priority !== 'normal' && (
        <div
          className={cn(
            'absolute left-0 top-0 h-full w-1 rounded-l-xl',
            note.priority === 'urgent' && 'bg-red-500',
            note.priority === 'important' && 'bg-amber-500',
          )}
        />
      )}

      <div className="flex items-start gap-4">
        {/* Author avatar */}
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white',
            getAvatarColor(note.author_name),
          )}
        >
          {getInitials(note.author_name)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{note.author_name}</span>
            <span className="text-gray-300">&#183;</span>
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', shift.bg)}>
              <ShiftIcon className={cn('h-3 w-3', shift.color)} />
              {shift.label}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                prio.bg,
                prio.color,
                prio.border && `border ${prio.border}`,
              )}
            >
              {note.priority === 'urgent' && <AlertCircle className="mr-1 h-3 w-3" />}
              {note.priority === 'important' && <AlertTriangle className="mr-1 h-3 w-3" />}
              {prio.label}
            </span>
          </div>

          {/* Group info */}
          <div className="mt-1 flex items-center gap-2">
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', groupTypeColors[note.group_type] || groupTypeColors.custom)}>
              {note.group_type === 'age_group' ? 'Age Group' : note.group_type.charAt(0).toUpperCase() + note.group_type.slice(1)}
            </span>
            <span className="text-sm font-medium text-gray-700">{note.group_name}</span>
          </div>

          {/* Note text */}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {note.note_text}
          </p>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {timeAgo(note.created_at)}
            <span className="ml-1 text-gray-300">
              {new Date(note.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(note.id)}
          className="flex-shrink-0 rounded-lg p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          title="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Note Modal
// ---------------------------------------------------------------------------

function CreateNoteModal({
  open,
  onClose,
  onCreate,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onCreate: (data: Omit<GroupNoteData, 'id' | 'org_id' | 'created_at'>) => void
  isPending: boolean
}) {
  const [groupName, setGroupName] = useState('')
  const [groupType, setGroupType] = useState<string>('bunk')
  const [noteText, setNoteText] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [shift, setShift] = useState<string>('morning')
  const [priority, setPriority] = useState<string>('normal')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim() || !noteText.trim() || !authorName.trim()) return
    onCreate({
      group_name: groupName.trim(),
      group_type: groupType as GroupNoteData['group_type'],
      note_text: noteText.trim(),
      author_name: authorName.trim(),
      shift: shift as GroupNoteData['shift'],
      priority: priority as GroupNoteData['priority'],
      tags,
    })
  }

  const resetForm = () => {
    setGroupName('')
    setGroupType('bunk')
    setNoteText('')
    setAuthorName('')
    setShift('morning')
    setPriority('normal')
    setTagInput('')
    setTags([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">New Group Note</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Author name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Sarah Johnson"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Group name + type row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Cabin Eagle"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="bunk">Bunk</option>
                  <option value="activity">Activity</option>
                  <option value="age_group">Age Group</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            {/* Shift + Priority row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Shift</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="overnight">Overnight</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Note text */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Note <span className="text-red-500">*</span>
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-0.5 rounded-full hover:text-emerald-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !groupName.trim() || !noteText.trim() || !authorName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Note
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function GroupNotesPage() {
  const { toast } = useToast()

  // Filters
  const [search, setSearch] = useState('')
  const [filterGroupType, setFilterGroupType] = useState('')
  const [filterShift, setFilterShift] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showModal, setShowModal] = useState(false)

  // Queries
  const { data: notes = [], isLoading } = useGroupNotes({
    group_type: filterGroupType || undefined,
    shift: filterShift || undefined,
    priority: filterPriority || undefined,
  })
  const { data: stats } = useGroupNoteStats()
  const createNote = useCreateGroupNote()
  const deleteNote = useDeleteGroupNote()

  // Client-side search filter
  const filteredNotes = search
    ? notes.filter(
        (n) =>
          n.group_name.toLowerCase().includes(search.toLowerCase()) ||
          n.author_name.toLowerCase().includes(search.toLowerCase()) ||
          n.note_text.toLowerCase().includes(search.toLowerCase()) ||
          n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
    : notes

  const activeFilterCount = [filterGroupType, filterShift, filterPriority].filter(Boolean).length

  const handleCreate = async (data: Omit<GroupNoteData, 'id' | 'org_id' | 'created_at'>) => {
    try {
      await createNote.mutateAsync(data)
      toast({ type: 'success', message: 'Note created successfully' })
      setShowModal(false)
    } catch {
      toast({ type: 'error', message: 'Failed to create note' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNote.mutateAsync(id)
      toast({ type: 'success', message: 'Note deleted' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete note' })
    }
  }

  const clearFilters = () => {
    setFilterGroupType('')
    setFilterShift('')
    setFilterPriority('')
    setSearch('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Group Notes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Shift handoff notes for bunks, activities, and groups
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, authors, groups..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterGroupType}
            onChange={(e) => setFilterGroupType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {GROUP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {SHIFTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <X className="h-3 w-3" />
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Notes feed */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-500">
            {search || activeFilterCount > 0 ? 'No notes match your filters' : 'No group notes yet'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {search || activeFilterCount > 0
              ? 'Try adjusting your search or filters'
              : 'Create your first note to get started'}
          </p>
          {!search && activeFilterCount === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Create Note
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateNoteModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
        isPending={createNote.isPending}
      />
    </div>
  )
}
