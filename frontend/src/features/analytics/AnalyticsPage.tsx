import { useState, useMemo } from 'react'
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
import { cn } from '@/lib/utils'
import {
  useEnrollmentTrends,
  useRevenueMetrics,
  useEventCapacity,
  useRegistrationStatus,
  useCommunicationStats,
  useCamperDemographics,
} from '@/hooks/useAnalytics'

// Chart color palette
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

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  iconBg: string
}

function StatCard({ label, value, icon: Icon, iconBg }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tracking-tight text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-100 bg-white shadow-sm p-6',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

export function AnalyticsPage() {
  const defaults = useMemo(() => getDefaultDateRange(), [])
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)

  // Fetch all analytics data
  const enrollment = useEnrollmentTrends(startDate, endDate)
  const revenue = useRevenueMetrics(startDate, endDate)
  const capacity = useEventCapacity()
  const regStatus = useRegistrationStatus(startDate, endDate)
  const comms = useCommunicationStats(startDate, endDate)
  const demographics = useCamperDemographics()

  const isLoading =
    enrollment.isLoading ||
    revenue.isLoading ||
    capacity.isLoading ||
    regStatus.isLoading ||
    comms.isLoading ||
    demographics.isLoading

  const hasError =
    enrollment.error ||
    revenue.error ||
    capacity.error ||
    regStatus.error ||
    comms.error ||
    demographics.error

  // Pie chart data for registration status
  const regPieData = regStatus.data
    ? [
        { name: 'Confirmed', value: regStatus.data.confirmed },
        { name: 'Pending', value: regStatus.data.pending },
        { name: 'Waitlisted', value: regStatus.data.waitlisted },
        { name: 'Cancelled', value: regStatus.data.cancelled },
      ].filter((d) => d.value > 0)
    : []

  // Gender pie data
  const genderPieData =
    demographics.data?.gender_distribution.map((g) => ({
      name: g.gender.charAt(0).toUpperCase() + g.gender.slice(1),
      value: g.count,
      fill: GENDER_COLORS[g.gender] || '#94a3b8',
    })) ?? []

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track enrollment, revenue, and camper insights across your
            organization.
          </p>
        </div>

        {/* Date Range Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="start-date"
              className="text-sm font-medium text-gray-600"
            >
              From
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="end-date"
              className="text-sm font-medium text-gray-600"
            >
              To
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            Failed to load some analytics data. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* KPI Stat Cards */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Registrations"
              value={regStatus.data?.total ?? 0}
              icon={Users}
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(revenue.data?.total_revenue ?? 0)}
              icon={DollarSign}
              iconBg="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Messages Sent"
              value={comms.data?.total_sent ?? 0}
              icon={MessageSquare}
              iconBg="bg-purple-50 text-purple-600"
            />
            <StatCard
              label="Delivery Rate"
              value={`${comms.data?.delivery_rate ?? 0}%`}
              icon={TrendingUp}
              iconBg="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Enrollment Trends */}
            <ChartCard title="Enrollment Trends">
              {enrollment.data?.trends && enrollment.data.trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={enrollment.data.trends}>
                    <defs>
                      <linearGradient
                        id="enrollGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLORS.blue}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.blue}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(val: string) =>
                        new Date(val).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      labelFormatter={(val) =>
                        new Date(String(val)).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      }
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={COLORS.blue}
                      strokeWidth={2}
                      fill="url(#enrollGradient)"
                      name="Registrations"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                  No enrollment data for this period.
                </div>
              )}
            </ChartCard>

            {/* Revenue by Period */}
            <ChartCard title="Revenue by Month">
              {revenue.data?.revenue_by_period &&
              revenue.data.revenue_by_period.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenue.data.revenue_by_period}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(val: number) =>
                        `$${(val / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        'Revenue',
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill={COLORS.emerald}
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                  No revenue data for this period.
                </div>
              )}
            </ChartCard>

            {/* Event Capacity */}
            <ChartCard title="Event Capacity Utilization">
              {capacity.data?.events && capacity.data.events.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={capacity.data.events.slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(val: number) => `${val}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="event_name"
                      width={120}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Utilization']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar
                      dataKey="utilization"
                      fill={COLORS.purple}
                      radius={[0, 4, 4, 0]}
                      name="Utilization %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                  No events with capacity data.
                </div>
              )}
            </ChartCard>

            {/* Registration Status */}
            <ChartCard title="Registration Status">
              {regPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={regPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {regPieData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                  No registration data for this period.
                </div>
              )}
            </ChartCard>

            {/* Communication Stats */}
            <ChartCard title="Communication Stats">
              {comms.data ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-4 w-4" />
                      Email Sent
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {comms.data.email_sent.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Smartphone className="h-4 w-4" />
                      SMS Sent
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {comms.data.sms_sent.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Delivered
                    </div>
                    <p className="mt-1 text-2xl font-bold text-emerald-600">
                      {comms.data.delivered.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Failed / Bounced
                    </div>
                    <p className="mt-1 text-2xl font-bold text-red-600">
                      {(
                        comms.data.failed + comms.data.bounced
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
                  No communication data available.
                </div>
              )}
            </ChartCard>

            {/* Demographics */}
            <ChartCard title="Camper Demographics">
              {demographics.data ? (
                <div className="space-y-6">
                  {/* Age Distribution Bar Chart */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-600">
                      Age Distribution
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={demographics.data.age_distribution}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="range"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill={COLORS.sky}
                          radius={[4, 4, 0, 0]}
                          name="Campers"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gender Distribution Pie Chart */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-600">
                      Gender Distribution
                    </p>
                    {genderPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={genderPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {genderPieData.map((entry, index) => (
                              <Cell key={`gender-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[180px] items-center justify-center text-sm text-gray-400">
                        No gender data available.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                  No demographic data available.
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
