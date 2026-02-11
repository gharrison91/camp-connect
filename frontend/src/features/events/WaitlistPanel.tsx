/**
 * Camp Connect - WaitlistPanel
 * Full waitlist management panel with drag-to-reorder, offer/accept/decline
 * workflow, priority badges, expiry timers, and add-to-waitlist modal.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Clock,
  GripVertical,
  Loader2,
  Plus,
  Send,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Star,
  Crown,
  AlertTriangle,
  X,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useWaitlist,
  useAddToWaitlist,
  useOfferSpot,
  useAcceptSpot,
  useDeclineSpot,
  useRemoveFromWaitlist,
  useReorderWaitlist,
} from '@/hooks/useWaitlist'
import { useCampers } from '@/hooks/useCampers'
import type { WaitlistEntry } from '@/types'

// ---------------------------------------------------------------------------
// Status + Priority Config
// ---------------------------------------------------------------------------

const statusConfig: Record<
  WaitlistEntry['status'],
  { label: string; className: string }
> = {
  waiting: {
    label: 'Waiting',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  offered: {
    label: 'Offered',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  declined: {
    label: 'Declined',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  expired: {
    label: 'Expired',
    className: 'bg-gray-50 text-gray-500 ring-gray-400/20',
  },
}

const priorityConfig: Record<
  WaitlistEntry['priority'],
  { label: string; className: string; icon: typeof Star }
> = {
  normal: {
    label: 'Normal',
    className: 'bg-gray-50 text-gray-600 ring-gray-500/20',
    icon: Users,
  },
  high: {
    label: 'High',
    className: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    icon: Star,
  },
  vip: {
    label: 'VIP',
    className: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    icon: Crown,
  },
}

// ---------------------------------------------------------------------------
// Expiry Timer Hook
// ---------------------------------------------------------------------------

function useExpiryTimer(expiresAt: string | null) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('')
      return
    }

    const update = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    update()
    const interval = setInterval(update, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [expiresAt])

  return timeLeft
}

// ---------------------------------------------------------------------------
// Expiry Badge Sub-component
// ---------------------------------------------------------------------------

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  const timeLeft = useExpiryTimer(expiresAt)

  if (!timeLeft) return null

  const isExpired = timeLeft === 'Expired'
  const isUrgent =
    !isExpired && expiresAt
      ? new Date(expiresAt).getTime() - Date.now() < 4 * 60 * 60 * 1000
      : false

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isExpired
          ? 'bg-red-50 text-red-600'
          : isUrgent
            ? 'bg-amber-50 text-amber-600'
            : 'bg-blue-50 text-blue-600'
      )}
    >
      <Clock className="h-3 w-3" />
      {timeLeft}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Add to Waitlist Modal
// ---------------------------------------------------------------------------

function AddToWaitlistModal({
  eventId,
  onClose,
}: {
  eventId: string
  onClose: () => void
}) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [selectedCamperId, setSelectedCamperId] = useState('')
  const [priority, setPriority] = useState<'normal' | 'high' | 'vip'>('normal')
  const [notes, setNotes] = useState('')

  const { data: camperData, isLoading: campersLoading } = useCampers({
    search: search || undefined,
    limit: 20,
  })
  const campers = camperData?.items ?? []

  const addMutation = useAddToWaitlist()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCamperId) {
      toast({ type: 'warning', message: 'Please select a camper' })
      return
    }

    try {
      await addMutation.mutateAsync({
        event_id: eventId,
        camper_id: selectedCamperId,
        priority,
        notes: notes || undefined,
      })
      toast({ type: 'success', message: 'Added to waitlist' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to add to waitlist' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Add to Waitlist
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Camper Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Camper
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSelectedCamperId('')
                }}
                placeholder="Search campers..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {search && !selectedCamperId && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                {campersLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                {!campersLoading && campers.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    No campers found
                  </p>
                )}
                {campers.map((camper) => (
                  <button
                    key={camper.id}
                    type="button"
                    onClick={() => {
                      setSelectedCamperId(camper.id)
                      setSearch(
                        `${camper.first_name} ${camper.last_name}`
                      )
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                  >
                    {camper.first_name} {camper.last_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <div className="mt-1 flex gap-2">
              {(['normal', 'high', 'vip'] as const).map((p) => {
                const config = priorityConfig[p]
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      priority === p
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending || !selectedCamperId}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {addMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Add to Waitlist
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Waitlist Row
// ---------------------------------------------------------------------------

function WaitlistRow({
  entry,
  onOffer,
  onAccept,
  onDecline,
  onRemove,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  entry: WaitlistEntry
  onOffer: (id: string) => void
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  onRemove: (id: string) => void
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetId: string) => void
}) {
  const st = statusConfig[entry.status]
  const pr = priorityConfig[entry.priority]
  const PriorityIcon = pr.icon

  return (
    <tr
      draggable={entry.status === 'waiting'}
      onDragStart={(e) => onDragStart(e, entry.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, entry.id)}
      className={cn(
        'group transition-colors hover:bg-gray-50/80',
        isDragging && 'opacity-50',
        entry.status === 'waiting' && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {/* Drag Handle + Position */}
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-2">
          {entry.status === 'waiting' && (
            <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100" />
          )}
          <span className="text-sm font-semibold text-gray-900">
            #{entry.position}
          </span>
        </div>
      </td>

      {/* Camper */}
      <td className="whitespace-nowrap px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {entry.camper_name ?? 'Unknown'}
          </p>
          {entry.contact_name && (
            <p className="text-xs text-gray-500">{entry.contact_name}</p>
          )}
        </div>
      </td>

      {/* Priority */}
      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            pr.className
          )}
        >
          <PriorityIcon className="h-3 w-3" />
          {pr.label}
        </span>
      </td>

      {/* Status */}
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
              st.className
            )}
          >
            {st.label}
          </span>
          {entry.status === 'offered' && (
            <ExpiryBadge expiresAt={entry.expires_at} />
          )}
        </div>
      </td>

      {/* Added Date */}
      <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
        <span className="text-sm text-gray-600">
          {new Date(entry.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </td>

      {/* Actions */}
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-1">
          {entry.status === 'waiting' && (
            <button
              onClick={() => onOffer(entry.id)}
              title="Offer Spot"
              className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
          {entry.status === 'offered' && (
            <>
              <button
                onClick={() => onAccept(entry.id)}
                title="Accept"
                className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDecline(entry.id)}
                title="Decline"
                className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          {['waiting', 'declined', 'expired'].includes(entry.status) && (
            <button
              onClick={() => onRemove(entry.id)}
              title="Remove"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main WaitlistPanel
// ---------------------------------------------------------------------------

export function WaitlistPanel({ eventId }: { eventId: string }) {
  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)

  const { data: waitlist = [], isLoading } = useWaitlist(eventId)
  const offerMutation = useOfferSpot()
  const acceptMutation = useAcceptSpot()
  const declineMutation = useDeclineSpot()
  const removeMutation = useRemoveFromWaitlist()
  const reorderMutation = useReorderWaitlist()

  // Stats
  const waitingCount = waitlist.filter((e) => e.status === 'waiting').length
  const offeredCount = waitlist.filter((e) => e.status === 'offered').length
  const acceptedCount = waitlist.filter((e) => e.status === 'accepted').length

  // Handlers
  const handleOffer = useCallback(
    async (id: string) => {
      try {
        await offerMutation.mutateAsync({ id })
        toast({ type: 'success', message: 'Spot offered successfully' })
      } catch {
        toast({ type: 'error', message: 'Failed to offer spot' })
      }
    },
    [offerMutation, toast]
  )

  const handleAccept = useCallback(
    async (id: string) => {
      try {
        await acceptMutation.mutateAsync(id)
        toast({ type: 'success', message: 'Spot accepted' })
      } catch {
        toast({ type: 'error', message: 'Failed to accept spot' })
      }
    },
    [acceptMutation, toast]
  )

  const handleDecline = useCallback(
    async (id: string) => {
      try {
        await declineMutation.mutateAsync(id)
        toast({
          type: 'info',
          message: 'Spot declined. Next in queue has been offered.',
        })
      } catch {
        toast({ type: 'error', message: 'Failed to decline spot' })
      }
    },
    [declineMutation, toast]
  )

  const handleRemove = useCallback(
    async (id: string) => {
      try {
        await removeMutation.mutateAsync(id)
        toast({ type: 'success', message: 'Removed from waitlist' })
      } catch {
        toast({ type: 'error', message: 'Failed to remove from waitlist' })
      }
    },
    [removeMutation, toast]
  )

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      setDragId(id)
      e.dataTransfer.effectAllowed = 'move'
    },
    []
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (!dragId || dragId === targetId) {
        setDragId(null)
        return
      }

      // Only reorder "waiting" entries
      const waitingEntries = waitlist.filter((e) => e.status === 'waiting')
      const dragIndex = waitingEntries.findIndex((e) => e.id === dragId)
      const targetIndex = waitingEntries.findIndex((e) => e.id === targetId)

      if (dragIndex === -1 || targetIndex === -1) {
        setDragId(null)
        return
      }

      // Build new order
      const reordered = [...waitingEntries]
      const [moved] = reordered.splice(dragIndex, 1)
      reordered.splice(targetIndex, 0, moved)

      const items = reordered.map((entry, idx) => ({
        id: entry.id,
        position: idx + 1,
      }))

      try {
        await reorderMutation.mutateAsync(items)
        toast({ type: 'success', message: 'Waitlist reordered' })
      } catch {
        toast({ type: 'error', message: 'Failed to reorder waitlist' })
      }
      setDragId(null)
    },
    [dragId, waitlist, reorderMutation, toast]
  )

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Waiting</p>
              <p className="text-lg font-semibold text-gray-900">
                {waitingCount}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Send className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Offered</p>
              <p className="text-lg font-semibold text-gray-900">
                {offeredCount}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Accepted</p>
              <p className="text-lg font-semibold text-gray-900">
                {acceptedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add to Waitlist
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && waitlist.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
          <Users className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No one on the waitlist
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Add campers to the waitlist when the event is full.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add to Waitlist
          </button>
        </div>
      )}

      {/* Waitlist Table */}
      {!isLoading && waitlist.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {/* Reorder hint */}
          {waitingCount > 1 && (
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">
                Drag rows to reorder waiting entries
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Pos</th>
                  <th className="px-4 py-3">Camper</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Added</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {waitlist.map((entry) => (
                  <WaitlistRow
                    key={entry.id}
                    entry={entry}
                    onOffer={handleOffer}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onRemove={handleRemove}
                    isDragging={dragId === entry.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddToWaitlistModal
          eventId={eventId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
