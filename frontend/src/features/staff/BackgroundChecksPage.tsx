import { useState } from 'react'
import {
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Settings,
  Eye,
  X,
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
} from 'lucide-react'
import {
  useBackgroundChecks,
  useCreateBackgroundCheck,
  useRefreshBackgroundCheck,
  useBackgroundCheckSettings,
  useUpdateBackgroundCheckSettings,
} from '@/hooks/useBackgroundChecks'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BackgroundCheck, StaffMember } from '@/types'

// ─── Status / Result Badge Helpers ──────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Loader2 },
  complete: { label: 'Complete', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  flagged: { label: 'Flagged', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
}

const resultConfig: Record<string, { label: string; color: string }> = {
  clear: { label: 'Clear', color: 'bg-green-100 text-green-700 border-green-200' },
  consider: { label: 'Consider', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200' },
}

const packageConfig: Record<string, { label: string; price: string; description: string }> = {
  basic: { label: 'Basic', price: '$29', description: 'SSN trace, sex offender search, national criminal search' },
  standard: { label: 'Standard', price: '$49', description: 'Basic + county criminal, address history, employment verification' },
  professional: { label: 'Professional', price: '$89', description: 'Standard + education verification, motor vehicle report, credit check' },
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  )
}

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-xs text-slate-400">--</span>
  const config = resultConfig[result] || { label: result, color: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

// ─── Run Check Modal ────────────────────────────────────────

function RunCheckModal({
  isOpen,
  onClose,
  staffMembers,
}: {
  isOpen: boolean
  onClose: () => void
  staffMembers: StaffMember[]
}) {
  const [selectedStaff, setSelectedStaff] = useState('')
  const [selectedPackage, setSelectedPackage] = useState('basic')
  const [notes, setNotes] = useState('')
  const [staffSearch, setStaffSearch] = useState('')
  const createCheck = useCreateBackgroundCheck()

  const filteredStaff = staffMembers.filter((s) => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    return name.includes(staffSearch.toLowerCase()) || (s.email?.toLowerCase().includes(staffSearch.toLowerCase()))
  })

  const handleSubmit = () => {
    if (!selectedStaff) return
    createCheck.mutate(
      { staff_user_id: selectedStaff, package: selectedPackage, notes: notes || undefined },
      {
        onSuccess: () => {
          onClose()
          setSelectedStaff('')
          setSelectedPackage('basic')
          setNotes('')
          setStaffSearch('')
        },
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Run Background Check</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Staff selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Staff Member</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {staffSearch && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                {filteredStaff.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-slate-500">No staff found</p>
                ) : (
                  filteredStaff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStaff(s.id)
                        setStaffSearch(`${s.first_name} ${s.last_name}`)
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        selectedStaff === s.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Package selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Package</label>
            <div className="space-y-2">
              {Object.entries(packageConfig).map(([key, pkg]) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    selectedPackage === key
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={key}
                    checked={selectedPackage === key}
                    onChange={() => setSelectedPackage(key)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">{pkg.label}</span>
                      <span className="text-sm font-semibold text-emerald-600">{pkg.price}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{pkg.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedStaff || createCheck.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {createCheck.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Run Check
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Panel ───────────────────────────────────────────

function DetailPanel({
  check,
  onClose,
  onRefresh,
  isRefreshing,
}: {
  check: BackgroundCheck
  onClose: () => void
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const isExpiringSoon =
    check.expires_at &&
    new Date(check.expires_at).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Background Check Details</h2>
            <p className="text-sm text-slate-500">{check.staff_name || 'Unknown Staff'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {/* Status & Result Row */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <StatusBadge status={check.status} />
            <ResultBadge result={check.result} />
            {isExpiringSoon && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                <AlertTriangle className="h-3 w-3" />
                Expiring soon
              </span>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Provider</p>
              <p className="mt-0.5 text-sm font-medium capitalize text-slate-900">{check.provider}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Package</p>
              <p className="mt-0.5 text-sm font-medium capitalize text-slate-900">
                {packageConfig[check.package]?.label || check.package}
                <span className="ml-1 text-slate-500">({packageConfig[check.package]?.price || '--'})</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">External ID</p>
              <p className="mt-0.5 font-mono text-xs text-slate-600">{check.external_id || '--'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Initiated</p>
              <p className="mt-0.5 text-sm text-slate-900">
                {new Date(check.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {check.completed_at && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Completed</p>
                <p className="mt-0.5 text-sm text-slate-900">
                  {new Date(check.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
            {check.expires_at && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Expires</p>
                <p className={`mt-0.5 text-sm ${isExpiringSoon ? 'font-medium text-orange-600' : 'text-slate-900'}`}>
                  {new Date(check.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {check.notes && (
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Notes</p>
              <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{check.notes}</p>
            </div>
          )}

          {/* Timeline / Details */}
          {check.details && Object.keys(check.details).length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Provider Details</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                {Object.entries(check.details).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between border-b border-slate-200 py-2 last:border-0">
                    <span className="text-xs font-medium text-slate-500">{key.replace(/_/g, ' ')}</span>
                    <span className="ml-4 text-right text-xs text-slate-700">
                      {Array.isArray(value) ? (value as string[]).join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Link */}
          {check.report_url && (
            <div className="mt-6">
              <a
                href={check.report_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
              >
                <ExternalLink className="h-4 w-4" />
                View Full Report on Checkr
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            onClick={onRefresh}
            disabled={isRefreshing || check.status === 'complete' || check.status === 'failed'}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Settings Panel ─────────────────────────────────────────

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { data: settings } = useBackgroundCheckSettings()
  const updateSettings = useUpdateBackgroundCheckSettings()
  const [apiKey, setApiKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState(settings?.webhook_url || '')

  const handleSave = () => {
    updateSettings.mutate(
      {
        api_key: apiKey || undefined,
        webhook_url: webhookUrl || undefined,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Checkr Integration Settings</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Checkr API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings?.api_key_configured ? `••••••••${settings.api_key_last4}` : 'Enter your Checkr API key'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {settings?.api_key_configured && (
              <p className="mt-1 text-xs text-emerald-600">API key is configured</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-api.com/webhooks/checkr"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Checkr will send status updates to this URL
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              To get your API key, sign up at{' '}
              <a href="https://checkr.com" target="_blank" rel="noopener noreferrer" className="font-medium underline">
                checkr.com
              </a>{' '}
              and navigate to Account Settings &gt; Developer Settings.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────

export function BackgroundChecksPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [showRunModal, setShowRunModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedCheck, setSelectedCheck] = useState<BackgroundCheck | null>(null)

  const { data, isLoading } = useBackgroundChecks(statusFilter || undefined)
  const refreshCheck = useRefreshBackgroundCheck()

  // Fetch staff list for the run-check modal
  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await api.get('/staff')
      return res.data as { items: StaffMember[]; total: number }
    },
  })

  const checks = data?.items || []
  const staffMembers = staffData?.items || []

  // Client-side search filter (server also supports it, but local is snappier for loaded data)
  const filteredChecks = search
    ? checks.filter((c) => c.staff_name?.toLowerCase().includes(search.toLowerCase()))
    : checks

  const statuses = ['', 'pending', 'processing', 'complete', 'failed', 'flagged']

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Background Checks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage staff background screening via Checkr integration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => setShowRunModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Run Check
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            {statuses.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {statusConfig[s]?.label || s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: data?.total || 0, color: 'text-slate-900' },
          { label: 'Processing', value: checks.filter((c) => c.status === 'processing').length, color: 'text-blue-600' },
          { label: 'Clear', value: checks.filter((c) => c.result === 'clear').length, color: 'text-emerald-600' },
          { label: 'Flagged', value: checks.filter((c) => c.status === 'flagged' || c.result === 'consider').length, color: 'text-orange-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : filteredChecks.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-sm font-medium text-slate-900">No background checks</h3>
            <p className="mt-1 text-sm text-slate-500">
              {search || statusFilter
                ? 'No checks match your filters.'
                : 'Run your first background check to get started.'}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => setShowRunModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Run Check
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Staff Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Package
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChecks.map((check) => (
                  <tr key={check.id} className="hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                          {check.staff_name
                            ? check.staff_name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                            : '??'}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{check.staff_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-sm capitalize text-slate-700">{packageConfig[check.package]?.label || check.package}</span>
                      <span className="ml-1 text-xs text-slate-400">{packageConfig[check.package]?.price}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={check.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <ResultBadge result={check.result} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                      {new Date(check.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCheck(check)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(check.status === 'pending' || check.status === 'processing') && (
                          <button
                            onClick={() =>
                              refreshCheck.mutate(check.id)
                            }
                            disabled={refreshCheck.isPending}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            title="Refresh status"
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshCheck.isPending ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        {check.report_url && (
                          <a
                            href={check.report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                            title="View report"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RunCheckModal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        staffMembers={staffMembers}
      />

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {selectedCheck && (
        <DetailPanel
          check={selectedCheck}
          onClose={() => setSelectedCheck(null)}
          onRefresh={() => refreshCheck.mutate(selectedCheck.id)}
          isRefreshing={refreshCheck.isPending}
        />
      )}
    </div>
  )
}
