import { useState, useMemo } from 'react'
import {
  ClipboardList,
  Plus,
  Search,
  Loader2,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Filter,
  User,
  Calendar,
  Wrench,
  FileText,
  TreePine,
  Shield,
  Sparkles,
  Boxes,
  HelpCircle,
  LayoutList,
  Columns3,
  Trash2,
  Edit3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useTasks,
  useTaskStats,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useDeleteTask,
} from '@/hooks/useTasks'
import type { TaskItem, TaskCreateData, TaskUpdateData } from '@/hooks/useTasks'

// ─── Constants ───────────────────────────────────────────────

const CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-orange-500' },
  { value: 'administrative', label: 'Administrative', icon: FileText, color: 'text-blue-500' },
  { value: 'programming', label: 'Programming', icon: TreePine, color: 'text-green-500' },
  { value: 'safety', label: 'Safety', icon: Shield, color: 'text-red-500' },
  { value: 'cleaning', label: 'Cleaning', icon: Sparkles, color: 'text-purple-500' },
  { value: 'setup', label: 'Setup', icon: Boxes, color: 'text-cyan-500' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-slate-500' },
] as const

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
] as const

const STATUS_COLUMNS = [
  { key: 'pending', label: 'Pending', headerColor: 'border-slate-400', bgColor: 'bg-slate-50' },
  { key: 'in_progress', label: 'In Progress', headerColor: 'border-amber-400', bgColor: 'bg-amber-50' },
  { key: 'completed', label: 'Completed', headerColor: 'border-emerald-400', bgColor: 'bg-emerald-50' },
  { key: 'cancelled', label: 'Cancelled', headerColor: 'border-red-400', bgColor: 'bg-red-50' },
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

function isOverdue(task: TaskItem): boolean {
  if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') return false
  const due = new Date(task.due_date.includes('T') ? task.due_date : task.due_date + 'T23:59:59Z')
  return due < new Date()
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Task Card Component ─────────────────────────────────────

function TaskCard({
  task,
  onEdit,
  onStatusChange,
  onComplete,
  onDelete,
}: {
  task: TaskItem
  onEdit: (task: TaskItem) => void
  onStatusChange: (id: string, status: string) => void
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  const catInfo = getCategoryInfo(task.category)
  const priInfo = getPriorityInfo(task.priority)
  const CatIcon = catInfo.icon
  const overdue = isOverdue(task)

  const nextStatus: Record<string, string | null> = {
    pending: 'in_progress',
    in_progress: 'completed',
    completed: null,
    cancelled: null,
  }
  const next = nextStatus[task.status]

  return (
    <div className={cn(
      'group rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md',
      overdue ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
    )}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CatIcon className={cn('h-4 w-4 shrink-0', catInfo.color)} />
          <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{task.title}</h4>
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', priInfo.color)}>
          {priInfo.label}
        </span>
      </div>

      {task.description && (
        <p className="mb-3 text-xs text-slate-500 line-clamp-2">{task.description}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {task.assigned_to}
        </span>
        {task.due_date && (
          <span className={cn('flex items-center gap-1', overdue && 'text-red-600 font-medium')}>
            <Calendar className="h-3 w-3" />
            {overdue && <AlertTriangle className="h-3 w-3" />}
            {formatDate(task.due_date)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo(task.created_at)}
        </span>
      </div>

      {task.notes && (
        <p className="mb-3 text-[11px] text-slate-400 italic line-clamp-1">{task.notes}</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Edit task"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {task.status !== 'completed' && task.status !== 'cancelled' && (
            <button
              onClick={() => onComplete(task.id)}
              className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </button>
          )}
          {next && next !== 'completed' && (
            <button
              onClick={() => onStatusChange(task.id, next)}
              className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <ArrowRight className="h-3 w-3" />
              {next === 'in_progress' ? 'Start' : next.replace('_', ' ')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Create/Edit Modal ───────────────────────────────────────

function TaskModal({
  task,
  onClose,
  onSave,
  isSaving,
}: {
  task: TaskItem | null
  onClose: () => void
  onSave: (data: TaskCreateData | TaskUpdateData, id?: string) => void
  isSaving: boolean
}) {
  const isEdit = !!task
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || '')
  const [category, setCategory] = useState(task?.category || 'other')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(task?.due_date || '')
  const [notes, setNotes] = useState(task?.notes || '')
  const [status, setStatus] = useState(task?.status || 'pending')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !assignedTo.trim()) return

    if (isEdit && task) {
      const updateData: TaskUpdateData = {
        title: title.trim(),
        description: description.trim() || null,
        assigned_to: assignedTo.trim(),
        category,
        priority,
        status,
        due_date: dueDate || null,
        notes: notes.trim() || null,
      }
      onSave(updateData, task.id)
    } else {
      const createData: TaskCreateData = {
        title: title.trim(),
        description: description.trim() || null,
        assigned_to: assignedTo.trim(),
        category,
        priority,
        due_date: dueDate || null,
        notes: notes.trim() || null,
      }
      onSave(createData)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Task' : 'New Task Assignment'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Set up volleyball court"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To *</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Staff member name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          {/* Category + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status (edit only) + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
            <div className={isEdit ? '' : 'col-span-2'}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim() || !assignedTo.trim()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────

export function TasksPage() {
  const { toast } = useToast()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)

  // Queries
  const filters = useMemo(() => {
    const f: Record<string, string> = {}
    if (filterStatus) f.status = filterStatus
    if (filterPriority) f.priority = filterPriority
    if (filterCategory) f.category = filterCategory
    if (filterAssignee) f.assigned_to = filterAssignee
    if (searchQuery) f.search = searchQuery
    return Object.keys(f).length > 0 ? f : undefined
  }, [filterStatus, filterPriority, filterCategory, filterAssignee, searchQuery])

  const { data: tasks = [], isLoading } = useTasks(filters)
  const { data: stats } = useTaskStats()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const completeTask = useCompleteTask()
  const deleteTask = useDeleteTask()

  // Unique assignees for filter dropdown
  const assignees = useMemo(() => {
    const set = new Set(tasks.map((t) => t.assigned_to))
    return Array.from(set).sort()
  }, [tasks])

  // Handlers
  const handleSave = (data: TaskCreateData | TaskUpdateData, id?: string) => {
    if (id) {
      updateTask.mutate(
        { id, data: data as TaskUpdateData },
        {
          onSuccess: () => {
            toast({ type: 'success', message: 'Task updated successfully' })
            setShowModal(false)
            setEditingTask(null)
          },
          onError: () => {
            toast({ type: 'error', message: 'Failed to update task' })
          },
        }
      )
    } else {
      createTask.mutate(data as TaskCreateData, {
        onSuccess: () => {
          toast({ type: 'success', message: 'Task created successfully' })
          setShowModal(false)
        },
        onError: () => {
          toast({ type: 'error', message: 'Failed to create task' })
        },
      })
    }
  }

  const handleStatusChange = (id: string, newStatus: string) => {
    updateTask.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ type: 'success', message: `Task moved to ${newStatus.replace('_', ' ')}` })
        },
      }
    )
  }

  const handleComplete = (id: string) => {
    completeTask.mutate(id, {
      onSuccess: () => {
        toast({ type: 'success', message: 'Task marked as completed' })
      },
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    deleteTask.mutate(id, {
      onSuccess: () => {
        toast({ type: 'success', message: 'Task deleted' })
      },
      onError: () => {
        toast({ type: 'error', message: 'Failed to delete task' })
      },
    })
  }

  const handleEdit = (task: TaskItem) => {
    setEditingTask(task)
    setShowModal(true)
  }

  const clearFilters = () => {
    setFilterStatus('')
    setFilterPriority('')
    setFilterCategory('')
    setFilterAssignee('')
    setSearchQuery('')
  }

  const hasActiveFilters = filterStatus || filterPriority || filterCategory || filterAssignee || searchQuery

  // Group tasks by status for kanban view
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, TaskItem[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    }
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    }
    return grouped
  }, [tasks])

  return (
    <div className="min-h-screen space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-emerald-600" />
            Task Assignments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign, track, and manage staff tasks across your camp
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <ClipboardList className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.total ?? 0}</p>
              <p className="text-xs text-slate-500">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.pending ?? 0}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <ArrowRight className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.in_progress ?? 0}</p>
              <p className="text-xs text-slate-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.overdue ?? 0}</p>
              <p className="text-xs text-slate-500">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters + View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              showFilters || hasActiveFilters
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
                {[filterStatus, filterPriority, filterCategory, filterAssignee].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-300 p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'kanban' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Filter Row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {assignees.length > 0 && (
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
            >
              <option value="">All Assignees</option>
              {assignees.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
          <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No tasks found</h3>
          <p className="mt-1 text-sm text-slate-400">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first task to get started'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => {
                setEditingTask(null)
                setShowModal(true)
              }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          )}
        </div>
      )}

      {/* Kanban View */}
      {!isLoading && tasks.length > 0 && viewMode === 'kanban' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="flex flex-col rounded-xl border border-slate-200 bg-white">
              <div className={cn('border-b-2 px-4 py-3', col.headerColor)}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                    {tasksByStatus[col.key]?.length || 0}
                  </span>
                </div>
              </div>
              <div className={cn('flex-1 space-y-3 p-3 min-h-[200px]', col.bgColor, 'bg-opacity-30')}>
                {(tasksByStatus[col.key] || []).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEdit}
                    onStatusChange={handleStatusChange}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
                ))}
                {(!tasksByStatus[col.key] || tasksByStatus[col.key].length === 0) && (
                  <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && tasks.length > 0 && viewMode === 'list' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Task</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:table-cell">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell">Due</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const catInfo = getCategoryInfo(task.category)
                const priInfo = getPriorityInfo(task.priority)
                const CatIcon = catInfo.icon
                const overdue = isOverdue(task)

                const statusColors: Record<string, string> = {
                  pending: 'bg-slate-100 text-slate-700',
                  in_progress: 'bg-amber-100 text-amber-700',
                  completed: 'bg-emerald-100 text-emerald-700',
                  cancelled: 'bg-red-100 text-red-700',
                }

                return (
                  <tr key={task.id} className={cn('hover:bg-slate-50 transition-colors', overdue && 'bg-red-50/40')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CatIcon className={cn('h-4 w-4 shrink-0', catInfo.color)} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-slate-400 truncate">{task.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-slate-600">{task.assigned_to}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{catInfo.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', priInfo.color)}>
                        {priInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', statusColors[task.status] || statusColors.pending)}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {task.due_date ? (
                        <span className={cn('text-sm', overdue ? 'text-red-600 font-medium' : 'text-slate-600')}>
                          {overdue && '! '}{formatDate(task.due_date)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                          <button
                            onClick={() => handleComplete(task.id)}
                            className="rounded p-1 text-emerald-500 hover:bg-emerald-50 transition-colors"
                            title="Complete"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(task)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowModal(false)
            setEditingTask(null)
          }}
          onSave={handleSave}
          isSaving={createTask.isPending || updateTask.isPending}
        />
      )}
    </div>
  )
}
