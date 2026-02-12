import { useState } from 'react'
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  Eye,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  MapPin,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useWeatherConditions,
  useWeatherForecast,
  useWeatherAlerts,
  useWeatherHistory,
  useCreateWeatherAlert,
  useDismissWeatherAlert,
  useAcknowledgeWeatherAlert,
} from '@/hooks/useWeather'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  advisory: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800 ring-blue-600/20',
    text: 'text-blue-900',
  },
  watch: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800 ring-amber-600/20',
    text: 'text-amber-900',
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800 ring-orange-600/20',
    text: 'text-orange-900',
  },
  emergency: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800 ring-red-600/20',
    text: 'text-red-900',
  },
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  severe_storm: 'Severe Storm',
  lightning: 'Lightning',
  heat: 'Heat Advisory',
  cold: 'Cold Advisory',
  flood: 'Flood',
  tornado: 'Tornado',
  hurricane: 'Hurricane',
  other: 'Other',
}

const CONDITION_GRADIENTS: Record<string, string> = {
  sunny: 'from-sky-400 via-blue-400 to-cyan-300',
  cloudy: 'from-slate-400 via-gray-400 to-slate-300',
  rainy: 'from-slate-500 via-blue-500 to-indigo-400',
  stormy: 'from-gray-700 via-slate-600 to-gray-500',
  snowy: 'from-blue-100 via-slate-200 to-white',
}

function getConditionIcon(condition: string, size = 'h-6 w-6') {
  const props = { className: size }
  switch (condition) {
    case 'sunny': return <Sun {...props} />
    case 'cloudy': return <Cloud {...props} />
    case 'rainy': return <CloudRain {...props} />
    case 'stormy': return <CloudLightning {...props} />
    case 'snowy': return <CloudSnow {...props} />
    default: return <Sun {...props} />
  }
}

function getForecastIcon(icon: string, size = 'h-8 w-8') {
  const props = { className: size }
  switch (icon) {
    case 'Sun': return <Sun {...props} />
    case 'Cloud': return <Cloud {...props} />
    case 'CloudRain': return <CloudRain {...props} />
    case 'CloudLightning': return <CloudLightning {...props} />
    case 'CloudSnow': return <CloudSnow {...props} />
    default: return <Sun {...props} />
  }
}

// ---------------------------------------------------------------------------
// Create Alert Modal
// ---------------------------------------------------------------------------

interface CreateAlertModalProps {
  onClose: () => void
  onCreate: (data: {
    alert_type: string
    severity: string
    title: string
    description: string
    source: string
    starts_at: string
    expires_at: string
    affected_areas: string[]
    recommended_actions: string[]
  }) => void
  isLoading: boolean
}

function CreateAlertModal({ onClose, onCreate, isLoading }: CreateAlertModalProps) {
  const [form, setForm] = useState({
    alert_type: 'severe_storm',
    severity: 'watch',
    title: '',
    description: '',
    source: 'Manual',
    starts_at: new Date().toISOString().slice(0, 16),
    expires_at: new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 16),
    affected_areas_str: '',
    recommended_actions_str: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      alert_type: form.alert_type,
      severity: form.severity,
      title: form.title,
      description: form.description,
      source: form.source,
      starts_at: new Date(form.starts_at).toISOString(),
      expires_at: new Date(form.expires_at).toISOString(),
      affected_areas: form.affected_areas_str.split(',').map((s) => s.trim()).filter(Boolean),
      recommended_actions: form.recommended_actions_str.split('\n').map((s) => s.trim()).filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Weather Alert</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Alert Type</label>
              <select
                value={form.alert_type}
                onChange={(e) => setForm({ ...form, alert_type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {Object.entries(ALERT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="advisory">Advisory</option>
                <option value="watch">Watch</option>
                <option value="warning">Warning</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Thunderstorm Warning for Lake Area"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Detailed alert description..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Starts At</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Expires At</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Affected Areas (comma-separated)</label>
            <input
              type="text"
              value={form.affected_areas_str}
              onChange={(e) => setForm({ ...form, affected_areas_str: e.target.value })}
              placeholder="Main Field, Lakefront, Dining Hall"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Recommended Actions (one per line)</label>
            <textarea
              value={form.recommended_actions_str}
              onChange={(e) => setForm({ ...form, recommended_actions_str: e.target.value })}
              rows={3}
              placeholder={"Move all campers indoors\nSecure outdoor equipment\nMonitor weather radio"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !form.title}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function WeatherPage() {
  const { toast } = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  const { data: conditions, isLoading: loadingConditions } = useWeatherConditions()
  const { data: forecast, isLoading: loadingForecast } = useWeatherForecast()
  const { data: alerts, isLoading: loadingAlerts } = useWeatherAlerts()
  const { data: history, isLoading: loadingHistory } = useWeatherHistory()

  const createAlert = useCreateWeatherAlert()
  const dismissAlert = useDismissWeatherAlert()
  const acknowledgeAlert = useAcknowledgeWeatherAlert()

  const handleCreate = (data: Parameters<typeof createAlert.mutate>[0]) => {
    createAlert.mutate(data, {
      onSuccess: () => {
        toast({ type: 'success', message: 'Weather alert created' })
        setShowCreate(false)
      },
      onError: () => toast({ type: 'error', message: 'Failed to create alert' }),
    })
  }

  const handleDismiss = (id: string) => {
    dismissAlert.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Alert dismissed' }),
      onError: () => toast({ type: 'error', message: 'Failed to dismiss alert' }),
    })
  }

  const handleAcknowledge = (id: string) => {
    acknowledgeAlert.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Alert acknowledged' }),
      onError: () => toast({ type: 'error', message: 'Failed to acknowledge alert' }),
    })
  }

  const conditionType = conditions?.conditions || 'sunny'
  const gradient = CONDITION_GRADIENTS[conditionType] || CONDITION_GRADIENTS.sunny

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weather Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">Current conditions, forecasts, and weather alerts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Create Alert
        </button>
      </div>

      {/* Current Conditions Card */}
      <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg', gradient)}>
        <div className="absolute right-0 top-0 opacity-10">
          {getConditionIcon(conditionType, 'h-48 w-48')}
        </div>
        {loadingConditions ? (
          <div className="flex items-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading conditions...</span>
          </div>
        ) : conditions ? (
          <div className="relative z-10">
            {/* Location header */}
            {conditions.location_name && (
              <div className="mb-3 flex items-center gap-2 text-white/80">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{conditions.location_name}</span>
              </div>
            )}
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  {getConditionIcon(conditionType, 'h-10 w-10')}
                  <span className="text-lg font-medium capitalize">{conditionType}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-6xl font-bold tracking-tight">{Math.round(conditions.temperature)}</span>
                  <span className="text-2xl font-light">°F</span>
                </div>
                <p className="mt-1 text-sm text-white/80">Feels like {Math.round(conditions.feels_like)}°F</p>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="text-xs text-white/60">Humidity</p>
                    <p className="text-sm font-semibold">{conditions.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="text-xs text-white/60">Wind</p>
                    <p className="text-sm font-semibold">{conditions.wind_speed} mph {conditions.wind_direction}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="text-xs text-white/60">UV Index</p>
                    <p className="text-sm font-semibold">{conditions.uv_index}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CloudRain className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="text-xs text-white/60">Precipitation</p>
                    <p className="text-sm font-semibold">{conditions.precipitation_chance}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 7-Day Forecast Strip */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">7-Day Forecast</h2>
        {loadingForecast ? (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading forecast...</span>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(forecast || []).map((day, i) => (
              <div
                key={day.date}
                className={cn(
                  'flex min-w-[120px] flex-1 flex-col items-center gap-2 rounded-xl border p-4 transition-shadow hover:shadow-md',
                  i === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'
                )}
              >
                <span className={cn('text-xs font-semibold', i === 0 ? 'text-emerald-700' : 'text-gray-500')}>
                  {day.day}
                </span>
                <div className={cn(i === 0 ? 'text-emerald-600' : 'text-gray-400')}>
                  {getForecastIcon(day.icon, 'h-8 w-8')}
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-gray-900">{Math.round(day.high)}°</span>
                  <span className="mx-1 text-gray-300">/</span>
                  <span className="text-sm text-gray-400">{Math.round(day.low)}°</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <Droplets className="h-3 w-3" />
                  {day.precipitation_chance}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts Section */}
      <div>
        <div className="mb-3 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'pb-1 text-lg font-semibold transition-colors',
              activeTab === 'active' ? 'border-b-2 border-emerald-500 text-gray-900' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Active Alerts {alerts && alerts.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'pb-1 text-lg font-semibold transition-colors',
              activeTab === 'history' ? 'border-b-2 border-emerald-500 text-gray-900' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            History
          </button>
        </div>

        {activeTab === 'active' && (
          <>
            {loadingAlerts ? (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Loading alerts...</span>
              </div>
            ) : !alerts || alerts.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-emerald-300" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900">All Clear</h3>
                <p className="mt-1 text-sm text-gray-500">No active weather alerts. Conditions are safe for all activities.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const styles = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.advisory
                  return (
                    <div key={alert.id} className={cn('rounded-xl border p-5', styles.bg, styles.border)}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <AlertTriangle className={cn('h-5 w-5', styles.text)} />
                            <h3 className={cn('font-semibold', styles.text)}>{alert.title}</h3>
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', styles.badge)}>
                              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                            </span>
                          </div>
                          {alert.description && (
                            <p className={cn('mt-2 text-sm', styles.text, 'opacity-80')}>{alert.description}</p>
                          )}
                          {alert.affected_areas.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {alert.affected_areas.map((area) => (
                                <span key={area} className="rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                  {area}
                                </span>
                              ))}
                            </div>
                          )}
                          {alert.recommended_actions.length > 0 && (
                            <div className="mt-3">
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Recommended Actions</p>
                              <ul className="space-y-1">
                                {alert.recommended_actions.map((action, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Expires: {new Date(alert.expires_at).toLocaleString()}
                            </span>
                            {alert.acknowledged_by.length > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                {alert.acknowledged_by.length} acknowledged
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleDismiss(alert.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {loadingHistory ? (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Loading history...</span>
              </div>
            ) : !history || history.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900">No Alert History</h3>
                <p className="mt-1 text-sm text-gray-500">Past weather alerts will appear here.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Alert</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((alert) => {
                      const sevStyles = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.advisory
                      const statusColor =
                        alert.status === 'active' ? 'bg-green-100 text-green-800' :
                        alert.status === 'dismissed' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-800'
                      return (
                        <tr key={alert.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{alert.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}</td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', sevStyles.badge)}>
                              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusColor)}>
                              {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(alert.created_at).toLocaleDateString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreate && (
        <CreateAlertModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          isLoading={createAlert.isPending}
        />
      )}
    </div>
  )
}
