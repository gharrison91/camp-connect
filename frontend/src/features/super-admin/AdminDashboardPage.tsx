/**
 * Camp Connect - Super Admin Dashboard
 * Platform-wide metrics, organization overview, and recent activity.
 */

import {
  Building2,
  Users,
  UserCheck,
  Calendar,
  ClipboardList,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Shield,
  Tent,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlatformStats, usePlatformActivity } from '@/hooks/useAdmin'
import { useAuthStore } from '@/stores/authStore'
import { Link } from 'react-router-dom'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string
  value: number | string
  icon: typeof Building2
  color: string
  subtitle?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            color
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const { user } = useAuthStore()
  const { data: stats, isLoading: statsLoading } = usePlatformStats()
  const { data: activityData } = usePlatformActivity(10)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Platform Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Welcome back, {user?.first_name}. Here's your platform overview.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              label="Total Organizations"
              value={stats.total_organizations}
              icon={Building2}
              color="bg-violet-500"
              subtitle={`${stats.active_organizations} active`}
            />
            <StatCard
              label="Total Users"
              value={stats.total_users}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              label="Total Campers"
              value={stats.total_campers.toLocaleString()}
              icon={UserCheck}
              color="bg-emerald-500"
            />
            <StatCard
              label="Total Registrations"
              value={stats.total_registrations.toLocaleString()}
              icon={ClipboardList}
              color="bg-amber-500"
            />
          </div>

          {/* Second row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <StatCard
              label="Total Events"
              value={stats.total_events}
              icon={Calendar}
              color="bg-pink-500"
            />
            <StatCard
              label="New Signups (30 days)"
              value={stats.recent_signups}
              icon={TrendingUp}
              color="bg-green-500"
              subtitle={
                stats.growth_rate !== 0
                  ? `${stats.growth_rate > 0 ? '+' : ''}${stats.growth_rate}% vs prior period`
                  : undefined
              }
            />
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-3">
                Organizations by Tier
              </p>
              <div className="space-y-2">
                {Object.entries(stats.orgs_by_tier).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-slate-700">
                      {tier}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {count}
                    </span>
                  </div>
                ))}
                {Object.keys(stats.orgs_by_tier).length === 0 && (
                  <p className="text-sm text-slate-400">No data yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Quick Actions + Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/admin/organizations"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
            >
              <Building2 className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  View Organizations
                </p>
                <p className="text-xs text-slate-500">Manage all camps</p>
              </div>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  View Users
                </p>
                <p className="text-xs text-slate-500">All platform users</p>
              </div>
            </Link>
            <Link
              to="/admin/activity"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
            >
              <Activity className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Activity Feed
                </p>
                <p className="text-xs text-slate-500">Platform activity</p>
              </div>
            </Link>
            <Link
              to="/app/dashboard"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
            >
              <Tent className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Camp App
                </p>
                <p className="text-xs text-slate-500">Your organization</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Activity
            </h2>
            <Link
              to="/admin/activity"
              className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activityData?.activities?.slice(0, 5).map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50">
                  <Building2 className="h-4 w-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-500">{activity.subtitle}</p>
                </div>
                {activity.timestamp && (
                  <p className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
            {(!activityData?.activities || activityData.activities.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
