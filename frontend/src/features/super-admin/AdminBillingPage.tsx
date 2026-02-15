/**
 * Camp Connect - Super Admin Billing Page
 * Track payments, subscriptions, and revenue across all organizations.
 */

import { useState } from 'react'
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Building2,
  Calendar,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

// Mock billing data - in production, this would come from Stripe/backend
const MOCK_REVENUE = {
  total_mrr: 4250,
  total_arr: 51000,
  active_subscriptions: 12,
  trial_accounts: 3,
  churn_rate: 2.1,
  growth_rate: 15.3,
}

const MOCK_SUBSCRIPTIONS = [
  {
    id: '1',
    org_name: 'Victory Ranch',
    org_id: 'org-1',
    tier: 'pro',
    amount: 499,
    status: 'active',
    next_billing: '2026-03-01',
    payment_method: 'visa ****4242',
    since: '2025-06-15',
  },
  {
    id: '2',
    org_name: 'Summer Adventure Camp',
    org_id: 'org-2',
    tier: 'enterprise',
    amount: 999,
    status: 'active',
    next_billing: '2026-03-05',
    payment_method: 'mastercard ****8888',
    since: '2025-01-10',
  },
  {
    id: '3',
    org_name: 'Pine Valley Retreat',
    org_id: 'org-3',
    tier: 'starter',
    amount: 99,
    status: 'active',
    next_billing: '2026-03-10',
    payment_method: 'visa ****1234',
    since: '2025-09-20',
  },
  {
    id: '4',
    org_name: 'Mountain Camp Co',
    org_id: 'org-4',
    tier: 'pro',
    amount: 499,
    status: 'past_due',
    next_billing: '2026-02-10',
    payment_method: 'amex ****5555',
    since: '2025-04-01',
  },
  {
    id: '5',
    org_name: 'Lakeside Adventures',
    org_id: 'org-5',
    tier: 'free',
    amount: 0,
    status: 'trial',
    next_billing: '2026-02-28',
    payment_method: null,
    since: '2026-02-01',
  },
]

const TIER_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700',
  starter: 'bg-blue-50 text-blue-700',
  pro: 'bg-violet-50 text-violet-700',
  enterprise: 'bg-amber-50 text-amber-700',
}

const STATUS_STYLES: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  active: { color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  past_due: { color: 'text-red-600 bg-red-50', icon: AlertCircle },
  trial: { color: 'text-amber-600 bg-amber-50', icon: Clock },
  cancelled: { color: 'text-slate-600 bg-slate-100', icon: AlertCircle },
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string
  value: string | number
  icon: typeof DollarSign
  color: string
  subtitle?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

export function AdminBillingPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const filteredSubs = MOCK_SUBSCRIPTIONS.filter((sub) => {
    const matchesSearch = sub.org_name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || sub.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Billing & Revenue</h1>
            <p className="text-sm text-slate-500">Track subscriptions and revenue across all organizations</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Monthly Revenue"
          value={`$${MOCK_REVENUE.total_mrr.toLocaleString()}`}
          icon={DollarSign}
          color="bg-emerald-500"
          subtitle={`$${MOCK_REVENUE.total_arr.toLocaleString()} ARR`}
        />
        <StatCard
          label="Active Subscriptions"
          value={MOCK_REVENUE.active_subscriptions}
          icon={CreditCard}
          color="bg-violet-500"
          subtitle={`${MOCK_REVENUE.trial_accounts} in trial`}
        />
        <StatCard
          label="Growth Rate"
          value={`+${MOCK_REVENUE.growth_rate}%`}
          icon={TrendingUp}
          color="bg-blue-500"
          subtitle="vs last month"
        />
        <StatCard
          label="Churn Rate"
          value={`${MOCK_REVENUE.churn_rate}%`}
          icon={Building2}
          color="bg-amber-500"
          subtitle="monthly"
        />
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Subscriptions</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations..."
                className="w-56 rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Next Billing
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubs.map((sub) => {
                const statusStyle = STATUS_STYLES[sub.status] || STATUS_STYLES.active
                const StatusIcon = statusStyle.icon

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{sub.org_name}</p>
                          <p className="text-xs text-slate-500">Since {new Date(sub.since).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                          TIER_COLORS[sub.tier]
                        )}
                      >
                        {sub.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">
                        {sub.amount > 0 ? `$${sub.amount}/mo` : 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                          statusStyle.color
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-sm text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(sub.next_billing).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sub.payment_method ? (
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                          {sub.payment_method}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/organizations/${sub.org_id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
                      >
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredSubs.length === 0 && (
          <div className="py-12 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No subscriptions found</p>
          </div>
        )}
      </div>
    </div>
  )
}
