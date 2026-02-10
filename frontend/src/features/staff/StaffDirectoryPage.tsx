/**
 * Camp Connect - Staff Directory Page
 * Searchable employee directory with grid/list toggle and pagination.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStaffList, useStaffDepartments } from '@/hooks/useStaff'
import { StaffCard } from './components/StaffCard'
import { StaffFilters } from './components/StaffFilters'

export function StaffDirectoryPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(0)
  const pageSize = 20

  const { data, isLoading, error } = useStaffList({
    search: searchQuery || undefined,
    department: departmentFilter || undefined,
    staff_category: categoryFilter || undefined,
    skip: page * pageSize,
    limit: pageSize,
  })

  const { data: departments } = useStaffDepartments()

  const staffMembers = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setPage(0)
  }

  function handleDepartmentChange(value: string) {
    setDepartmentFilter(value)
    setPage(0)
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value)
    setPage(0)
  }

  function statusDotColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-emerald-500'
      case 'onboarding':
        return 'bg-amber-400'
      case 'inactive':
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Staff Directory
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} staff member{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <StaffFilters
        search={searchQuery}
        onSearchChange={handleSearchChange}
        department={departmentFilter}
        onDepartmentChange={handleDepartmentChange}
        category={categoryFilter}
        onCategoryChange={handleCategoryChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        departments={departments ?? []}
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load staff directory. Please try again.
        </div>
      )}

      {/* Grid View */}
      {!isLoading && !error && staffMembers.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {staffMembers.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              onClick={() => navigate(`/app/staff/${staff.user_id}`)}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && !error && staffMembers.length > 0 && viewMode === 'list' && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="hidden px-6 py-3 md:table-cell">Department</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Email</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffMembers.map((staff) => (
                  <tr
                    key={staff.id}
                    onClick={() => navigate(`/app/staff/${staff.user_id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50/80"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        {staff.avatar_url ? (
                          <img
                            src={staff.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">
                            {staff.first_name.charAt(0)}
                            {staff.last_name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {staff.first_name} {staff.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {staff.role_name ?? '--'}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                      {staff.department ?? '--'}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 sm:table-cell">
                      {staff.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            statusDotColor(staff.status)
                          )}
                        />
                        <span className="text-xs capitalize text-gray-600">
                          {staff.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && staffMembers.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">
              {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)}
            </span>{' '}
            of{' '}
            <span className="font-medium text-gray-700">
              {total.toLocaleString()}
            </span>{' '}
            staff
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
      )}

      {/* Empty State */}
      {!isLoading && !error && staffMembers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Users className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No staff members found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || departmentFilter || categoryFilter
              ? 'Try adjusting your search or filter criteria.'
              : 'Staff members will appear here once added.'}
          </p>
        </div>
      )}
    </div>
  )
}
