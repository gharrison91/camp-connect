import { useState, useMemo, useCallback } from 'react'
import {
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  Loader2,
  AlertCircle,
  Mail,
  Smartphone,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  GripVertical,
  Edit3,
  Save,
  RotateCcw,
  LayoutGrid,
  Calendar,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import {
  ResponsiveGridLayout,
  useContainerWidth,
} from 'react-grid-layout'
import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { cn } from '@/lib/utils'
import {
  useEnrollmentTrends,
  useRevenueMetrics,
  useEventCapacity,
  useRegistrationStatus,
  useCommunicationStats,
  useCamperDemographics,
} from '@/hooks/useAnalytics'
import { useDashboardStats } from '@/hooks/useDashboard'

// ─── Color Palette ──────────────────────────────────────────
const COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  sky: '#0ea5e9',
  pink: '#ec4899',
  indigo: '#6366f1',
}

const PIE_COLORS = [COLORS.blue, COLORS.emerald, COLORS.amber, COLORS.red]

const GENDER_COLORS: Record<string, string> = {
  male: COLORS.blue,
  female: COLORS.pink,
  other: COLORS.purple,
  unspecified: '#94a3b8',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 90)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// ─── Widget Definitions ─────────────────────────────────────

interface WidgetDef {
  id: string
  type: 'kpi' | 'chart'
  label: string
  icon: React.ElementType
  defaultW: number
  defaultH: number
  minW?: number
  minH?: number
  category: 'KPI' | 'Chart'
}

const WIDGET_CATALOG: WidgetDef[] = [
  { id: 'kpi_registrations', type: 'kpi', label: 'Total Registrations', icon: Users, defaultW: 3, defaultH: 2, minW: 2, minH: 2, category: 'KPI' },
  { id: 'kpi_revenue', type: 'kpi', label: 'Total Revenue', icon: DollarSign, defaultW: 3, defaultH: 2, minW: 2, minH: 2, category: 'KPI' },
  { id: 'kpi_messages', type: 'kpi', label: 'Messages Sent', icon: MessageSquare, defaultW: 3, defaultH: 2, minW: 2, minH: 2, category: 'KPI' },
  { id: 'kpi_delivery_rate', type: 'kpi', label: 'Delivery Rate', icon: TrendingUp, defaultW: 3, defaultH: 2, minW: 2, minH: 2, category: 'KPI' },
  { id: 'kpi_campers', type: 'kpi', label: 'Total Campers', icon: Users, defaultW: 3, defaultH: 2, minW: 2, minH: 2, category: 'KPI' },
  { id: 'kpi_events', type: 'kpi', label: 'Total Events', icon: Calendar, defaultW: 3, defaultH: 2, minW: 2, minH: 2, category: 'KPI' },
  { id: 'kpi_upcoming', type: 'kpi', label: 'Upcoming Events', icon: Calendar, defaultW: 3, defaultH: 2, minW: 2, minH: 2, category: 'KPI' },
  { id: 'chart_enrollment', type: 'chart', label: 'Enrollment Trends', icon: TrendingUp, defaultW: 6, defaultH: 5, minW: 4, minH: 4, category: 'Chart' },
  { id: 'chart_revenue', type: 'chart', label: 'Revenue by Month', icon: DollarSign, defaultW: 6, defaultH: 5, minW: 4, minH: 4, category: 'Chart' },
  { id: 'chart_capacity', type: 'chart', label: 'Event Capacity', icon: LayoutGrid, defaultW: 6, defaultH: 5, minW: 4, minH: 4, category: 'Chart' },
  { id: 'chart_reg_status', type: 'chart', label: 'Registration Status', icon: CheckCircle2, defaultW: 6, defaultH: 5, minW: 4, minH: 4, category: 'Chart' },
  { id: 'chart_comms', type: 'chart', label: 'Communication Stats', icon: Mail, defaultW: 6, defaultH: 4, minW: 4, minH: 3, category: 'Chart' },
  { id: 'chart_demographics', type: 'chart', label: 'Camper Demographics', icon: Users, defaultW: 6, defaultH: 6, minW: 4, minH: 5, category: 'Chart' },
]

// ─── Default Layout ─────────────────────────────────────────

const DEFAULT_WIDGETS = [
  'kpi_registrations', 'kpi_revenue', 'kpi_messages', 'kpi_delivery_rate',
  'chart_enrollment', 'chart_revenue', 'chart_capacity', 'chart_reg_status',
  'chart_comms', 'chart_demographics',
]

function getDefaultLayout(): LayoutItem[] {
  return [
    { i: 'kpi_registrations', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'kpi_revenue', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'kpi_messages', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'kpi_delivery_rate', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'chart_enrollment', x: 0, y: 2, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'chart_revenue', x: 6, y: 2, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'chart_capacity', x: 0, y: 7, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'chart_reg_status', x: 6, y: 7, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'chart_comms', x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'chart_demographics', x: 6, y: 12, w: 6, h: 6, minW: 4, minH: 5 },
  ]
}

interface SavedConfig {
  widgets: string[]
  layouts: Record<string, LayoutItem[]>
}

function loadSavedConfig(): SavedConfig | null {
  try {
    const saved = localStorage.getItem('cc_dashboard_config')
    if (saved) return JSON.parse(saved) as SavedConfig
  } catch { /* ignore */ }
  return null
}

function saveConfig(widgets: string[], allLayouts: Record<string, LayoutItem[]>) {
  try {
    localStorage.setItem('cc_dashboard_config', JSON.stringify({ widgets, layouts: allLayouts }))
  } catch { /* ignore */ }
}

// ─── Data Type ──────────────────────────────────────────────

interface WidgetData {
  enrollment?: { trends: Array<{ date: string; count: number }> }
  revenue?: { total_revenue: number; revenue_by_period: Array<{ period: string; amount: number }> }
  capacity?: { events: Array<{ event_name: string; utilization: number }> }
  regStatus?: { total: number; confirmed: number; pending: number; waitlisted: number; cancelled: number }
  comms?: { total_sent: number; delivery_rate: number; email_sent: number; sms_sent: number; delivered: number; failed: number; bounced: number }
  demographics?: { age_distribution: Array<{ range: string; count: number }>; gender_distribution: Array<{ gender: string; count: number }> }
  dashStats?: { total_campers: number; total_events: number; upcoming_events: number; total_registrations: number }
}

// ─── Widget Renderer ────────────────────────────────────────

function WidgetContent({ widgetId, data }: { widgetId: string; data: WidgetData }) {
  switch (widgetId) {
    case 'kpi_registrations':
      return <KpiWidget label="Total Registrations" value={data.regStatus?.total ?? 0} icon={Users} iconBg="bg-blue-50 text-blue-600" />
    case 'kpi_revenue':
      return <KpiWidget label="Total Revenue" value={formatCurrency(data.revenue?.total_revenue ?? 0)} icon={DollarSign} iconBg="bg-emerald-50 text-emerald-600" />
    case 'kpi_messages':
      return <KpiWidget label="Messages Sent" value={data.comms?.total_sent ?? 0} icon={MessageSquare} iconBg="bg-purple-50 text-purple-600" />
    case 'kpi_delivery_rate':
      return <KpiWidget label="Delivery Rate" value={`${data.comms?.delivery_rate ?? 0}%`} icon={TrendingUp} iconBg="bg-amber-50 text-amber-600" />
    case 'kpi_campers':
      return <KpiWidget label="Total Campers" value={data.dashStats?.total_campers ?? 0} icon={Users} iconBg="bg-sky-50 text-sky-600" />
    case 'kpi_events':
      return <KpiWidget label="Total Events" value={data.dashStats?.total_events ?? 0} icon={Calendar} iconBg="bg-indigo-50 text-indigo-600" />
    case 'kpi_upcoming':
      return <KpiWidget label="Upcoming Events" value={data.dashStats?.upcoming_events ?? 0} icon={Calendar} iconBg="bg-emerald-50 text-emerald-600" />
    case 'chart_enrollment':
      return <EnrollmentChart data={data.enrollment?.trends} />
    case 'chart_revenue':
      return <RevenueChart data={data.revenue?.revenue_by_period} />
    case 'chart_capacity':
      return <CapacityChart data={data.capacity?.events} />
    case 'chart_reg_status':
      return <RegStatusChart data={data.regStatus} />
    case 'chart_comms':
      return <CommsWidget data={data.comms} />
    case 'chart_demographics':
      return <DemographicsChart data={data.demographics} />
    default:
      return <div className="flex items-center justify-center h-full text-sm text-gray-400">Unknown widget</div>
  }
}

// ─── KPI Widget ─────────────────────────────────────────────

function KpiWidget({ label, value, icon: Icon, iconBg }: { label: string; value: string | number; icon: React.ElementType; iconBg: string }) {
  return (
    <div className="flex h-full items-center gap-4 p-5">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBg)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold tracking-tight text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="mt-0.5 text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

// ─── Chart Widgets ──────────────────────────────────────────

function EmptyChart({ message }: { message: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-gray-400">{message}</div>
}

function EnrollmentChart({ data }: { data?: Array<{ date: string; count: number }> }) {
  if (!data || data.length === 0) return <EmptyChart message="No enrollment data for this period." />
  return (
    <div className="flex h-full flex-col p-4 pt-2">
      <p className="mb-2 text-sm font-semibold text-gray-900">Enrollment Trends</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
            <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <Area type="monotone" dataKey="count" stroke={COLORS.blue} strokeWidth={2} fill="url(#enrollGradient)" name="Registrations" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function RevenueChart({ data }: { data?: Array<{ period: string; amount: number }> }) {
  if (!data || data.length === 0) return <EmptyChart message="No revenue data for this period." />
  return (
    <div className="flex h-full flex-col p-4 pt-2">
      <p className="mb-2 text-sm font-semibold text-gray-900">Revenue by Month</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <Bar dataKey="amount" fill={COLORS.emerald} radius={[4, 4, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CapacityChart({ data }: { data?: Array<{ event_name: string; utilization: number }> }) {
  if (!data || data.length === 0) return <EmptyChart message="No events with capacity data." />
  return (
    <div className="flex h-full flex-col p-4 pt-2">
      <p className="mb-2 text-sm font-semibold text-gray-900">Event Capacity Utilization</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v: number) => `${v}%`} />
            <YAxis type="category" dataKey="event_name" width={120} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <Tooltip formatter={(value) => [`${value}%`, 'Utilization']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <Bar dataKey="utilization" fill={COLORS.purple} radius={[0, 4, 4, 0]} name="Utilization %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function RegStatusChart({ data }: { data?: { confirmed: number; pending: number; waitlisted: number; cancelled: number } }) {
  const pieData = data
    ? [
        { name: 'Confirmed', value: data.confirmed },
        { name: 'Pending', value: data.pending },
        { name: 'Waitlisted', value: data.waitlisted },
        { name: 'Cancelled', value: data.cancelled },
      ].filter((d) => d.value > 0)
    : []
  if (pieData.length === 0) return <EmptyChart message="No registration data." />
  return (
    <div className="flex h-full flex-col p-4 pt-2">
      <p className="mb-2 text-sm font-semibold text-gray-900">Registration Status</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
              {pieData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CommsWidget({ data }: { data?: { email_sent: number; sms_sent: number; delivered: number; failed: number; bounced: number } }) {
  if (!data) return <EmptyChart message="No communication data." />
  return (
    <div className="grid h-full grid-cols-2 gap-3 p-4">
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3.5 w-3.5" /> Email</div>
        <p className="mt-1 text-xl font-bold text-gray-900">{data.email_sent.toLocaleString()}</p>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><Smartphone className="h-3.5 w-3.5" /> SMS</div>
        <p className="mt-1 text-xl font-bold text-gray-900">{data.sms_sent.toLocaleString()}</p>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Delivered</div>
        <p className="mt-1 text-xl font-bold text-emerald-600">{data.delivered.toLocaleString()}</p>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><XCircle className="h-3.5 w-3.5 text-red-500" /> Failed</div>
        <p className="mt-1 text-xl font-bold text-red-600">{(data.failed + data.bounced).toLocaleString()}</p>
      </div>
    </div>
  )
}

function DemographicsChart({ data }: { data?: { age_distribution: Array<{ range: string; count: number }>; gender_distribution: Array<{ gender: string; count: number }> } }) {
  if (!data) return <EmptyChart message="No demographic data." />
  const genderPie = data.gender_distribution.map((g) => ({
    name: g.gender.charAt(0).toUpperCase() + g.gender.slice(1),
    value: g.count,
    fill: GENDER_COLORS[g.gender] || '#94a3b8',
  }))
  return (
    <div className="flex h-full flex-col p-4 pt-2">
      <p className="mb-2 text-sm font-semibold text-gray-900">Camper Demographics</p>
      <div className="flex-1 min-h-0">
        <p className="mb-1 text-xs font-medium text-gray-500">Age Distribution</p>
        <ResponsiveContainer width="100%" height="45%">
          <BarChart data={data.age_distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <Bar dataKey="count" fill={COLORS.sky} radius={[4, 4, 0, 0]} name="Campers" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 min-h-0">
        <p className="mb-1 text-xs font-medium text-gray-500">Gender Distribution</p>
        {genderPie.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={genderPie} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={4} dataKey="value">
                {genderPie.map((entry, index) => (<Cell key={`g-${index}`} fill={entry.fill} />))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">No gender data.</div>
        )}
      </div>
    </div>
  )
}

// ─── Widget Library Panel ───────────────────────────────────

function WidgetLibrary({ activeWidgets, onAdd, onClose }: { activeWidgets: string[]; onAdd: (id: string) => void; onClose: () => void }) {
  const kpis = WIDGET_CATALOG.filter((w) => w.category === 'KPI')
  const charts = WIDGET_CATALOG.filter((w) => w.category === 'Chart')

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 border-l border-gray-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">Add Widget</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="overflow-y-auto p-5 space-y-6" style={{ maxHeight: 'calc(100vh - 60px)' }}>
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">KPI Cards</p>
          <div className="space-y-2">
            {kpis.map((w) => {
              const isActive = activeWidgets.includes(w.id)
              const Icon = w.icon
              return (
                <button key={w.id} disabled={isActive} onClick={() => onAdd(w.id)} className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors', isActive ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50')}>
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{w.label}</span>
                  {isActive ? <span className="ml-auto text-xs text-gray-400">Added</span> : <Plus className="ml-auto h-4 w-4 text-blue-500" />}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Charts</p>
          <div className="space-y-2">
            {charts.map((w) => {
              const isActive = activeWidgets.includes(w.id)
              const Icon = w.icon
              return (
                <button key={w.id} disabled={isActive} onClick={() => onAdd(w.id)} className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors', isActive ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50')}>
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{w.label}</span>
                  {isActive ? <span className="ml-auto text-xs text-gray-400">Added</span> : <Plus className="ml-auto h-4 w-4 text-blue-500" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────

export function AnalyticsPage() {
  const defaults = useMemo(() => getDefaultDateRange(), [])
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)

  const savedConfig = useMemo(() => loadSavedConfig(), [])
  const [activeWidgets, setActiveWidgets] = useState<string[]>(savedConfig?.widgets ?? DEFAULT_WIDGETS)
  const [layouts, setLayouts] = useState<Record<string, LayoutItem[]>>(savedConfig?.layouts ?? { lg: getDefaultLayout() })
  const [editMode, setEditMode] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)

  // Container width for responsive grid
  const { width: containerWidth, containerRef } = useContainerWidth({ measureBeforeMount: true })

  // Fetch all analytics data
  const enrollment = useEnrollmentTrends(startDate, endDate)
  const revenue = useRevenueMetrics(startDate, endDate)
  const capacity = useEventCapacity()
  const regStatus = useRegistrationStatus(startDate, endDate)
  const comms = useCommunicationStats(startDate, endDate)
  const demographics = useCamperDemographics()
  const dashStats = useDashboardStats()

  const isLoading = enrollment.isLoading || revenue.isLoading || capacity.isLoading || regStatus.isLoading || comms.isLoading || demographics.isLoading
  const hasError = enrollment.error || revenue.error || capacity.error || regStatus.error || comms.error || demographics.error

  const widgetData: WidgetData = {
    enrollment: enrollment.data ?? undefined,
    revenue: revenue.data ?? undefined,
    capacity: capacity.data ?? undefined,
    regStatus: regStatus.data ?? undefined,
    comms: comms.data ?? undefined,
    demographics: demographics.data ?? undefined,
    dashStats: dashStats.data ?? undefined,
  }

  // Convert our stored layouts to ResponsiveLayouts format
  const responsiveLayouts: ResponsiveLayouts = useMemo(() => {
    const result: Record<string, readonly LayoutItem[]> = {}
    for (const [bp, items] of Object.entries(layouts)) {
      result[bp] = items
    }
    return result
  }, [layouts])

  const handleLayoutChange = useCallback((_currentLayout: readonly LayoutItem[], allLayouts: ResponsiveLayouts) => {
    const mutable: Record<string, LayoutItem[]> = {}
    for (const [bp, items] of Object.entries(allLayouts)) {
      if (items) {
        mutable[bp] = [...items]
      }
    }
    setLayouts(mutable)
  }, [])

  const handleSave = useCallback(() => {
    saveConfig(activeWidgets, layouts)
    setEditMode(false)
    setShowLibrary(false)
  }, [activeWidgets, layouts])

  const handleReset = useCallback(() => {
    setActiveWidgets(DEFAULT_WIDGETS)
    setLayouts({ lg: getDefaultLayout() })
    localStorage.removeItem('cc_dashboard_config')
    setEditMode(false)
    setShowLibrary(false)
  }, [])

  const handleAddWidget = useCallback((widgetId: string) => {
    if (activeWidgets.includes(widgetId)) return
    const def = WIDGET_CATALOG.find((w) => w.id === widgetId)
    if (!def) return
    const newWidgets = [...activeWidgets, widgetId]
    setActiveWidgets(newWidgets)
    const currentLayout: LayoutItem[] = [...(layouts.lg ?? [])]
    const maxY = currentLayout.reduce((max: number, item: LayoutItem) => Math.max(max, item.y + item.h), 0)
    const newItem: LayoutItem = { i: widgetId, x: 0, y: maxY, w: def.defaultW, h: def.defaultH, minW: def.minW, minH: def.minH }
    setLayouts({ ...layouts, lg: [...currentLayout, newItem] })
  }, [activeWidgets, layouts])

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setActiveWidgets((prev) => prev.filter((id) => id !== widgetId))
    setLayouts((prev) => ({ ...prev, lg: [...(prev.lg ?? [])].filter((item) => item.i !== widgetId) }))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Track enrollment, revenue, and camper insights.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="start-date" className="text-sm font-medium text-gray-600">From</label>
            <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="end-date" className="text-sm font-medium text-gray-600">To</label>
            <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="h-6 w-px bg-gray-200" />
          {editMode ? (
            <>
              <button onClick={() => setShowLibrary(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100">
                <Plus className="h-3.5 w-3.5" /> Add Widget
              </button>
              <button onClick={handleReset} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
              <Edit3 className="h-3.5 w-3.5" /> Edit Layout
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {hasError && !isLoading && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>Failed to load some analytics data. Please try refreshing.</p>
        </div>
      )}

      {!isLoading && (
        <div ref={containerRef}>
          <ResponsiveGridLayout
            className="layout"
            width={containerWidth || 1200}
            layouts={responsiveLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={40}
            dragConfig={{ enabled: editMode, handle: '.widget-drag-handle' }}
            resizeConfig={{ enabled: editMode }}
            onLayoutChange={handleLayoutChange}
          >
            {activeWidgets.map((widgetId) => (
              <div key={widgetId} className={cn('overflow-hidden rounded-xl border bg-white shadow-sm', editMode ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100')}>
                {editMode && (
                  <div className="widget-drag-handle flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-3 py-1.5 cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">{WIDGET_CATALOG.find((w) => w.id === widgetId)?.label ?? widgetId}</span>
                    </div>
                    <button onClick={() => handleRemoveWidget(widgetId)} className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Remove widget">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <WidgetContent widgetId={widgetId} data={widgetData} />
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}

      {showLibrary && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowLibrary(false)} />
          <WidgetLibrary activeWidgets={activeWidgets} onAdd={handleAddWidget} onClose={() => setShowLibrary(false)} />
        </>
      )}
    </div>
  )
}
