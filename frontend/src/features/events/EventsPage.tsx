import { useState } from 'react'
import {
  Plus,
  Search,
  CalendarDays,
  Users,
  MapPin,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event } from '@/types'
import { useEvents } from '@/hooks/useEvents'
import { usePermissions } from '@/hooks/usePermissions'
import { EventCreateModal } from './EventCreateModal'

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

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')

  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })

  if (start === end) {
    return `${startMonth} ${startDate.getDate()}`
  }

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}`
  }

  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`
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

export function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { hasPermission } = usePermissions()

  const { data: events = [], isLoading, error } = useEvents({
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Events
        </h1>
        {hasPermission('core.events.create') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="full">Full</option>
          <option value="archived">Archived</option>
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
          Failed to load events. Please try again.
        </div>
      )}

      {/* Event Cards Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const capacityPct =
              event.capacity > 0
                ? Math.round((event.enrolled_count / event.capacity) * 100)
                : 0
            const status = statusConfig[event.status]

            return (
              <div
                key={event.id}
                className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                      {event.name}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {formatDateRange(event.start_date, event.end_date)}
                      </span>
                    </div>
                    {(event.min_age || event.max_age) && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Ages {event.min_age ?? '?'}-{event.max_age ?? '?'}{' '}
                          &middot; {formatGender(event.gender_restriction)}
                        </span>
                      </div>
                    )}
                    {event.location_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{event.location_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  {event.capacity > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {event.enrolled_count}/{event.capacity} spots
                        </span>
                        <span className="font-medium text-gray-700">
                          {capacityPct}%
                        </span>
                      </div>
                      <div
                        className={cn(
                          'mt-1.5 h-2 w-full overflow-hidden rounded-full',
                          getCapacityTrackColor(
                            event.enrolled_count,
                            event.capacity
                          )
                        )}
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            getCapacityColor(
                              event.enrolled_count,
                              event.capacity
                            )
                          )}
                          style={{
                            width: `${Math.min(capacityPct, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                    <span className="text-lg font-semibold text-gray-900">
                      ${Number(event.price).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">per camper</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && events.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <CalendarDays className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No events found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first event to get started.'}
          </p>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <EventCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
