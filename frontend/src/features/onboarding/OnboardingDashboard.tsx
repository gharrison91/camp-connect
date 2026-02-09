/**
 * Camp Connect - Onboarding Dashboard (Manager View)
 * Shows onboarding progress for all staff members.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Loader2,
  Users,
  Clock,
  CheckCircle2,
  Mail,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboardingList } from '@/hooks/useOnboarding'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'invited', label: 'Invited' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

function statusBadge(status: string) {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle2,
        label: 'Completed',
        classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      }
    case 'in_progress':
      return {
        icon: Clock,
        label: 'In Progress',
        classes: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      }
    case 'invited':
    default:
      return {
        icon: Mail,
        label: 'Invited',
        classes: 'bg-blue-50 text-blue-700 ring-blue-600/20',
      }
  }
}

export function OnboardingDashboard() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: onboardingList, isLoading, error } = useOnboardingList(
    statusFilter || undefined
  )

  const items = onboardingList ?? []

  // Summary counts
  const totalCount = items.length
  const completedCount = items.filter((i) => i.status === 'completed').length
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length
  const invitedCount = items.filter((i) => i.status === 'invited').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Onboarding Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage staff onboarding progress.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>Total</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{completedCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <Clock className="h-4 w-4" />
            <span>In Progress</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Mail className="h-4 w-4" />
            <span>Invited</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{invitedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load onboarding data. Please try again.
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="hidden px-6 py-3 md:table-cell">Department</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const badge = statusBadge(item.status)
                  const BadgeIcon = badge.icon
                  const progress = Math.round(item.progress * 100)

                  return (
                    <tr
                      key={item.user_id}
                      onClick={() => navigate(`/app/staff/${item.user_id}`)}
                      className="cursor-pointer transition-colors hover:bg-gray-50/80"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {item.first_name} {item.last_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {item.email}
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                        {item.department ?? '--'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                            badge.classes
                          )}
                        >
                          <BadgeIcon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                progress === 100
                                  ? 'bg-emerald-500'
                                  : progress > 0
                                    ? 'bg-blue-500'
                                    : 'bg-gray-200'
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Search className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No onboarding records found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter
              ? 'Try changing the status filter.'
              : 'Initiate onboarding for new staff members to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}
