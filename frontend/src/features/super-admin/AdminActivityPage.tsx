/**
 * Camp Connect - Super Admin Activity Page
 * Platform-wide activity feed showing recent actions across all orgs.
 */

import {
  Activity,
  Building2,
  Users,
  Calendar,
  Clock,
} from 'lucide-react'
import { usePlatformActivity } from '@/hooks/useAdmin'

const TYPE_ICONS: Record<string, typeof Building2> = {
  new_organization: Building2,
  new_user: Users,
  new_event: Calendar,
}

const TYPE_COLORS: Record<string, string> = {
  new_organization: 'bg-violet-50 text-violet-500',
  new_user: 'bg-blue-50 text-blue-500',
  new_event: 'bg-emerald-50 text-emerald-500',
}

export function AdminActivityPage() {
  const { data, isLoading } = usePlatformActivity(50)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Platform Activity</h1>
        <p className="text-sm text-slate-500">
          Recent activity across all organizations
        </p>
      </div>

      {/* Activity Feed */}
      <div className="max-w-3xl">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : data && data.activities.length > 0 ? (
          <div className="space-y-2">
            {data.activities.map((activity, i) => {
              const Icon = TYPE_ICONS[activity.type] || Activity
              const colorClass =
                TYPE_COLORS[activity.type] || 'bg-slate-50 text-slate-500'
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500">{activity.subtitle}</p>
                  </div>
                  {activity.timestamp && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.timestamp).toLocaleDateString()}{' '}
                      {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500">No activity recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Activity will appear here as organizations sign up and use the
              platform
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
