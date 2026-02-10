/**
 * Camp Connect - Buddy Requests Tab
 * Manage bunk buddy requests within the Bunks page.
 */

import { useState } from 'react'
import {
  Heart,
  Plus,
  Check,
  X,
  Trash2,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useBuddyRequests,
  useCreateBuddyRequest,
  useUpdateBuddyRequest,
  useDeleteBuddyRequest,
} from '@/hooks/useBunks'
import { useEvents } from '@/hooks/useEvents'
import { useCampers } from '@/hooks/useCampers'
import { useToast } from '@/components/ui/Toast'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700' },
  denied: { label: 'Denied', color: 'bg-red-50 text-red-700' },
}

export function BuddyRequestsTab() {
  const [eventFilter, setEventFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { data: requests = [], isLoading } = useBuddyRequests(
    eventFilter || undefined,
    statusFilter || undefined
  )
  const { data: events = [] } = useEvents()
  const updateRequest = useUpdateBuddyRequest()
  const deleteRequest = useDeleteBuddyRequest()
  const { toast } = useToast()

  const handleApprove = async (id: string) => {
    try {
      await updateRequest.mutateAsync({ id, data: { status: 'approved' } })
      toast({ type: 'success', message: 'Buddy request approved' })
    } catch {
      toast({ type: 'error', message: 'Failed to approve request' })
    }
  }

  const handleDeny = async (id: string) => {
    try {
      await updateRequest.mutateAsync({ id, data: { status: 'denied' } })
      toast({ type: 'success', message: 'Buddy request denied' })
    } catch {
      toast({ type: 'error', message: 'Failed to deny request' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRequest.mutateAsync(id)
      toast({ type: 'success', message: 'Buddy request deleted' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete request' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters + Create */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All Events</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Heart className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No buddy requests
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Create a buddy request to pair campers together.
          </p>
        </div>
      )}

      {/* Request List */}
      {!isLoading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => {
            const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending
            return (
              <div
                key={req.id}
                className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                {/* Mutual Indicator */}
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    req.is_mutual ? 'bg-pink-50' : 'bg-gray-50'
                  )}
                  title={req.is_mutual ? 'Mutual request!' : 'One-way request'}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      req.is_mutual
                        ? 'fill-pink-500 text-pink-500'
                        : 'text-gray-400'
                    )}
                  />
                </div>

                {/* Camper Names */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">
                      {req.requester_name}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {req.requested_name}
                    </span>
                    {req.is_mutual && (
                      <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-pink-600">
                        Mutual
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                    {req.event_name && <span>{req.event_name}</span>}
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    {req.submitted_by_name && (
                      <span>by {req.submitted_by_name}</span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    statusInfo.color
                  )}
                >
                  {statusInfo.label}
                </span>

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeny(req.id)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      title="Deny"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(req.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <BuddyRequestCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

// --- Create Modal ---

function BuddyRequestCreateModal({ onClose }: { onClose: () => void }) {
  const [eventId, setEventId] = useState('')
  const [requesterId, setRequesterId] = useState('')
  const [requestedId, setRequestedId] = useState('')
  const [requesterSearch, setRequesterSearch] = useState('')
  const [requestedSearch, setRequestedSearch] = useState('')
  const { data: events = [] } = useEvents()
  const { data: campersData } = useCampers({ limit: 500 })
  const campers = campersData?.items ?? []
  const createRequest = useCreateBuddyRequest()
  const { toast } = useToast()

  const filteredRequester = campers.filter(
    (c: { id: string; first_name: string; last_name: string }) =>
      !requesterSearch ||
      `${c.first_name} ${c.last_name}`
        .toLowerCase()
        .includes(requesterSearch.toLowerCase())
  )

  const filteredRequested = campers.filter(
    (c: { id: string; first_name: string; last_name: string }) =>
      c.id !== requesterId &&
      (!requestedSearch ||
        `${c.first_name} ${c.last_name}`
          .toLowerCase()
          .includes(requestedSearch.toLowerCase()))
  )

  const handleCreate = async () => {
    if (!eventId || !requesterId || !requestedId) return
    try {
      await createRequest.mutateAsync({
        event_id: eventId,
        requester_camper_id: requesterId,
        requested_camper_id: requestedId,
      })
      toast({ type: 'success', message: 'Buddy request created' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to create buddy request' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            New Buddy Request
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          {/* Event */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Event
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select event...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>

          {/* Requester */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Requesting Camper
            </label>
            <input
              type="text"
              placeholder="Search campers..."
              value={requesterSearch}
              onChange={(e) => setRequesterSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-1"
            />
            <select
              value={requesterId}
              onChange={(e) => setRequesterId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              size={4}
            >
              {filteredRequester.slice(0, 50).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Requested */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Requested Buddy
            </label>
            <input
              type="text"
              placeholder="Search campers..."
              value={requestedSearch}
              onChange={(e) => setRequestedSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-1"
            />
            <select
              value={requestedId}
              onChange={(e) => setRequestedId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              size={4}
            >
              {filteredRequested.slice(0, 50).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={
              !eventId ||
              !requesterId ||
              !requestedId ||
              createRequest.isPending
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {createRequest.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Create Request
          </button>
        </div>
      </div>
    </div>
  )
}
