import { useState } from 'react'
import {
  Plus,
  Search,
  CalendarDays,
  Users,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event } from '@/types'

type EventStatus = Event['status']

const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Week 1: Adventure Camp',
    description: 'Outdoor adventures including hiking, kayaking, and rock climbing.',
    startDate: '2026-07-07',
    endDate: '2026-07-11',
    capacity: 50,
    enrolled: 45,
    minAge: 10,
    maxAge: 14,
    gender: 'all',
    price: 495,
    status: 'published',
    location: 'Main Campus',
  },
  {
    id: '2',
    name: 'Week 2: Explorer Camp',
    description: 'Nature exploration with science experiments and wildlife observation.',
    startDate: '2026-07-14',
    endDate: '2026-07-18',
    capacity: 50,
    enrolled: 50,
    minAge: 8,
    maxAge: 12,
    gender: 'all',
    price: 450,
    status: 'full',
    location: 'Main Campus',
  },
  {
    id: '3',
    name: 'Week 3: Leadership Camp',
    description: 'Team building, public speaking, and leadership development.',
    startDate: '2026-07-21',
    endDate: '2026-07-25',
    capacity: 40,
    enrolled: 32,
    minAge: 14,
    maxAge: 17,
    gender: 'all',
    price: 525,
    status: 'published',
    location: 'Main Campus',
  },
  {
    id: '4',
    name: 'Week 4: Junior Camp',
    description: 'Fun-filled week of arts, crafts, and age-appropriate activities.',
    startDate: '2026-07-28',
    endDate: '2026-08-01',
    capacity: 35,
    enrolled: 28,
    minAge: 6,
    maxAge: 9,
    gender: 'all',
    price: 395,
    status: 'published',
    location: 'Main Campus',
  },
  {
    id: '5',
    name: 'Fall Retreat',
    description: 'Weekend retreat with fall-themed activities and bonfires.',
    startDate: '2026-09-12',
    endDate: '2026-09-14',
    capacity: 30,
    enrolled: 0,
    minAge: 12,
    maxAge: 16,
    gender: 'all',
    price: 275,
    status: 'draft',
    location: 'Lakeside Pavilion',
  },
  {
    id: '6',
    name: 'Sports Clinic',
    description: 'Full-day sports clinic covering basketball, soccer, and flag football.',
    startDate: '2026-08-09',
    endDate: '2026-08-09',
    capacity: 20,
    enrolled: 15,
    minAge: 10,
    maxAge: 16,
    gender: 'male',
    price: 75,
    status: 'published',
    location: 'Athletic Fields',
  },
]

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

function formatGender(gender: Event['gender']): string {
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
  const pct = (enrolled / capacity) * 100
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getCapacityTrackColor(enrolled: number, capacity: number): string {
  const pct = (enrolled / capacity) * 100
  if (pct >= 100) return 'bg-red-100'
  if (pct >= 80) return 'bg-amber-100'
  return 'bg-emerald-100'
}

export function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Events
        </h1>
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Plus className="h-4 w-4" />
          Create Event
        </button>
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

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => {
          const capacityPct = Math.round(
            (event.enrolled / event.capacity) * 100
          )
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
                      {formatDateRange(event.startDate, event.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Ages {event.minAge}-{event.maxAge} &middot;{' '}
                      {formatGender(event.gender)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {event.enrolled}/{event.capacity} spots
                    </span>
                    <span className="font-medium text-gray-700">
                      {capacityPct}%
                    </span>
                  </div>
                  <div
                    className={cn(
                      'mt-1.5 h-2 w-full overflow-hidden rounded-full',
                      getCapacityTrackColor(event.enrolled, event.capacity)
                    )}
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        getCapacityColor(event.enrolled, event.capacity)
                      )}
                      style={{ width: `${Math.min(capacityPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                  <span className="text-lg font-semibold text-gray-900">
                    ${event.price}
                  </span>
                  <span className="text-xs text-gray-400">per camper</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <CalendarDays className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No events found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}
