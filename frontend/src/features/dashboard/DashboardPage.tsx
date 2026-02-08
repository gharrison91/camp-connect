import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCard {
  label: string
  value: string
  icon: React.ElementType
  change?: string
  changeType?: 'positive' | 'warning'
}

const stats: StatCard[] = [
  {
    label: 'Total Campers',
    value: '1,247',
    icon: Users,
    change: '+12%',
    changeType: 'positive',
  },
  {
    label: 'Active Events',
    value: '8',
    icon: Calendar,
  },
  {
    label: 'Revenue',
    value: '$342,580',
    icon: DollarSign,
    change: '+8.3%',
    changeType: 'positive',
  },
  {
    label: 'Capacity Utilization',
    value: '87%',
    icon: TrendingUp,
  },
  {
    label: 'Upcoming Events',
    value: '4',
    icon: Clock,
  },
  {
    label: 'Pending Forms',
    value: '23',
    icon: FileText,
    change: '23 awaiting',
    changeType: 'warning',
  },
]

interface Registration {
  id: string
  camperName: string
  event: string
  date: string
  status: 'Confirmed' | 'Pending' | 'Waitlisted'
}

const recentRegistrations: Registration[] = [
  {
    id: '1',
    camperName: 'Emma Thompson',
    event: 'Week 1: Adventure Camp',
    date: 'Feb 6, 2026',
    status: 'Confirmed',
  },
  {
    id: '2',
    camperName: 'Liam Chen',
    event: 'Week 3: Leadership Camp',
    date: 'Feb 5, 2026',
    status: 'Pending',
  },
  {
    id: '3',
    camperName: 'Sophia Martinez',
    event: 'Week 2: Explorer Camp',
    date: 'Feb 5, 2026',
    status: 'Waitlisted',
  },
  {
    id: '4',
    camperName: 'Noah Williams',
    event: 'Week 1: Adventure Camp',
    date: 'Feb 4, 2026',
    status: 'Confirmed',
  },
  {
    id: '5',
    camperName: 'Olivia Davis',
    event: 'Week 4: Junior Camp',
    date: 'Feb 4, 2026',
    status: 'Confirmed',
  },
]

const statusColors: Record<Registration['status'], string> = {
  Confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Waitlisted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Welcome back, Gray
        </h1>
        <p className="mt-1 text-sm text-gray-500">{formatDate()}</p>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
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
                    stat.changeType === 'warning'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">{stat.label}</p>
                </div>
                {stat.change && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                      stat.changeType === 'positive'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {stat.changeType === 'positive' && (
                      <ArrowUpRight className="h-3 w-3" />
                    )}
                    {stat.change}
                  </span>
                )}
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
              {recentRegistrations.map((reg) => (
                <tr
                  key={reg.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {reg.camperName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {reg.event}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {reg.date}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                        statusColors[reg.status]
                      )}
                    >
                      {reg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
