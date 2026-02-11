import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCampers } from '@/hooks/useCampers'
import { usePermissions } from '@/hooks/usePermissions'
import { CamperCreateModal } from './CamperCreateModal'
import type { Camper } from '@/types'

const ageGroupOptions = [
  { label: 'All Ages', value: 'all', min: undefined, max: undefined },
  { label: '6-9', value: '6-9', min: 6, max: 9 },
  { label: '10-13', value: '10-13', min: 10, max: 13 },
  { label: '14-17', value: '14-17', min: 14, max: 17 },
]

const avatarGradients = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
  'from-teal-500 to-emerald-500',
  'from-fuchsia-500 to-pink-500',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length]
}

const ageBadgeColors: Record<string, string> = {
  '6': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  '7': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  '8': 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  '9': 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  '10': 'bg-teal-50 text-teal-700 ring-teal-600/20',
  '11': 'bg-teal-50 text-teal-700 ring-teal-600/20',
  '12': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  '13': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  '14': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  '15': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  '16': 'bg-orange-50 text-orange-700 ring-orange-600/20',
  '17': 'bg-orange-50 text-orange-700 ring-orange-600/20',
}

function getAgeBadgeColor(age: number | null | undefined): string {
  if (age == null) return 'bg-gray-50 text-gray-500 ring-gray-400/20'
  return ageBadgeColors[String(age)] ?? 'bg-gray-50 text-gray-600 ring-gray-500/20'
}

export function CampersPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [ageFilter, setAgeFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const pageSize = 20
  const { hasPermission } = usePermissions()

  const ageGroup = ageGroupOptions.find((o) => o.value === ageFilter)

  const { data, isLoading, error } = useCampers({
    search: searchQuery || undefined,
    age_min: ageGroup?.min,
    age_max: ageGroup?.max,
    skip: page * pageSize,
    limit: pageSize,
  })

  const campers = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  function getPrimaryContact(camper: Camper): string {
    const primary = camper.contacts?.find((c) => c.is_primary)
    if (primary) return `${primary.first_name} ${primary.last_name}`
    const first = camper.contacts?.[0]
    if (first) return `${first.first_name} ${first.last_name}`
    return '\u2014'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Campers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {total > 0 ? `${total} camper${total !== 1 ? 's' : ''} registered` : 'Manage your camp roster'}
          </p>
        </div>
        {hasPermission('core.campers.update') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            Add Camper
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className={cn(
          'relative flex-1 transition-all duration-300',
          searchFocused && 'scale-[1.01]'
        )}>
          <Search className={cn(
            'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-all duration-200',
            searchFocused ? 'text-emerald-500 scale-110' : 'text-gray-400'
          )} />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(0)
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none',
              searchFocused
                ? 'border-emerald-400 ring-2 ring-emerald-100 shadow-sm'
                : 'border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            )}
          />
        </div>
        <select
          value={ageFilter}
          onChange={(e) => {
            setAgeFilter(e.target.value)
            setPage(0)
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {ageGroupOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
            <Loader2 className="relative h-8 w-8 animate-spin text-emerald-500" />
          </div>
          <p className="mt-4 text-sm text-gray-400">Loading campers...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 text-sm text-red-700 shadow-sm">
          Failed to load campers. Please try again.
        </div>
      )}

      {/* Campers Table */}
      {!isLoading && !error && campers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Age</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="hidden px-6 py-3 md:table-cell">School</th>
                  <th className="hidden px-6 py-3 lg:table-cell">
                    Parent/Guardian
                  </th>
                  <th className="hidden px-6 py-3 sm:table-cell">
                    Registrations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campers.map((camper) => {
                  const fullName = `${camper.first_name} ${camper.last_name}`
                  const gradient = getAvatarGradient(fullName)
                  return (
                    <tr
                      key={camper.id}
                      onClick={() => navigate(`/app/campers/${camper.id}`)}
                      className="group cursor-pointer transition-all duration-150 hover:bg-emerald-50/30"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-md',
                            gradient
                          )}>
                            {camper.first_name[0]}{camper.last_name[0]}
                          </div>
                          <span className="text-sm font-medium text-gray-900 transition-colors duration-150 group-hover:text-emerald-700">
                            {camper.first_name} {camper.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                          getAgeBadgeColor(camper.age)
                        )}>
                          {camper.age ?? '\u2014'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 capitalize">
                        {camper.gender ?? '\u2014'}
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                        {camper.school ?? '\u2014'}
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 lg:table-cell">
                        {getPrimaryContact(camper)}
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-all duration-150',
                            camper.registration_count > 0
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 group-hover:bg-emerald-100'
                              : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                          )}
                        >
                          {camper.registration_count} event
                          {camper.registration_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/30 px-6 py-3">
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-medium text-gray-700">
                {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-gray-700">
                {total.toLocaleString()}
              </span>{' '}
              campers
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white hover:border-gray-300 hover:text-gray-600 hover:shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm text-gray-600">
                Page {page + 1} of {Math.max(totalPages, 1)}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white hover:border-gray-300 hover:text-gray-800 hover:shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && campers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 shadow-sm">
            <Users className="h-7 w-7 text-gray-300" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-900">
            No campers found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || ageFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Add your first camper to get started.'}
          </p>
          {!searchQuery && ageFilter === 'all' && hasPermission('core.campers.update') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition-all duration-200 hover:bg-emerald-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Camper
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Create Camper Modal */}
      {showCreateModal && (
        <CamperCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
