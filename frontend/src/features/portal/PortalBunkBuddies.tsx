/**
 * Camp Connect - PortalBunkBuddies
 * Parent-facing page to view and submit bunk buddy requests.
 * Shows request limits, existing requests with status, and a submission form.
 */

import { useState } from 'react'
import { Users, Plus, Trash2, Loader2, CheckCircle2, XCircle, Clock, Heart } from 'lucide-react'
import { usePortalCampers } from '@/hooks/usePortal'
import { useEvents } from '@/hooks/useEvents'
import {
  usePortalBuddyRequests,
  useSubmitBuddyRequest,
  useCancelPortalBuddyRequest,
} from '@/hooks/useBunkBuddies'
import { useToast } from '@/components/ui/Toast'
import type { PortalBuddyRequest } from '@/types'

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50', icon: Clock },
  approved: { label: 'Approved', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  denied: { label: 'Denied', color: 'text-red-600 bg-red-50', icon: XCircle },
}

export function PortalBunkBuddies() {
  const { toast } = useToast()
  const { data: campers = [] } = usePortalCampers()
  const { data: events = [] } = useEvents()
  const { data, isLoading } = usePortalBuddyRequests()
  const submitRequest = useSubmitBuddyRequest()
  const cancelRequest = useCancelPortalBuddyRequest()

  const [showForm, setShowForm] = useState(false)
  const [selectedCamperId, setSelectedCamperId] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [buddyName, setBuddyName] = useState('')

  const requests = data?.requests ?? []
  const settings = data?.settings ?? { max_requests_per_camper: 3, request_deadline: null, allow_portal_requests: true }
  const camperCounts = data?.camper_request_counts ?? {}

  const selectedCamperCount = selectedCamperId ? (camperCounts[selectedCamperId] ?? 0) : 0
  const remaining = settings.max_requests_per_camper - selectedCamperCount
  const isDeadlinePassed = settings.request_deadline
    ? new Date() > new Date(settings.request_deadline + 'T23:59:59')
    : false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCamperId || !selectedEventId || !buddyName.trim()) return

    try {
      await submitRequest.mutateAsync({
        event_id: selectedEventId,
        requester_camper_id: selectedCamperId,
        requested_camper_name: buddyName.trim(),
      })
      toast({ type: 'success', message: 'Buddy request submitted!' })
      setBuddyName('')
      setShowForm(false)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to submit buddy request.'
      toast({ type: 'error', message: msg })
    }
  }

  async function handleCancel(requestId: string) {
    try {
      await cancelRequest.mutateAsync(requestId)
      toast({ type: 'success', message: 'Request cancelled.' })
    } catch {
      toast({ type: 'error', message: 'Failed to cancel request.' })
    }
  }

  function renderStatusBadge(status: string) {
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bunk Buddy Requests</h2>
          <p className="mt-1 text-sm text-gray-500">
            Request bunkmates for your campers. Each camper can make up to{' '}
            {settings.max_requests_per_camper} request{settings.max_requests_per_camper !== 1 ? 's' : ''}.
          </p>
        </div>
        {settings.allow_portal_requests && !isDeadlinePassed && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        )}
      </div>

      {/* Deadline notice */}
      {settings.request_deadline && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${isDeadlinePassed ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
          {isDeadlinePassed
            ? `The deadline for buddy requests was ${new Date(settings.request_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
            : `Buddy requests are due by ${new Date(settings.request_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
          }
        </div>
      )}

      {!settings.allow_portal_requests && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Bunk buddy requests are currently not being accepted. Please check back later.
        </div>
      )}

      {/* New request form */}
      {showForm && settings.allow_portal_requests && !isDeadlinePassed && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Submit a Buddy Request</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Camper</label>
              <select
                value={selectedCamperId}
                onChange={(e) => setSelectedCamperId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select camper...</option>
                {campers.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select session...</option>
                {events.map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requested Buddy Name
            </label>
            <input
              type="text"
              value={buddyName}
              onChange={(e) => setBuddyName(e.target.value)}
              required
              placeholder="Enter the camper's full name..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the full name of the camper your child wants to bunk with.
            </p>
          </div>

          {/* Remaining requests indicator */}
          {selectedCamperId && (
            <div className={`rounded-lg px-3 py-2 text-sm ${remaining > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {remaining > 0
                ? `${remaining} of ${settings.max_requests_per_camper} request${settings.max_requests_per_camper !== 1 ? 's' : ''} remaining for this camper.`
                : 'This camper has reached the maximum number of buddy requests.'
              }
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitRequest.isPending || remaining <= 0}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {submitRequest.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Requests list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No buddy requests yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Submit a request to let us know who your camper wants to bunk with.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: PortalBuddyRequest) => {
            return (
              <div
                key={req.id}
                className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {req.requester_name}
                      </span>
                      <span className="text-gray-400">&rarr;</span>
                      <span className="text-sm font-medium text-gray-700">
                        {req.requested_name}
                      </span>
                      {req.is_mutual && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-600">
                          <Heart className="h-3 w-3" />
                          Mutual
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                      {req.event_name && <span>{req.event_name}</span>}
                      <span>Submitted {new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {renderStatusBadge(req.status)}
                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        disabled={cancelRequest.isPending}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Cancel request"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
