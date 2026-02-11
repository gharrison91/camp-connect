import { Link } from 'react-router-dom'
import {
  Users,
  Calendar,
  Clock,
  ClipboardList,
  Loader2,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  Camera,
  Sparkles,
  ArrowRight,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStats } from '@/hooks/useDashboard'
import { useAlertCounts } from '@/hooks/useAlerts'
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
  const { data: alertCounts } = useAlertCounts()

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
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Upcoming Events',
      value: stats?.upcoming_events ?? 0,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Total Registrations',
      value: stats?.total_registrations ?? 0,
      icon: ClipboardList,
      iconBg: 'bg-violet-50 text-violet-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-emerald-100">{formatDate()}</p>
          {alertCounts && alertCounts.total > 0 && (
            <Link
              to="/app/alerts"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <Bell className="h-4 w-4" />
              {alertCounts.total} new alert{alertCounts.total !== 1 ? 's' : ''}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
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
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>Failed to load dashboard data. The server may be waking up.</p>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
            >
              Refresh Page
            </button>
          </div>
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
                  className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 transition-opacity group-hover:opacity-100" />
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

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'AI Insights', icon: Sparkles, path: '/app/ai-insights', color: 'from-violet-500 to-purple-600' },
              { label: 'Messages', icon: MessageCircle, path: '/app/camper-messages', color: 'from-blue-500 to-cyan-600' },
              { label: 'Photos', icon: Camera, path: '/app/photos', color: 'from-amber-500 to-orange-600' },
              { label: 'Analytics', icon: TrendingUp, path: '/app/analytics', color: 'from-emerald-500 to-teal-600' },
            ].map((action) => {
              const ActionIcon = action.icon
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', action.color)}>
                    <ActionIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-600">{action.label}</p>
                    <p className="text-xs text-gray-400">Quick access</p>
                  </div>
                </Link>
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
