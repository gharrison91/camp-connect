/**
 * Camp Connect - Audit Log Page
 * Full-featured audit log viewer with filters, stats, and pagination.
 */

import { useState } from 'react'
import {
  Shield,
  Activity,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  Trash2,
  Edit,
  LogIn,
  LogOut,
  Download,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useAuditLogs, useAuditLogStats } from '@/hooks/useAuditLogs'

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'export', label: 'Export' },
  { value: 'view', label: 'View' },
  { value: 'send', label: 'Send' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
]

const RESOURCE_TYPE_OPTIONS = [
  { value: '', label: 'All Resources' },
  { value: 'camper', label: 'Camper' },
  { value: 'event', label: 'Event' },
  { value: 'contact', label: 'Contact' },
  { value: 'registration', label: 'Registration' },
  { value: 'payment', label: 'Payment' },
  { value: 'staff', label: 'Staff' },
  { value: 'communication', label: 'Communication' },
  { value: 'photo', label: 'Photo' },
  { value: 'form', label: 'Form' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'report', label: 'Report' },
  { value: 'settings', label: 'Settings' },
  { value: 'user', label: 'User' },
]

const PER_PAGE_OPTIONS = [10, 25, 50, 100]

function getActionBadgeClasses(action: string): string {
  switch (action) {
    case 'create':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'update':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'delete':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'login':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'logout':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'export':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'view':
      return 'bg-sky-100 text-sky-700 border-sky-200'
    case 'send':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    case 'approve':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'reject':
      return 'bg-rose-100 text-rose-700 border-rose-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case 'create':
      return <FileText className="h-3.5 w-3.5" />
    case 'update':
      return <Edit className="h-3.5 w-3.5" />
    case 'delete':
      return <Trash2 className="h-3.5 w-3.5" />
    case 'login':
      return <LogIn className="h-3.5 w-3.5" />
    case 'logout':
      return <LogOut className="h-3.5 w-3.5" />
    case 'export':
      return <Download className="h-3.5 w-3.5" />
    case 'view':
      return <Eye className="h-3.5 w-3.5" />
    case 'send':
      return <Send className="h-3.5 w-3.5" />
    case 'approve':
      return <CheckCircle className="h-3.5 w-3.5" />
    case 'reject':
      return <XCircle className="h-3.5 w-3.5" />
    default:
      return <Activity className="h-3.5 w-3.5" />
  }
}

function getStatIcon(action: string) {
  switch (action) {
    case 'create':
      return <FileText className="h-5 w-5 text-green-600" />
    case 'update':
      return <Edit className="h-5 w-5 text-blue-600" />
    case 'delete':
      return <Trash2 className="h-5 w-5 text-red-600" />
    case 'login':
      return <LogIn className="h-5 w-5 text-purple-600" />
    case 'logout':
      return <LogOut className="h-5 w-5 text-gray-600" />
    case 'export':
      return <Download className="h-5 w-5 text-amber-600" />
    case 'view':
      return <Eye className="h-5 w-5 text-sky-600" />
    case 'send':
      return <Send className="h-5 w-5 text-cyan-600" />
    case 'approve':
      return <CheckCircle className="h-5 w-5 text-emerald-600" />
    case 'reject':
      return <XCircle className="h-5 w-5 text-rose-600" />
    default:
      return <Activity className="h-5 w-5 text-gray-600" />
  }
}

function getStatBg(action: string): string {
  switch (action) {
    case 'create':
      return 'bg-green-50'
    case 'update':
      return 'bg-blue-50'
    case 'delete':
      return 'bg-red-50'
    case 'login':
      return 'bg-purple-50'
    case 'logout':
      return 'bg-gray-50'
    case 'export':
      return 'bg-amber-50'
    case 'view':
      return 'bg-sky-50'
    case 'send':
      return 'bg-cyan-50'
    case 'approve':
      return 'bg-emerald-50'
    case 'reject':
      return 'bg-rose-50'
    default:
      return 'bg-gray-50'
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [actionFilter, setActionFilter] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data: logsData, isLoading } = useAuditLogs({
    page,
    per_page: perPage,
    action: actionFilter || undefined,
    resource_type: resourceTypeFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    search: searchText || undefined,
  })

  const { data: statsData } = useAuditLogStats()

  const items = logsData?.items ?? []
  const total = logsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const handleSearch = () => {
    setSearchText(searchInput)
    setPage(1)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClearFilters = () => {
    setActionFilter('')
    setResourceTypeFilter('')
    setDateFrom('')
    setDateTo('')
    setSearchText('')
    setSearchInput('')
    setPage(1)
  }

  const hasFilters = actionFilter || resourceTypeFilter || dateFrom || dateTo || searchText

  // Build page number buttons
  const pageButtons: number[] = []
  const maxButtons = 5
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2))
  const endPage = Math.min(totalPages, startPage + maxButtons - 1)
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1)
  }
  for (let i = startPage; i <= endPage; i++) {
    pageButtons.push(i)
  }

  // Default stats to show even if no data
  const defaultStatActions = ['create', 'update', 'delete', 'login']
  const statCards = defaultStatActions.map((action) => {
    const stat = statsData?.find((s) => s.action === action)
    return {
      action,
      count: stat?.count ?? 0,
      label: action.charAt(0).toUpperCase() + action.slice(1) + 's',
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500">
              Track all user actions across your organization
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.action}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getStatBg(stat.action)}`}>
                {getStatIcon(stat.action)}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">Last 30 days</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          {/* Action dropdown */}
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Resource type dropdown */}
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">Resource Type</label>
            <select
              value={resourceTypeFilter}
              onChange={(e) => { setResourceTypeFilter(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {RESOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Date to */}
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Search */}
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Search
          </button>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasFilters
                ? 'Try adjusting your filters to find what you are looking for.'
                : 'Audit log entries will appear here as users take actions.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Timestamp
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Resource Type
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Resource Name
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Details
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {formatTimestamp(entry.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                            <Users className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {entry.user_name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getActionBadgeClasses(entry.action)}`}
                        >
                          {getActionIcon(entry.action)}
                          {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {entry.resource_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                        {entry.resource_name || <span className="text-gray-400">--</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[250px] truncate">
                        {entry.details || <span className="text-gray-400">--</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 font-mono">
                        {entry.ip_address || <span className="text-gray-400">--</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Showing {Math.min((page - 1) * perPage + 1, total)} to{' '}
                  {Math.min(page * perPage, total)} of {total} entries
                </span>
                <span className="text-gray-300">|</span>
                <label className="flex items-center gap-1">
                  <span>Per page:</span>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value))
                      setPage(1)
                    }}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {PER_PAGE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageButtons.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                      p === page
                        ? 'bg-emerald-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
