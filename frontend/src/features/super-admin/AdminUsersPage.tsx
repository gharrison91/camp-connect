/**
 * Camp Connect - Super Admin Users Page
 * View all users across all organizations.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Crown,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminUsers } from '@/hooks/useAdmin'

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminUsers({
    page,
    page_size: 20,
    search: search || undefined,
  })

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">All Users</h1>
        <p className="text-sm text-slate-500">
          {data ? `${data.total} total users across all organizations` : 'Loading...'}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Organization
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={6}>
                        <div className="h-4 animate-pulse rounded bg-slate-100 w-3/4" />
                      </td>
                    </tr>
                  ))
                : data?.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white',
                              u.is_active ? 'bg-violet-500' : 'bg-slate-400'
                            )}
                          >
                            {u.first_name[0]}
                            {u.last_name[0]}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {u.first_name} {u.last_name}
                          </span>
                          {u.platform_role === 'platform_admin' && (
                            <Crown className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/organizations/${u.organization_id}`}
                          className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
                        >
                          <Building2 className="h-3 w-3" />
                          {u.organization_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {u.role_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                            u.is_active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          )}
                        >
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* No results */}
        {!isLoading && data && data.users.length === 0 && (
          <div className="p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-slate-500">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > data.page_size && (
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
    </div>
  )
}
