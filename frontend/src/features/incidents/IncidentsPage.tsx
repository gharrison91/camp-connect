import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  Plus,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useIncidents,
  useIncidentStats,
  useCreateIncident,
  useAddFollowUp,
  useResolveIncident,
  useUpdateIncident,
  useDeleteIncident,
} from '@/hooks/useIncidents'
import type { Incident, IncidentParty } from '@/types'

// ─── Constants ───────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: 'Low', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700' },
  investigating: { label: 'Investigating', color: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700' },
}

const TYPE_LABELS: Record<string, string> = {
  injury: 'Injury',
  behavioral: 'Behavioral',
  property: 'Property',
  safety_hazard: 'Safety Hazard',
  medical: 'Medical',
  other: 'Other',
}

const SEVERITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const
const STATUS_OPTIONS = ['open', 'investigating', 'resolved', 'closed'] as const
const TYPE_OPTIONS = ['injury', 'behavioral', 'property', 'safety_hazard', 'medical', 'other'] as const

// ─── Main Page ───────────────────────────────────────────────

export function IncidentsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState<string | null>(null)

  const filters = useMemo(() => ({
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(severityFilter !== 'all' ? { severity: severityFilter } : {}),
    ...(typeFilter !== 'all' ? { incident_type: typeFilter } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  }), [statusFilter, severityFilter, typeFilter, searchQuery])

  const { data: incidents = [], isLoading } = useIncidents(filters)
  const { data: stats } = useIncidentStats()
  const deleteIncident = useDeleteIncident()

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this incident report?')) return
    deleteIncident.mutate(id, {
      onSuccess: () => {
        toast({ type: 'success', message: 'Incident deleted' })
        if (expandedId === id) setExpandedId(null)
      },
      onError: () => toast({ type: 'error', message: 'Failed to delete incident' }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Incident & Safety Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track, investigate, and resolve safety incidents across your camp
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Report Incident
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Open"
          value={stats?.open_count ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-500"
          bgColor="bg-red-50"
        />
        <StatCard
          label="Critical Active"
          value={stats?.critical_count ?? 0}
          icon={Shield}
          iconColor="text-orange-500"
          bgColor="bg-orange-50"
        />
        <StatCard
          label="Resolved This Week"
          value={stats?.resolved_this_week ?? 0}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-50"
        />
        <StatCard
          label="Total Reports"
          value={stats?.total ?? 0}
          icon={FileText}
          iconColor="text-blue-500"
          bgColor="bg-blue-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'all', label: 'All Statuses' }, ...STATUS_OPTIONS.map(s => ({ value: s, label: STATUS_CONFIG[s].label }))]}
        />
        <FilterSelect
          value={severityFilter}
          onChange={setSeverityFilter}
          options={[{ value: 'all', label: 'All Severities' }, ...SEVERITY_OPTIONS.map(s => ({ value: s, label: SEVERITY_CONFIG[s].label }))]}
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[{ value: 'all', label: 'All Types' }, ...TYPE_OPTIONS.map(t => ({ value: t, label: TYPE_LABELS[t] }))]}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && incidents.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16">
          <Shield className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No incidents found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all' || severityFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Great news! No incidents have been reported yet.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Report Incident
          </button>
        </div>
      )}

      {/* Incidents List */}
      {!isLoading && incidents.length > 0 && (
        <div className="space-y-2">
          {incidents.map((incident) => (
            <IncidentRow
              key={incident.id}
              incident={incident}
              isExpanded={expandedId === incident.id}
              onToggle={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
              onResolve={() => setShowResolveModal(incident.id)}
              onDelete={() => handleDelete(incident.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <IncidentFormModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <ResolveModal
          incidentId={showResolveModal}
          onClose={() => setShowResolveModal(null)}
        />
      )}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  bgColor,
}: {
  label: string
  value: number
  icon: typeof AlertTriangle
  iconColor: string
  bgColor: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2.5', bgColor)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Select ───────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// ─── Incident Row ────────────────────────────────────────────

function IncidentRow({
  incident,
  isExpanded,
  onToggle,
  onResolve,
  onDelete,
}: {
  incident: Incident
  isExpanded: boolean
  onToggle: () => void
  onResolve: () => void
  onDelete: () => void
}) {
  const sevConf = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.medium
  const statusConf = STATUS_CONFIG[incident.status] || STATUS_CONFIG.open
  const typeLabel = TYPE_LABELS[incident.incident_type] || incident.incident_type

  const dateStr = new Date(incident.date_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Summary Row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Severity dot */}
        <div className={cn('h-3 w-3 rounded-full flex-shrink-0', sevConf.dot)} />

        {/* Title + type */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{incident.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{typeLabel}</p>
        </div>

        {/* Location */}
        {incident.location && (
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{incident.location}</span>
          </div>
        )}

        {/* Date */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{dateStr}</span>
        </div>

        {/* Reporter */}
        <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500">
          <User className="h-3 w-3" />
          <span className="truncate max-w-[100px]">{incident.reported_by_name}</span>
        </div>

        {/* Severity badge */}
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', sevConf.color)}>
          {sevConf.label}
        </span>

        {/* Status badge */}
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusConf.color)}>
          {statusConf.label}
        </span>

        {/* Expand icon */}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <IncidentDetail
          incident={incident}
          onResolve={onResolve}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

// ─── Incident Detail (expanded panel) ────────────────────────

function IncidentDetail({
  incident,
  onResolve,
  onDelete,
}: {
  incident: Incident
  onResolve: () => void
  onDelete: () => void
}) {
  const { toast } = useToast()
  const [followUpText, setFollowUpText] = useState('')
  const addFollowUp = useAddFollowUp()
  const updateIncident = useUpdateIncident()

  const handleFollowUp = () => {
    if (!followUpText.trim()) return
    addFollowUp.mutate(
      { id: incident.id, note: followUpText.trim() },
      {
        onSuccess: () => {
          setFollowUpText('')
          toast({ type: 'success', message: 'Follow-up added' })
        },
        onError: () => toast({ type: 'error', message: 'Failed to add follow-up' }),
      },
    )
  }

  const handleStatusChange = (newStatus: string) => {
    updateIncident.mutate(
      { id: incident.id, data: { status: newStatus } },
      {
        onSuccess: () => toast({ type: 'success', message: `Status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}` }),
        onError: () => toast({ type: 'error', message: 'Failed to update status' }),
      },
    )
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-5 py-5 space-y-5">
      {/* Description */}
      {incident.description && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Description</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.description}</p>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location</span>
          <p className="text-gray-700 mt-0.5">{incident.location || 'N/A'}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date/Time</span>
          <p className="text-gray-700 mt-0.5">{new Date(incident.date_time).toLocaleString()}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reported By</span>
          <p className="text-gray-700 mt-0.5">{incident.reported_by_name}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</span>
          <p className="text-gray-700 mt-0.5">{new Date(incident.created_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Actions taken */}
      {incident.actions_taken && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Actions Taken</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.actions_taken}</p>
        </div>
      )}

      {/* Involved Parties */}
      {incident.involved_parties.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Involved Parties</h4>
          <div className="flex flex-wrap gap-2">
            {incident.involved_parties.map((party, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs"
              >
                <User className="h-3 w-3 text-gray-400" />
                <span className="font-medium">{party.person_name}</span>
                <span className="text-gray-400">({party.person_type} - {party.role})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Resolution */}
      {incident.resolution && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">Resolution</h4>
          <p className="text-sm text-emerald-800 whitespace-pre-wrap">{incident.resolution}</p>
        </div>
      )}

      {/* Follow-up Timeline */}
      {incident.follow_ups.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Follow-Up Notes</h4>
          <div className="space-y-3">
            {incident.follow_ups.map((fu) => (
              <div key={fu.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2" />
                  <div className="flex-1 w-px bg-gray-200" />
                </div>
                <div className="flex-1 rounded-lg bg-white border border-gray-200 p-3">
                  <p className="text-sm text-gray-700">{fu.note}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {fu.author_name} &middot; {new Date(fu.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Follow-Up */}
      {incident.status !== 'closed' && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a follow-up note..."
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={handleFollowUp}
            disabled={!followUpText.trim() || addFollowUp.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
            Add
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
        {/* Status progression */}
        {incident.status === 'open' && (
          <button
            onClick={() => handleStatusChange('investigating')}
            className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            Start Investigation
          </button>
        )}
        {(incident.status === 'open' || incident.status === 'investigating') && (
          <button
            onClick={onResolve}
            className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Resolve
            </span>
          </button>
        )}
        {incident.status === 'resolved' && (
          <button
            onClick={() => handleStatusChange('closed')}
            className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Incident
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onDelete}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ─── Create Incident Modal ───────────────────────────────────

function IncidentFormModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const createIncident = useCreateIncident()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [incidentType, setIncidentType] = useState('other')
  const [severity, setSeverity] = useState('medium')
  const [location, setLocation] = useState('')
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [actionsTaken, setActionsTaken] = useState('')
  const [parties, setParties] = useState<IncidentParty[]>([])

  // Party editor state
  const [partyName, setPartyName] = useState('')
  const [partyType, setPartyType] = useState<'camper' | 'staff'>('camper')
  const [partyRole, setPartyRole] = useState<'involved' | 'witness' | 'reporter'>('involved')

  const addParty = () => {
    if (!partyName.trim()) return
    setParties([
      ...parties,
      {
        person_type: partyType,
        person_id: crypto.randomUUID(),
        person_name: partyName.trim(),
        role: partyRole,
      },
    ])
    setPartyName('')
  }

  const removeParty = (idx: number) => {
    setParties(parties.filter((_, i) => i !== idx))
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ type: 'error', message: 'Title is required' })
      return
    }
    createIncident.mutate(
      {
        title: title.trim(),
        description,
        incident_type: incidentType,
        severity,
        location,
        date_time: new Date(dateTime).toISOString(),
        actions_taken: actionsTaken,
        involved_parties: parties,
        attachments: [],
      },
      {
        onSuccess: () => {
          toast({ type: 'success', message: 'Incident reported successfully' })
          onClose()
        },
        onError: () => toast({ type: 'error', message: 'Failed to create incident' }),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh]">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Report Incident</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the incident"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed description of what happened..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type + Severity row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location + Date/Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Main field, Cabin 3, Pool area"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Actions Taken */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actions Taken</label>
            <textarea
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              rows={2}
              placeholder="What immediate actions were taken..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Involved Parties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Involved Parties</label>
            {parties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {parties.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs"
                  >
                    <span className="font-medium">{p.person_name}</span>
                    <span className="text-gray-400">({p.person_type} - {p.role})</span>
                    <button onClick={() => removeParty(idx)} className="text-gray-400 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addParty()}
                placeholder="Person name"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={partyType}
                onChange={(e) => setPartyType(e.target.value as 'camper' | 'staff')}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="camper">Camper</option>
                <option value="staff">Staff</option>
              </select>
              <select
                value={partyRole}
                onChange={(e) => setPartyRole(e.target.value as 'involved' | 'witness' | 'reporter')}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="involved">Involved</option>
                <option value="witness">Witness</option>
                <option value="reporter">Reporter</option>
              </select>
              <button
                onClick={addParty}
                disabled={!partyName.trim()}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Attachments placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
              File upload coming soon
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createIncident.isPending || !title.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createIncident.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Report
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Resolve Modal ───────────────────────────────────────────

function ResolveModal({
  incidentId,
  onClose,
}: {
  incidentId: string
  onClose: () => void
}) {
  const { toast } = useToast()
  const resolveIncident = useResolveIncident()
  const [resolution, setResolution] = useState('')

  const handleResolve = () => {
    if (!resolution.trim()) {
      toast({ type: 'error', message: 'Resolution description is required' })
      return
    }
    resolveIncident.mutate(
      { id: incidentId, resolution: resolution.trim() },
      {
        onSuccess: () => {
          toast({ type: 'success', message: 'Incident resolved' })
          onClose()
        },
        onError: () => toast({ type: 'error', message: 'Failed to resolve incident' }),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Resolve Incident</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resolution Description *
          </label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={4}
            placeholder="Describe how this incident was resolved..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={resolveIncident.isPending || !resolution.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resolveIncident.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <CheckCircle2 className="h-4 w-4" />
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  )
}
