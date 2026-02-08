import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Loader2,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEvent } from '@/hooks/useEvents'
import { useRegistrations, useEventWaitlist } from '@/hooks/useRegistrations'
import type { Event, Registration, WaitlistEntry } from '@/types'

type EventStatus = Event['status']

const statusConfig: Record<
  EventStatus,
  { label: string; className: string }
> = {
  published: {
    label: 'Published',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  draft: {
    label: 'Draft',
    className: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  },
  full: {
    label: 'Full',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-50 text-gray-500 ring-gray-400/20',
  },
}

const registrationStatusConfig: Record<
  Registration['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  waitlisted: {
    label: 'Waitlisted',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
}

const paymentStatusConfig: Record<
  Registration['payment_status'],
  { label: string; className: string }
> = {
  unpaid: {
    label: 'Unpaid',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  deposit_paid: {
    label: 'Deposit Paid',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  },
}

const waitlistStatusConfig: Record<
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
  expired: {
    label: 'Expired',
    className: 'bg-gray-50 text-gray-500 ring-gray-400/20',
  },
  enrolled: {
    label: 'Enrolled',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')

  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }

  if (start === end) {
    return startDate.toLocaleDateString('en-US', opts)
  }

  return `${startDate.toLocaleDateString('en-US', opts)} - ${endDate.toLocaleDateString('en-US', opts)}`
}

function formatGender(gender: Event['gender_restriction']): string {
  switch (gender) {
    case 'all':
      return 'All Genders'
    case 'male':
      return 'Male'
    case 'female':
      return 'Female'
  }
}

function getCapacityColor(enrolled: number, capacity: number): string {
  if (capacity === 0) return 'bg-gray-300'
  const pct = (enrolled / capacity) * 100
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getCapacityTrackColor(enrolled: number, capacity: number): string {
  if (capacity === 0) return 'bg-gray-100'
  const pct = (enrolled / capacity) * 100
  if (pct >= 100) return 'bg-red-100'
  if (pct >= 80) return 'bg-amber-100'
  return 'bg-emerald-100'
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'registrations' | 'waitlist'>(
    'registrations'
  )
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  const { data: event, isLoading, error } = useEvent(id)
  const { data: registrations = [], isLoading: registrationsLoading } =
    useRegistrations({ event_id: id })
  const { data: waitlist = [], isLoading: waitlistLoading } =
    useEventWaitlist(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="space-y-4">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load event. Please try again.
        </div>
      </div>
    )
  }

  const status = statusConfig[event.status]
  const capacityPct =
    event.capacity > 0
      ? Math.round((event.enrolled_count / event.capacity) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Back Button + Header */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {event.name}
            </h1>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                status.className
              )}
            >
              {status.label}
            </span>
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <UserPlus className="h-4 w-4" />
            Register Camper
          </button>
        </div>
      </div>

      {/* Event Info Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Dates */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span>Dates</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {formatDateRange(event.start_date, event.end_date)}
          </p>
          {event.start_time && event.end_time && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {event.start_time} - {event.end_time}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>Location</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {event.location_name ?? 'No location set'}
          </p>
        </div>

        {/* Capacity */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>Capacity</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {event.enrolled_count} / {event.capacity} enrolled
          </p>
          {event.waitlist_count > 0 && (
            <p className="mt-0.5 text-xs text-gray-500">
              {event.waitlist_count} on waitlist
            </p>
          )}
          {event.capacity > 0 && (
            <div className="mt-2">
              <div
                className={cn(
                  'h-2 w-full overflow-hidden rounded-full',
                  getCapacityTrackColor(event.enrolled_count, event.capacity)
                )}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    getCapacityColor(event.enrolled_count, event.capacity)
                  )}
                  style={{
                    width: `${Math.min(capacityPct, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <DollarSign className="h-4 w-4" />
            <span>Price</span>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            ${Number(event.price).toLocaleString()}
          </p>
          {event.deposit_required && event.deposit_amount && (
            <p className="mt-0.5 text-xs text-gray-500">
              ${Number(event.deposit_amount).toLocaleString()} deposit required
            </p>
          )}
        </div>
      </div>

      {/* Age / Gender row */}
      <div className="flex flex-wrap gap-3">
        {(event.min_age || event.max_age) && (
          <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20">
            Ages {event.min_age ?? '?'} - {event.max_age ?? '?'}
          </span>
        )}
        <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20">
          {formatGender(event.gender_restriction)}
        </span>
      </div>

      {/* Description */}
      {event.description && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Description</h2>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {event.description}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('registrations')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === 'registrations'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Registrations ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab('waitlist')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === 'waitlist'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Waitlist ({waitlist.length})
          </button>
        </div>

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div className="mt-4">
            {registrationsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}
            {!registrationsLoading && registrations.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
                <Users className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-900">
                  No registrations yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Register campers to this event to see them here.
                </p>
              </div>
            )}
            {!registrationsLoading && registrations.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        <th className="px-6 py-3">Camper</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="hidden px-6 py-3 sm:table-cell">
                          Payment
                        </th>
                        <th className="hidden px-6 py-3 md:table-cell">
                          Registered
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {registrations.map((reg) => {
                        const regStatus = registrationStatusConfig[reg.status]
                        const payStatus =
                          paymentStatusConfig[reg.payment_status]
                        return (
                          <tr
                            key={reg.id}
                            className="transition-colors hover:bg-gray-50/80"
                          >
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {reg.camper_name ?? 'Unknown'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                                  regStatus.className
                                )}
                              >
                                {regStatus.label}
                              </span>
                            </td>
                            <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                                  payStatus.className
                                )}
                              >
                                {payStatus.label}
                              </span>
                            </td>
                            <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                              {new Date(reg.registered_at).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Waitlist Tab */}
        {activeTab === 'waitlist' && (
          <div className="mt-4">
            {waitlistLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}
            {!waitlistLoading && waitlist.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
                <Users className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-900">
                  No one on the waitlist
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  The waitlist is empty for this event.
                </p>
              </div>
            )}
            {!waitlistLoading && waitlist.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        <th className="px-6 py-3">Position</th>
                        <th className="px-6 py-3">Camper</th>
                        <th className="hidden px-6 py-3 sm:table-cell">
                          Contact
                        </th>
                        <th className="px-6 py-3">Status</th>
                        <th className="hidden px-6 py-3 md:table-cell">
                          Added
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {waitlist.map((entry) => {
                        const wlStatus = waitlistStatusConfig[entry.status]
                        return (
                          <tr
                            key={entry.id}
                            className="transition-colors hover:bg-gray-50/80"
                          >
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              #{entry.position}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              {entry.camper_name ?? 'Unknown'}
                            </td>
                            <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 sm:table-cell">
                              {entry.contact_name ?? '—'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                                  wlStatus.className
                                )}
                              >
                                {wlStatus.label}
                              </span>
                            </td>
                            <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                              {new Date(
                                entry.created_at
                              ).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register Camper Modal Placeholder */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Register Camper
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Registration form will be available here.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
