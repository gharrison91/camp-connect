import { useState } from 'react'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CamperRow {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female'
  school: string
  parent: string
  events: string[]
  status: 'Active' | 'Registered'
}

const mockCampers: CamperRow[] = [
  {
    id: '1',
    name: 'Emma Thompson',
    age: 12,
    gender: 'Female',
    school: 'Lincoln Middle School',
    parent: 'Sarah Thompson',
    events: ['Adventure Camp', 'Leadership Camp'],
    status: 'Active',
  },
  {
    id: '2',
    name: 'Liam Chen',
    age: 15,
    gender: 'Male',
    school: 'Westwood High School',
    parent: 'David Chen',
    events: ['Leadership Camp'],
    status: 'Active',
  },
  {
    id: '3',
    name: 'Sophia Martinez',
    age: 9,
    gender: 'Female',
    school: 'Oak Elementary',
    parent: 'Maria Martinez',
    events: ['Explorer Camp', 'Junior Camp'],
    status: 'Active',
  },
  {
    id: '4',
    name: 'Noah Williams',
    age: 11,
    gender: 'Male',
    school: 'Riverside Middle School',
    parent: 'James Williams',
    events: ['Adventure Camp'],
    status: 'Registered',
  },
  {
    id: '5',
    name: 'Olivia Davis',
    age: 7,
    gender: 'Female',
    school: 'Maple Elementary',
    parent: 'Jennifer Davis',
    events: ['Junior Camp'],
    status: 'Active',
  },
  {
    id: '6',
    name: 'Ethan Brown',
    age: 14,
    gender: 'Male',
    school: 'Central High School',
    parent: 'Michael Brown',
    events: ['Sports Clinic', 'Adventure Camp'],
    status: 'Active',
  },
  {
    id: '7',
    name: 'Ava Johnson',
    age: 10,
    gender: 'Female',
    school: 'Sunnyvale Elementary',
    parent: 'Karen Johnson',
    events: ['Explorer Camp'],
    status: 'Registered',
  },
  {
    id: '8',
    name: 'Mason Lee',
    age: 16,
    gender: 'Male',
    school: 'Eastside High School',
    parent: 'Robert Lee',
    events: ['Leadership Camp', 'Sports Clinic'],
    status: 'Active',
  },
]

const eventOptions = [
  'All Events',
  'Adventure Camp',
  'Explorer Camp',
  'Leadership Camp',
  'Junior Camp',
  'Sports Clinic',
  'Fall Retreat',
]

const ageGroupOptions = [
  { label: 'All Ages', value: 'all' },
  { label: '6-9', value: '6-9' },
  { label: '10-13', value: '10-13' },
  { label: '14-17', value: '14-17' },
]

const statusColors: Record<CamperRow['status'], string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Registered: 'bg-blue-50 text-blue-700 ring-blue-600/20',
}

export function CampersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('All Events')
  const [ageFilter, setAgeFilter] = useState('all')

  const filteredCampers = mockCampers.filter((camper) => {
    const matchesSearch = camper.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())

    const matchesEvent =
      eventFilter === 'All Events' ||
      camper.events.includes(eventFilter)

    let matchesAge = true
    if (ageFilter !== 'all') {
      const [min, max] = ageFilter.split('-').map(Number)
      matchesAge = camper.age >= min && camper.age <= max
    }

    return matchesSearch && matchesEvent && matchesAge
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Campers
        </h1>
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Plus className="h-4 w-4" />
          Add Camper
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {eventOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <select
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {ageGroupOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Campers Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Age</th>
                <th className="px-6 py-3">Gender</th>
                <th className="hidden px-6 py-3 md:table-cell">School</th>
                <th className="hidden px-6 py-3 lg:table-cell">
                  Parent/Guardian
                </th>
                <th className="hidden px-6 py-3 sm:table-cell">Events</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCampers.map((camper) => (
                <tr
                  key={camper.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50/80"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {camper.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {camper.age}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {camper.gender}
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                    {camper.school}
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 lg:table-cell">
                    {camper.parent}
                  </td>
                  <td className="hidden px-6 py-4 sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {camper.events.map((event) => (
                        <span
                          key={event}
                          className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                        statusColors[camper.status]
                      )}
                    >
                      {camper.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">1-8</span> of{' '}
            <span className="font-medium text-gray-700">1,247</span> campers
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-medium text-white">
              1
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              2
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              3
            </button>
            <span className="px-1 text-sm text-gray-400">...</span>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              156
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredCampers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Search className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No campers found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}
