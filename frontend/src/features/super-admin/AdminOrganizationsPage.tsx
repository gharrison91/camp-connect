/**
 * Camp Connect - Super Admin Organizations Page
 * Lists all organizations with search, filter, and drill-down.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Search,
  Users,
  Calendar,
  ClipboardList,
  MapPin,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminOrganizations, type OrgSummary } from '@/hooks/useAdmin'

const TIER_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700',
  starter: 'bg-blue-50 text-blue-700',
  pro: 'bg-violet-50 text-violet-700',
  enterprise: 'bg-amber-50 text-amber-700',
}

function OrgCard({ org }: { org: OrgSummary }) {
  return (
    <Link
      to={`/admin/organizations/${org.id}`}
      className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-violet-300 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-violet-700 transition-colors">
              {org.name}
            </h3>
            <p className="text-xs text-slate-500">/{org.slug}</p>
          </div>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            TIER_COLORS[org.subscription_tier] || TIER_COLORS.free
          )}
        >
          {org.subscription_tier}
        </span>
      </div>

      {org.location && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <MapPin className="h-3 w-3" />
          <span>{org.location}</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <Users className="h-3 w-3" />
          </div>
          <p className="text-sm font-semibold text-slate-900">{org.user_count}</p>
          <p className="text-[10px] text-slate-500">Users</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <UserCheck className="h-3 w-3" />
          </div>
          <p className="text-sm font-semibold text-slate-900">{org.camper_count}</p>
          <p className="text-[10px] text-slate-500">Campers</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <Calendar className="h-3 w-3" />
          </div>
          <p className="text-sm font-semibold text-slate-900">{org.event_count}</p>
          <p className="text-[10px] text-slate-500">Events</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <ClipboardList className="h-3 w-3" />
          </div>
          <p className="text-sm font-semibold text-slate-900">{org.registration_count}</p>
          <p className="text-[10px] text-slate-500">Regs</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>
          Joined{' '}
          {org.created_at
            ? new Date(org.created_at).toLocaleDateString()
            : 'Unknown'}
        </span>
        <span className="flex items-center gap-1 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
          View details <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}

export function AdminOrganizationsPage() {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminOrganizations({
    page,
    page_size: 20,
    search: search || undefined,
    tier: tierFilter || undefined,
    sort_by: 'created_at',
    sort_dir: 'desc',
  })

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
        <p className="text-sm text-slate-500">
          {data ? `${data.total} total organizations` : 'Loading...'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search organizations..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
        >
          <option value="">All Tiers</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Org Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : data && data.organizations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.organizations.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>

          {/* Pagination */}
          {data.total > data.page_size && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {data.page} of {Math.ceil(data.total / data.page_size)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(data.total / data.page_size)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500">No organizations found</p>
          {search && (
            <button
              onClick={() => {
                setSearch('')
                setPage(1)
              }}
              className="mt-2 text-sm text-violet-600 hover:text-violet-700"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  )
}
