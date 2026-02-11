/**
 * Camp Connect - Alerts Hub Page
 * Aggregated notifications: messages, buddy requests, medicine, etc.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Loader2,
  Check,
  CheckCheck,
  X,
  MessageCircle,
  Heart,
  Users,
  CreditCard,
  FileText,
  AlertCircle,
  Info,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useAlerts,
  useAlertCounts,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  useDismissAlert,
} from '@/hooks/useAlerts'
import { useToast } from '@/components/ui/Toast'

const typeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  message: { icon: MessageCircle, color: 'bg-blue-100 text-blue-600', label: 'Message' },
  buddy_request: { icon: Users, color: 'bg-purple-100 text-purple-600', label: 'Buddy Request' },
  medicine: { icon: Heart, color: 'bg-red-100 text-red-600', label: 'Medicine' },
  payment: { icon: CreditCard, color: 'bg-emerald-100 text-emerald-600', label: 'Payment' },
  registration: { icon: FileText, color: 'bg-amber-100 text-amber-600', label: 'Registration' },
  form: { icon: FileText, color: 'bg-indigo-100 text-indigo-600', label: 'Form' },
  general: { icon: Bell, color: 'bg-gray-100 text-gray-600', label: 'General' },
}

const severityConfig: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: 'text-blue-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
  urgent: { icon: AlertCircle, color: 'text-red-500' },
  success: { icon: Zap, color: 'text-emerald-500' },
}

export function AlertsPage() {
  const { toast } = useToast()
  const [filterType, setFilterType] = useState<string>('')
  const [showRead, setShowRead] = useState(false)

  const { data: alerts = [], isLoading } = useAlerts({
    alert_type: filterType || undefined,
    is_read: showRead ? undefined : false,
  })
  const { data: counts } = useAlertCounts()
  const markRead = useMarkAlertRead()
  const markAllRead = useMarkAllAlertsRead()
  const dismiss = useDismissAlert()

  const handleMarkRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id)
    } catch {
      toast({ type: 'error', message: 'Failed to mark as read' })
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync()
      toast({ type: 'success', message: 'All alerts marked as read' })
    } catch {
      toast({ type: 'error', message: 'Failed to mark all as read' })
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await dismiss.mutateAsync(id)
    } catch {
      toast({ type: 'error', message: 'Failed to dismiss' })
    }
  }

  const getEntityLink = (alert: { entity_type: string | null; entity_id: string | null }) => {
    if (!alert.entity_type || !alert.entity_id) return null
    const typeMap: Record<string, string> = {
      camper: 'campers',
      contact: 'contacts',
      event: 'events',
      registration: 'registrations',
      family: 'families',
    }
    const path = typeMap[alert.entity_type]
    return path ? `/app/${path}/${alert.entity_id}` : null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Alerts
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {counts?.total || 0} unread notification{(counts?.total || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        {(counts?.total || 0) > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Count badges by type */}
      {counts && Object.keys(counts.by_type).length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              !filterType ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            All ({counts.total})
          </button>
          {Object.entries(counts.by_type).map(([type, count]) => {
            const config = typeConfig[type] || typeConfig.general
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize',
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {config.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Show read toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={showRead}
          onChange={(e) => setShowRead(e.target.checked)}
          className="rounded border-gray-300"
        />
        Show read alerts
      </label>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Bell className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No alerts</p>
          <p className="mt-1 text-sm text-gray-500">
            You&apos;re all caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const config = typeConfig[alert.alert_type] || typeConfig.general
            const severity = severityConfig[alert.severity] || severityConfig.info
            const Icon = config.icon
            const link = getEntityLink(alert)

            return (
              <div
                key={alert.id}
                className={cn(
                  'group flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all',
                  alert.is_read
                    ? 'border-gray-100 opacity-60'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.color)}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{alert.title}</h3>
                    <severity.icon className={cn('h-4 w-4', severity.color)} />
                  </div>
                  {alert.message && (
                    <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">{alert.message}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span className="capitalize">{config.label}</span>
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                    {link && (
                      <Link
                        to={link}
                        className="text-blue-500 hover:text-blue-700 hover:underline"
                      >
                        View details
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!alert.is_read && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
