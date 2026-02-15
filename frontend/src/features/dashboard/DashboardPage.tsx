import { useState } from 'react'
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
  RefreshCw,
  Settings2,
  GripVertical,
  Eye,
  EyeOff,
  X,
  Check,
  UserCog,
  ListTodo,
  Mail,
  CreditCard,
  FileBarChart,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStats } from '@/hooks/useDashboard'
import { useAlertCounts } from '@/hooks/useAlerts'
import { useAuthStore } from '@/stores/authStore'
import {
  useDashboardSettings,
  useUpdateDashboardSettings,
  type DashboardKPI,
  type QuickAction,
} from '@/hooks/useDashboardSettings'
import { useToast } from '@/components/ui/Toast'

interface StatCard {
  id: string
  label: string
  value: string | number
  icon: LucideIcon
  iconBg: string
  accentColor: string
}

interface QuickActionDef {
  id: string
  label: string
  icon: LucideIcon
  path: string
  color: string
}

// All available KPIs
const KPI_DEFINITIONS: Record<string, { icon: LucideIcon; iconBg: string; accentColor: string }> = {
  total_campers: { icon: Users, iconBg: 'bg-blue-50 text-blue-600', accentColor: 'from-blue-400 to-blue-500' },
  total_events: { icon: Calendar, iconBg: 'bg-emerald-50 text-emerald-600', accentColor: 'from-emerald-400 to-teal-400' },
  upcoming_events: { icon: Clock, iconBg: 'bg-amber-50 text-amber-600', accentColor: 'from-amber-400 to-orange-400' },
  total_registrations: { icon: ClipboardList, iconBg: 'bg-violet-50 text-violet-600', accentColor: 'from-violet-400 to-purple-400' },
  pending_registrations: { icon: ClipboardList, iconBg: 'bg-rose-50 text-rose-600', accentColor: 'from-rose-400 to-pink-400' },
  total_staff: { icon: UserCog, iconBg: 'bg-cyan-50 text-cyan-600', accentColor: 'from-cyan-400 to-sky-400' },
  open_tasks: { icon: ListTodo, iconBg: 'bg-orange-50 text-orange-600', accentColor: 'from-orange-400 to-amber-400' },
  unread_messages: { icon: Mail, iconBg: 'bg-indigo-50 text-indigo-600', accentColor: 'from-indigo-400 to-violet-400' },
}

// All available quick actions
const QUICK_ACTION_DEFINITIONS: Record<string, { icon: LucideIcon; color: string }> = {
  ai_insights: { icon: Sparkles, color: 'from-violet-500 to-purple-600' },
  messages: { icon: MessageCircle, color: 'from-blue-500 to-cyan-600' },
  photos: { icon: Camera, color: 'from-amber-500 to-orange-600' },
  analytics: { icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
  registrations: { icon: ClipboardList, color: 'from-rose-500 to-pink-600' },
  schedule: { icon: CalendarDays, color: 'from-indigo-500 to-blue-600' },
  payments: { icon: CreditCard, color: 'from-slate-600 to-slate-700' },
  reports: { icon: FileBarChart, color: 'from-cyan-500 to-teal-600' },
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

// KPI value mappings
const KPI_VALUE_MAP: Record<string, (stats: Record<string, unknown>) => number> = {
  total_campers: (s) => (s.total_campers as number) ?? 0,
  total_events: (s) => (s.total_events as number) ?? 0,
  upcoming_events: (s) => (s.upcoming_events as number) ?? 0,
  total_registrations: (s) => (s.total_registrations as number) ?? 0,
  pending_registrations: (s) => (s.pending_registrations as number) ?? 0,
  total_staff: (s) => (s.total_staff as number) ?? 0,
  open_tasks: (s) => (s.open_tasks as number) ?? 0,
  unread_messages: (s) => (s.unread_messages as number) ?? 0,
}

// Quick action path mappings
const QUICK_ACTION_PATHS: Record<string, string> = {
  ai_insights: '/app/ai-insights',
  messages: '/app/camper-messages',
  photos: '/app/photos',
  analytics: '/app/analytics',
  registrations: '/app/registrations',
  schedule: '/app/schedule',
  payments: '/app/payments',
  reports: '/app/reports',
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data: stats, isLoading, error } = useDashboardStats()
  const { data: alertCounts } = useAlertCounts()
  const { data: dashboardSettings } = useDashboardSettings()
  const updateSettings = useUpdateDashboardSettings()
  const { toast: addToast } = useToast()
  
  const [showCustomize, setShowCustomize] = useState(false)
  const [editKpis, setEditKpis] = useState<DashboardKPI[]>([])
  const [editActions, setEditActions] = useState<QuickAction[]>([])

  const firstName = user?.first_name || 'there'

  // Build visible stat cards from settings
  const statCards: StatCard[] = (dashboardSettings?.kpis || [])
    .filter((kpi) => kpi.enabled)
    .sort((a, b) => a.order - b.order)
    .map((kpi) => {
      const def = KPI_DEFINITIONS[kpi.id]
      return {
        id: kpi.id,
        label: kpi.label,
        value: stats ? KPI_VALUE_MAP[kpi.id]?.(stats as unknown as Record<string, unknown>) ?? 0 : 0,
        icon: def?.icon || Users,
        iconBg: def?.iconBg || 'bg-gray-50 text-gray-600',
        accentColor: def?.accentColor || 'from-gray-400 to-gray-500',
      }
    })

  // Build visible quick actions from settings
  const quickActions: QuickActionDef[] = (dashboardSettings?.quick_actions || [])
    .filter((a) => a.enabled)
    .sort((a, b) => a.order - b.order)
    .map((action) => {
      const def = QUICK_ACTION_DEFINITIONS[action.id]
      return {
        id: action.id,
        label: action.label,
        icon: def?.icon || Sparkles,
        path: QUICK_ACTION_PATHS[action.id] || action.path,
        color: def?.color || 'from-gray-500 to-gray-600',
      }
    })

  const openCustomize = () => {
    setEditKpis(dashboardSettings?.kpis || [])
    setEditActions(dashboardSettings?.quick_actions || [])
    setShowCustomize(true)
  }

  const saveCustomize = async () => {
    try {
      await updateSettings.mutateAsync({ kpis: editKpis, quick_actions: editActions })
      addToast({ type: 'success', message: 'Dashboard customization saved!' })
      setShowCustomize(false)
    } catch {
      addToast({ type: 'error', message: 'Failed to save customization.' })
    }
  }

  const toggleKpi = (id: string) => {
    setEditKpis((prev) =>
      prev.map((k) => (k.id === id ? { ...k, enabled: !k.enabled } : k))
    )
  }

  const toggleAction = (id: string) => {
    setEditActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    )
  }

  const moveKpi = (id: string, direction: 'up' | 'down') => {
    setEditKpis((prev) => {
      const idx = prev.findIndex((k) => k.id === id)
      if (idx === -1) return prev
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= prev.length) return prev
      const newList = [...prev]
      const tempOrder = newList[idx].order
      newList[idx] = { ...newList[idx], order: newList[swapIdx].order }
      newList[swapIdx] = { ...newList[swapIdx], order: tempOrder }
      return newList.sort((a, b) => a.order - b.order)
    })
  }

  const moveAction = (id: string, direction: 'up' | 'down') => {
    setEditActions((prev) => {
      const idx = prev.findIndex((a) => a.id === id)
      if (idx === -1) return prev
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= prev.length) return prev
      const newList = [...prev]
      const tempOrder = newList[idx].order
      newList[idx] = { ...newList[idx], order: newList[swapIdx].order }
      newList[swapIdx] = { ...newList[swapIdx], order: tempOrder }
      return newList.sort((a, b) => a.order - b.order)
    })
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-sm" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
        <div className="absolute right-20 top-20 h-16 w-16 rounded-full bg-white/[0.07]" />
        <div className="relative flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-emerald-100">{formatDate()}</p>
            {alertCounts && alertCounts.total > 0 && (
              <Link
                to="/app/alerts"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30 hover:scale-[1.02]"
              >
                <Bell className="h-4 w-4" />
                {alertCounts.total} new alert{alertCounts.total !== 1 ? 's' : ''}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          <button
            onClick={openCustomize}
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30"
          >
            <Settings2 className="h-4 w-4" />
            Customize
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
            <Loader2 className="relative h-8 w-8 animate-spin text-emerald-500" />
          </div>
          <p className="mt-4 text-sm text-gray-400">Loading your dashboard...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-5 text-sm text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium">Unable to load dashboard</p>
              <p className="mt-0.5 text-red-600/80">The server may be waking up. Give it a moment and try again.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3.5 py-2 text-xs font-medium text-red-700 transition-all duration-200 hover:bg-red-200 hover:shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
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
                  className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-gray-200"
                >
                  <div className={cn(
                    'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                    stat.accentColor
                  )} />
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-md',
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
          {quickActions.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quickActions.map((action) => {
                const ActionIcon = action.icon
                return (
                  <Link
                    key={action.id}
                    to={action.path}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-200"
                  >
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md',
                      action.color
                    )}>
                      <ActionIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 transition-colors duration-200 group-hover:text-emerald-600">{action.label}</p>
                      <p className="text-xs text-gray-400">Quick access</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-gray-300 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                  </Link>
                )
              })}
            </div>
          )}

          {/* Recent Registrations */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                  <ClipboardList className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  Recent Registrations
                </h2>
              </div>
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
                        className="group/row transition-colors duration-150 hover:bg-emerald-50/30"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 transition-colors duration-150 group-hover/row:text-emerald-700">
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
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50">
                  <ClipboardList className="h-7 w-7 text-gray-300" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">
                  No registrations yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Register a camper for an event to see them here.
                </p>
                <Link
                  to="/app/registrations"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition-all duration-200 hover:bg-emerald-100"
                >
                  Go to Registrations
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Customization Modal */}
      {showCustomize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Customize Dashboard</h2>
                <p className="text-sm text-gray-500">Choose which KPIs and quick actions to display</p>
              </div>
              <button
                onClick={() => setShowCustomize(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {/* KPIs Section */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">KPI Cards</h3>
                <div className="space-y-2">
                  {editKpis.sort((a, b) => a.order - b.order).map((kpi, idx) => {
                    const def = KPI_DEFINITIONS[kpi.id]
                    const Icon = def?.icon || Users
                    return (
                      <div
                        key={kpi.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                          kpi.enabled
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-gray-200 bg-gray-50'
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          kpi.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={cn(
                          'flex-1 text-sm font-medium',
                          kpi.enabled ? 'text-gray-900' : 'text-gray-400'
                        )}>
                          {kpi.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveKpi(kpi.id, 'up')}
                            disabled={idx === 0}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveKpi(kpi.id, 'down')}
                            disabled={idx === editKpis.length - 1}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => toggleKpi(kpi.id)}
                          className={cn(
                            'rounded-lg p-2 transition-colors',
                            kpi.enabled
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          )}
                        >
                          {kpi.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick Actions Section */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Quick Actions</h3>
                <div className="space-y-2">
                  {editActions.sort((a, b) => a.order - b.order).map((action, idx) => {
                    const def = QUICK_ACTION_DEFINITIONS[action.id]
                    const Icon = def?.icon || Sparkles
                    return (
                      <div
                        key={action.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                          action.enabled
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-gray-200 bg-gray-50'
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          action.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={cn(
                          'flex-1 text-sm font-medium',
                          action.enabled ? 'text-gray-900' : 'text-gray-400'
                        )}>
                          {action.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveAction(action.id, 'up')}
                            disabled={idx === 0}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveAction(action.id, 'down')}
                            disabled={idx === editActions.length - 1}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => toggleAction(action.id)}
                          className={cn(
                            'rounded-lg p-2 transition-colors',
                            action.enabled
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          )}
                        >
                          {action.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setShowCustomize(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomize}
                disabled={updateSettings.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {updateSettings.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
