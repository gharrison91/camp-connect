import { useState } from 'react'
import {
  Phone,
  Mail,
  Users,
  MessageSquare,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Smile,
  Heart,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  X,
  Filter,
  Search,
  Share2,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useParentLogEntries,
  useParentLogStats,
  useFollowUps,
  useCheckIns,
  useCreateLogEntry,
  useCreateCheckIn,
  useCompleteFollowUp,
  useShareCheckIn,
} from '@/hooks/useParentLogs'
import type { ParentLogEntry, CamperCheckIn } from '@/types'

type Tab = 'log' | 'checkins' | 'followups'

const LOG_TYPE_ICONS: Record<string, typeof Phone> = {
  phone_call: Phone,
  email: Mail,
  in_person: Users,
  portal_message: MessageSquare,
  emergency: AlertTriangle,
  note: FileText,
}

const LOG_TYPE_LABELS: Record<string, string> = {
  phone_call: 'Phone Call',
  email: 'Email',
  in_person: 'In Person',
  portal_message: 'Portal Message',
  emergency: 'Emergency',
  note: 'Note',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
  concerned: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const MOOD_EMOJIS: Record<string, string> = {
  great: '😊',
  good: '😃',
  okay: '😐',
  struggling: '😟',
}

const MOOD_COLORS: Record<string, string> = {
  great: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  okay: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  struggling: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const MEALS_LABELS: Record<string, string> = {
  all: 'All meals',
  most: 'Most meals',
  some: 'Some meals',
  few: 'Few meals',
}

const SAMPLE_ACTIVITIES = [
  'Swimming', 'Archery', 'Arts & Crafts', 'Hiking', 'Canoeing',
  'Basketball', 'Soccer', 'Drama', 'Music', 'Nature Walk',
  'Rock Climbing', 'Tennis', 'Yoga', 'Dance', 'Fishing',
]

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return formatDate(iso)
  } catch {
    return iso
  }
}

// Stats Bar

function StatsBar() {
  const { data: stats } = useParentLogStats()

  const items = [
    { label: 'Communications This Week', value: stats?.total_communications_this_week ?? 0, icon: MessageSquare, color: 'text-blue-500' },
    { label: 'Check-Ins Today', value: stats?.check_ins_today ?? 0, icon: Heart, color: 'text-emerald-500' },
    { label: 'Follow-Ups Due', value: stats?.follow_ups_due ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Response Rate', value: `${stats?.response_rate ?? 0}%`, icon: CheckCircle2, color: 'text-violet-500' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-slate-100 p-2 dark:bg-slate-700 ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Log Communication Modal

function LogCommunicationModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const createEntry = useCreateLogEntry()

  const [form, setForm] = useState({
    parent_id: '',
    parent_name: '',
    camper_id: '',
    camper_name: '',
    log_type: 'phone_call' as string,
    direction: 'outbound' as string,
    subject: '',
    notes: '',
    sentiment: 'neutral' as string,
    follow_up_required: false,
    follow_up_date: '',
    tags: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.parent_name || !form.camper_name || !form.subject) {
      toast({ type: 'error', message: 'Please fill in required fields' })
      return
    }
    try {
      await createEntry.mutateAsync({
        ...form,
        parent_id: form.parent_id || form.parent_name.toLowerCase().replace(/\s+/g, '-'),
        camper_id: form.camper_id || form.camper_name.toLowerCase().replace(/\s+/g, '-'),
        follow_up_date: form.follow_up_date || null,
      })
      toast({ type: 'success', message: 'Communication logged successfully' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to log communication' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Log Communication</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Parent Name *</label>
              <input type="text" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="e.g. Sarah Johnson" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Camper Name *</label>
              <input type="text" value={form.camper_name} onChange={(e) => setForm({ ...form, camper_name: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="e.g. Jake Johnson" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select value={form.log_type} onChange={(e) => setForm({ ...form, log_type: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                {Object.entries(LOG_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Direction</label>
              <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Subject *</label>
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="Brief description of communication" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="Detailed notes about the conversation..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sentiment</label>
            <div className="flex gap-2">
              {(['positive', 'neutral', 'concerned', 'urgent'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setForm({ ...form, sentiment: s })} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${form.sentiment === s ? SENTIMENT_COLORS[s] + ' ring-2 ring-offset-1' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.follow_up_required} onChange={(e) => setForm({ ...form, follow_up_required: e.target.checked })} className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Follow-up required</span>
            </label>
            {form.follow_up_required && (
              <input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            )}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={createEntry.isPending} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
              {createEntry.isPending ? 'Saving...' : 'Log Communication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// New Check-In Modal

function NewCheckInModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const createCheckIn = useCreateCheckIn()

  const [form, setForm] = useState({
    camper_id: '',
    camper_name: '',
    check_in_type: 'daily' as string,
    date: new Date().toISOString().split('T')[0],
    mood: 'good' as string,
    activities_participated: [] as string[],
    meals_eaten: 'all' as string,
    health_notes: '',
    staff_notes: '',
  })

  const toggleActivity = (activity: string) => {
    setForm((prev) => ({
      ...prev,
      activities_participated: prev.activities_participated.includes(activity)
        ? prev.activities_participated.filter((a) => a !== activity)
        : [...prev.activities_participated, activity],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.camper_name) {
      toast({ type: 'error', message: 'Please enter a camper name' })
      return
    }
    try {
      await createCheckIn.mutateAsync({
        ...form,
        camper_id: form.camper_id || form.camper_name.toLowerCase().replace(/\s+/g, '-'),
      })
      toast({ type: 'success', message: 'Check-in created successfully' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to create check-in' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New Check-In</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Camper Name *</label>
              <input type="text" value={form.camper_name} onChange={(e) => setForm({ ...form, camper_name: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="e.g. Jake Johnson" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mood</label>
            <div className="flex gap-2">
              {(['great', 'good', 'okay', 'struggling'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setForm({ ...form, mood: m })} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-all ${form.mood === m ? MOOD_COLORS[m] + ' ring-2 ring-offset-1' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'}`}>
                  <span>{MOOD_EMOJIS[m]}</span> {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Activities Participated</label>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_ACTIVITIES.map((activity) => (
                <button key={activity} type="button" onClick={() => toggleActivity(activity)} className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${form.activities_participated.includes(activity) ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {activity}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Meals Eaten</label>
            <select value={form.meals_eaten} onChange={(e) => setForm({ ...form, meals_eaten: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option value="all">All meals</option>
              <option value="most">Most meals</option>
              <option value="some">Some meals</option>
              <option value="few">Few meals</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Health Notes</label>
            <textarea value={form.health_notes} onChange={(e) => setForm({ ...form, health_notes: e.target.value })} rows={2} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="Any health observations..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Staff Notes</label>
            <textarea value={form.staff_notes} onChange={(e) => setForm({ ...form, staff_notes: e.target.value })} rows={2} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="General notes about the camper's day..." />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={createCheckIn.isPending} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
              {createCheckIn.isPending ? 'Saving...' : 'Create Check-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Communication Log Tab

function CommunicationLogTab() {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')

  const { data: entries = [], isLoading } = useParentLogEntries({
    search: search || undefined,
    log_type: typeFilter || undefined,
    sentiment: sentimentFilter || undefined,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search communications..." className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white">
          <option value="">All Types</option>
          {Object.entries(LOG_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white">
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="concerned">Concerned</option>
          <option value="urgent">Urgent</option>
        </select>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
          <Plus className="h-4 w-4" /> Log Communication
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No communications yet</h3>
          <p className="mt-1 text-sm text-slate-500">Log your first parent communication to get started.</p>
          <button onClick={() => setShowModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
            <Plus className="h-4 w-4" /> Log Communication
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry: ParentLogEntry) => {
            const TypeIcon = LOG_TYPE_ICONS[entry.log_type] || MessageSquare
            const DirectionIcon = entry.direction === 'inbound' ? ArrowDownLeft : ArrowUpRight
            const dirColor = entry.direction === 'inbound' ? 'text-blue-500' : 'text-emerald-500'
            return (
              <div key={entry.id} className="group rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                    <TypeIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900 dark:text-white">{entry.parent_name}</span>
                      <DirectionIcon className={`h-4 w-4 ${dirColor}`} />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{entry.camper_name}</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SENTIMENT_COLORS[entry.sentiment]}`}>{entry.sentiment}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">{entry.subject}</p>
                    {entry.notes && <p className="mt-1 text-sm text-slate-500 line-clamp-2 dark:text-slate-400">{entry.notes}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {timeAgo(entry.created_at)}</span>
                      <span>{LOG_TYPE_LABELS[entry.log_type]}</span>
                      {entry.follow_up_required && !entry.follow_up_completed && (
                        <span className="flex items-center gap-1 text-amber-500"><Clock className="h-3 w-3" /> Follow-up {entry.follow_up_date ? formatDate(entry.follow_up_date) : 'needed'}</span>
                      )}
                      {entry.follow_up_completed && (
                        <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="h-3 w-3" /> Follow-up complete</span>
                      )}
                      <span className="text-slate-400">by {entry.staff_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showModal && <LogCommunicationModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// Check-Ins Tab

function CheckInsTab() {
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const { toast } = useToast()
  const shareCheckIn = useShareCheckIn()

  const { data: checkIns = [], isLoading } = useCheckIns({ date: selectedDate })

  const handleShare = async (ci: CamperCheckIn) => {
    try {
      await shareCheckIn.mutateAsync(ci.id)
      toast({ type: 'success', message: `Check-in shared with parents` })
    } catch {
      toast({ type: 'error', message: 'Failed to share check-in' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date:</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
          <Plus className="h-4 w-4" /> New Check-In
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : checkIns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <Smile className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No check-ins for this date</h3>
          <p className="mt-1 text-sm text-slate-500">Create a new check-in to track camper wellbeing.</p>
          <button onClick={() => setShowModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
            <Plus className="h-4 w-4" /> New Check-In
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checkIns.map((ci: CamperCheckIn) => (
            <div key={ci.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">{ci.camper_name}</h3>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${MOOD_COLORS[ci.mood]}`}>
                  <span>{MOOD_EMOJIS[ci.mood]}</span> {ci.mood}
                </span>
              </div>
              {ci.activities_participated.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Activities</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ci.activities_participated.map((a) => (
                      <span key={a} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Meals: <span className="font-medium text-slate-700 dark:text-slate-300">{MEALS_LABELS[ci.meals_eaten]}</span></span>
              </div>
              {ci.health_notes && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Health Notes</p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{ci.health_notes}</p>
                </div>
              )}
              {ci.staff_notes && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Staff Notes</p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{ci.staff_notes}</p>
                </div>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700">
                {ci.shared_with_parents ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" /> Shared with parents</span>
                ) : (
                  <button onClick={() => handleShare(ci)} disabled={shareCheckIn.isPending} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    <Share2 className="h-3.5 w-3.5" /> Share with Parents
                  </button>
                )}
                <span className="text-xs text-slate-400">{formatTime(ci.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <NewCheckInModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// Follow-Ups Tab

function FollowUpsTab() {
  const [overdueOnly, setOverdueOnly] = useState(false)
  const { toast } = useToast()
  const completeFollowUp = useCompleteFollowUp()
  const { data: followUps = [], isLoading } = useFollowUps(overdueOnly)
  const today = new Date().toISOString().split('T')[0]

  const handleComplete = async (entry: ParentLogEntry) => {
    try {
      await completeFollowUp.mutateAsync(entry.id)
      toast({ type: 'success', message: 'Follow-up marked as complete' })
    } catch {
      toast({ type: 'error', message: 'Failed to complete follow-up' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
          <span className="text-sm text-slate-700 dark:text-slate-300">Overdue only</span>
        </label>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          {followUps.length} follow-up{followUps.length !== 1 ? 's' : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : followUps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300 dark:text-emerald-600" />
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">All caught up!</h3>
          <p className="mt-1 text-sm text-slate-500">No pending follow-ups at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {followUps.map((entry: ParentLogEntry) => {
            const isOverdue = entry.follow_up_date ? entry.follow_up_date < today : false
            const TypeIcon = LOG_TYPE_ICONS[entry.log_type] || MessageSquare
            return (
              <div key={entry.id} className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/10' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isOverdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      <TypeIcon className={`h-4 w-4 ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">{entry.parent_name}</span>
                        <span className="text-slate-400">{' -> '}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{entry.camper_name}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{entry.subject}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span>Logged {timeAgo(entry.created_at)}</span>
                        {entry.follow_up_date && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'font-medium text-red-500' : 'text-amber-500'}`}>
                            <AlertCircle className="h-3 w-3" />
                            {isOverdue ? 'Overdue' : 'Due'}: {formatDate(entry.follow_up_date)}
                          </span>
                        )}
                        <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium capitalize ${SENTIMENT_COLORS[entry.sentiment]}`}>{entry.sentiment}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleComplete(entry)} disabled={completeFollowUp.isPending} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Main Page

export function ParentLogsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('log')

  const tabs: { id: Tab; label: string; icon: typeof Phone }[] = [
    { id: 'log', label: 'Communication Log', icon: MessageSquare },
    { id: 'checkins', label: 'Check-Ins', icon: Smile },
    { id: 'followups', label: 'Follow-Ups', icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parent Communication Log</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track parent communications, camper check-ins, and follow-ups</p>
      </div>

      <StatsBar />

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {activeTab === 'log' && <CommunicationLogTab />}
      {activeTab === 'checkins' && <CheckInsTab />}
      {activeTab === 'followups' && <FollowUpsTab />}
    </div>
  )
}
