import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
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

export function CampersPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [ageFilter, setAgeFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
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
    return '—'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Campers
        </h1>
        {hasPermission('core.campers.update') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Add Camper
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(0)
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={ageFilter}
          onChange={(e) => {
            setAgeFilter(e.target.value)
            setPage(0)
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load campers. Please try again.
        </div>
      )}

      {/* Campers Table */}
      {!isLoading && !error && campers.length > 0 && (
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
                  <th className="hidden px-6 py-3 sm:table-cell">
                    Registrations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campers.map((camper) => (
                  <tr
                    key={camper.id}
                    onClick={() => navigate(`/app/campers/${camper.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50/80"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {camper.first_name} {camper.last_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {camper.age ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 capitalize">
                      {camper.gender ?? '—'}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                      {camper.school ?? '—'}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 lg:table-cell">
                      {getPrimaryContact(camper)}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                          camper.registration_count > 0
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                        )}
                      >
                        {camper.registration_count} event
                        {camper.registration_count !== 1 ? 's' : ''}
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
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm text-gray-600">
                Page {page + 1} of {Math.max(totalPages, 1)}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && campers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Search className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No campers found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || ageFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Add your first camper to get started.'}
          </p>
        </div>
      )}

      {/* Create Camper Modal */}
      {showCreateModal && (
        <CamperCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
