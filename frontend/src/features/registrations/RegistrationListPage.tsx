import { useState } from 'react'
import {
  Search,
  Loader2,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRegistrations, useCancelRegistration } from '@/hooks/useRegistrations'
import { usePermissions } from '@/hooks/usePermissions'
import type { Registration } from '@/types'

const statusConfig: Record<
  Registration['status'],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    icon: Clock,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-50 text-gray-500 ring-gray-400/20',
    icon: XCircle,
  },
  waitlisted: {
    label: 'Waitlisted',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    icon: AlertCircle,
  },
}

const paymentStatusConfig: Record<
  Registration['payment_status'],
  { label: string; className: string }
> = {
  unpaid: {
    label: 'Unpaid',
    className: 'bg-red-50 text-red-600 ring-red-500/20',
  },
  deposit_paid: {
    label: 'Deposit Paid',
    className: 'bg-amber-50 text-amber-600 ring-amber-500/20',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-gray-50 text-gray-500 ring-gray-400/20',
  },
}

export function RegistrationListPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { hasPermission } = usePermissions()
  const cancelRegistration = useCancelRegistration()

  const { data: registrations = [], isLoading, error } = useRegistrations({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const handleCancel = async (id: string) => {
    try {
      await cancelRegistration.mutateAsync(id)
    } catch {
      // Error handled by mutation state
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Registrations
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="waitlisted">Waitlisted</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load registrations. Please try again.
        </div>
      )}

      {/* Registrations Table */}
      {!isLoading && !error && registrations.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Camper</th>
                  <th className="px-6 py-3">Event</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Payment</th>
                  <th className="hidden px-6 py-3 md:table-cell">
                    Registered
                  </th>
                  {hasPermission('core.registrations.cancel') && (
                    <th className="px-6 py-3">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {registrations.map((reg) => {
                  const status = statusConfig[reg.status]
                  const payment = paymentStatusConfig[reg.payment_status]
                  const StatusIcon = status.icon

                  return (
                    <tr
                      key={reg.id}
                      className="transition-colors hover:bg-gray-50/80"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {reg.camper_name || '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {reg.event_name || '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                            status.className
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                            payment.className
                          )}
                        >
                          {payment.label}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 md:table-cell">
                        {formatDate(reg.created_at)}
                      </td>
                      {hasPermission('core.registrations.cancel') && (
                        <td className="whitespace-nowrap px-6 py-4">
                          {reg.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancel(reg.id)}
                              disabled={cancelRegistration.isPending}
                              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && registrations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Search className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No registrations found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter !== 'all'
              ? 'Try adjusting your filter criteria.'
              : 'Register a camper for an event to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}
