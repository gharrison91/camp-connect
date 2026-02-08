import {
  Users,
  Calendar,
  Clock,
  ClipboardList,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStats } from '@/hooks/useDashboard'
import { useAuthStore } from '@/stores/authStore'

interface StatCard {
  label: string
  value: string | number
  icon: React.ElementType
  iconBg: string
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  waitlisted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  cancelled: 'bg-gray-50 text-gray-500 ring-gray-400/20',
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatRegistrationDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function capitalizeFirst(str: string): string {
  if (!str) return '—'
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data: stats, isLoading, error } = useDashboardStats()

  const firstName = user?.first_name || 'there'

  const statCards: StatCard[] = [
    {
      label: 'Total Campers',
      value: stats?.total_campers ?? 0,
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Events',
      value: stats?.total_events ?? 0,
      icon: Calendar,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Upcoming Events',
      value: stats?.upcoming_events ?? 0,
      icon: Clock,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Registrations',
      value: stats?.total_registrations ?? 0,
      icon: ClipboardList,
      iconBg: 'bg-blue-50 text-blue-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{formatDate()}</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>Failed to load dashboard data. Please try refreshing the page.</p>
        </div>
      )}

      {/* KPI Stat Cards */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        stat.iconBg
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xl font-bold tracking-tight text-gray-900">
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent Registrations */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Recent Registrations
              </h2>
            </div>

            {stats?.recent_registrations &&
            stats.recent_registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3">Camper</th>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.recent_registrations.map((reg) => (
                      <tr
                        key={reg.id}
                        className="transition-colors hover:bg-gray-50/50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {reg.camper_name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {reg.event_name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatRegistrationDate(reg.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                              statusColors[reg.status] ||
                                'bg-gray-50 text-gray-500 ring-gray-400/20'
                            )}
                          >
                            {capitalizeFirst(reg.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  No registrations yet. Register a camper to get started.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
