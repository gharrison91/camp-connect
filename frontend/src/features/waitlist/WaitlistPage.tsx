/**
 * Camp Connect - Waitlist Management Page
 */

import { useState, useMemo } from 'react'
import {
  ListOrdered,
  Clock,
  Mail,
  AlertCircle,
  UserCheck,
  Trash2,
  Search,
  TrendingUp,
  Send,
  X,
} from 'lucide-react'
import {
  useWaitlists,
  useOfferSpot,
  useAcceptSpot,
  useRemoveFromWaitlist,
} from '@/hooks/useWaitlist'
import { useToast } from '@/components/ui/Toast'
import type { WaitlistEntry } from '@/types'

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  waiting: { label: 'Waiting', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  offered: { label: 'Offered', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  accepted: { label: 'Promoted', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  declined: { label: 'Declined', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  expired: { label: 'Expired', bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
}

function formatWaitTime(addedAt: string): string {
  const diffMs = Date.now() - new Date(addedAt).getTime()
  const days = Math.floor(diffMs / 86400000)
  const hours = Math.floor((diffMs % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`
  return `${Math.floor(diffMs / 60000)}m`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function WaitlistPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmAction, setConfirmAction] = useState<{ type: 'offer' | 'accept' | 'remove'; entry: WaitlistEntry } | null>(null)

  const { data: entries = [], isLoading } = useWaitlists()
  const offerSpot = useOfferSpot()
  const acceptSpot = useAcceptSpot()
  const removeEntry = useRemoveFromWaitlist()

  const filtered = useMemo(() => {
    let list = entries
    if (statusFilter !== 'all') list = list.filter((e) => e.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          (e.camper_name || '').toLowerCase().includes(q) ||
          (e.event_name || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [entries, statusFilter, search])

  const stats = useMemo(() => {
    const waiting = entries.filter((e) => e.status === 'waiting').length
    const offered = entries.filter((e) => e.status === 'offered').length
    const accepted = entries.filter((e) => e.status === 'accepted').length
    const waitingEntries = entries.filter((e) => e.status === 'waiting')
    const avgMs = waitingEntries.length > 0
      ? waitingEntries.reduce((s, e) => s + (Date.now() - new Date(e.created_at).getTime()), 0) / waitingEntries.length
      : 0
    const avgDays = Math.round(avgMs / 86400000)
    return { total: entries.length, waiting, offered, accepted, avgWait: `${avgDays}d` }
  }, [entries])

  function handleAction() {
    if (!confirmAction) return
    const { type, entry } = confirmAction
    if (type === 'offer') {
      offerSpot.mutate({ id: entry.id }, {
        onSuccess: () => { toast({ type: 'success', message: 'Spot offered successfully' }); setConfirmAction(null) },
        onError: () => toast({ type: 'error', message: 'Failed to offer spot' }),
      })
    } else if (type === 'accept') {
      acceptSpot.mutate(entry.id, {
        onSuccess: () => { toast({ type: 'success', message: 'Camper promoted from waitlist' }); setConfirmAction(null) },
        onError: () => toast({ type: 'error', message: 'Failed to promote camper' }),
      })
    } else {
      removeEntry.mutate(entry.id, {
        onSuccess: () => { toast({ type: 'success', message: 'Removed from waitlist' }); setConfirmAction(null) },
        onError: () => toast({ type: 'error', message: 'Failed to remove entry' }),
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <ListOrdered className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Waitlist Management</h1>
            <p className="text-sm text-gray-500">Manage event waitlists across all programs</p>
          </div>
          {stats.total > 0 && (
            <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              {stats.total} total entries
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total Entries', value: stats.total, icon: ListOrdered, color: 'text-gray-600', bg: 'bg-gray-100' },
          { label: 'Waiting', value: stats.waiting, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Offered', value: stats.offered, icon: Send, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Promoted', value: stats.accepted, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Avg Wait', value: stats.avgWait, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campers or events..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="all">All Statuses</option>
          <option value="waiting">Waiting</option>
          <option value="offered">Offered</option>
          <option value="accepted">Promoted</option>
          <option value="declined">Declined</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ListOrdered className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-lg font-medium text-gray-900">No waitlist entries</h3>
            <p className="mt-1 text-sm text-gray-500">
              {entries.length === 0 ? 'No one is currently waitlisted.' : 'No entries match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Camper</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Event</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Added</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Wait Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Contact</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((entry) => {
                  const cfg = STATUS_CFG[entry.status] || STATUS_CFG.waiting
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{entry.position}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                            {(entry.camper_name || 'U')[0]}
                          </div>
                          <span className="font-medium text-gray-900">{entry.camper_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.event_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{fmtDate(entry.created_at)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatWaitTime(entry.created_at)}</td>
                      <td className="px-4 py-3">
                        {entry.contact_name && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3" /> {entry.contact_name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {entry.status === 'waiting' && (
                            <>
                              <button
                                onClick={() => setConfirmAction({ type: 'offer', entry })}
                                className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                                title="Offer Spot"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: 'accept', entry })}
                                className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                                title="Promote"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {entry.status === 'offered' && (
                            <button
                              onClick={() => setConfirmAction({ type: 'accept', entry })}
                              className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                              title="Accept / Promote"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmAction({ type: 'remove', entry })}
                            className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                            title="Remove"
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
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction.type === 'offer' ? 'Offer Spot' : confirmAction.type === 'accept' ? 'Promote Camper' : 'Remove from Waitlist'}
              </h3>
              <button onClick={() => setConfirmAction(null)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{confirmAction.entry.camper_name}</span>
                {' — '}
                {confirmAction.entry.event_name}
              </p>
            </div>
            {confirmAction.type === 'offer' && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700">The family will receive an email with 48 hours to accept.</p>
              </div>
            )}
            {confirmAction.type === 'remove' && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700">This action cannot be undone.</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={offerSpot.isPending || acceptSpot.isPending || removeEntry.isPending}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  confirmAction.type === 'remove' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {offerSpot.isPending || acceptSpot.isPending || removeEntry.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
