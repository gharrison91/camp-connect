/**
 * Camp Connect – Medical Dashboard
 * Health overview across all campers.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  Activity,
  AlertTriangle,
  FileCheck,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Pill,
} from 'lucide-react'
import {
  useMedicalDashboard,
  useCamperHealthList,
} from '@/hooks/useMedicalDashboard'
import type { CamperHealthEntry } from '@/hooks/useMedicalDashboard'

export function MedicalDashboardPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const perPage = 20

  const { data: stats, isLoading: statsLoading } = useMedicalDashboard()
  const { data: camperData, isLoading: listLoading } = useCamperHealthList({
    page,
    per_page: perPage,
    search,
    status,
  })

  const campers = camperData?.items || []
  const total = camperData?.total || 0
  const totalPages = Math.ceil(total / perPage)

  function parseTags(val: string | null): string[] {
    if (!val) return []
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
          <Heart className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Dashboard</h1>
          <p className="text-sm text-gray-500">Health overview for all campers</p>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : stats ? (
        <>
          {stats.compliance_rate < 90 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">
                <span className="font-medium">{stats.health_forms_pending} campers</span> still need to complete their health forms.
                Compliance rate: {stats.compliance_rate}%
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              { label: 'Total Campers', value: stats.total_campers, icon: Users, color: 'text-gray-600', bg: 'bg-gray-100' },
              { label: 'Forms Complete', value: stats.health_forms_completed, icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { label: 'Forms Pending', value: stats.health_forms_pending, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
              { label: 'Recent Incidents', value: stats.recent_incidents, icon: Shield, color: 'text-red-600', bg: 'bg-red-100' },
              { label: 'Compliance', value: `${stats.compliance_rate}%`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search campers by name..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="all">All Campers</option>
          <option value="complete">Forms Complete</option>
          <option value="incomplete">Forms Incomplete</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {listLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : campers.length === 0 ? (
          <div className="py-16 text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-lg font-medium text-gray-900">No campers found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Camper</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Age</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Allergies</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Medications</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Health Forms</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Notes</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campers.map((c: CamperHealthEntry) => {
                  const allergies = parseTags(c.allergies)
                  const meds = parseTags(c.medications)
                  const age = c.date_of_birth
                    ? Math.floor((Date.now() - new Date(c.date_of_birth).getTime()) / 31557600000)
                    : null
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.photo_url ? (
                            <img src={c.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                              {c.first_name[0]}{c.last_name[0]}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{c.first_name} {c.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{age !== null ? `${age}y` : '—'}</td>
                      <td className="px-4 py-3">
                        {allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {allergies.slice(0, 3).map((a) => (
                              <span key={a} className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                {a}
                              </span>
                            ))}
                            {allergies.length > 3 && (
                              <span className="text-[11px] text-gray-400">+{allergies.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {meds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {meds.slice(0, 3).map((m) => (
                              <span key={m} className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                <Pill className="h-2.5 w-2.5" />{m}
                              </span>
                            ))}
                            {meds.length > 3 && (
                              <span className="text-[11px] text-gray-400">+{meds.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.form_count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          <FileCheck className="h-3 w-3" />
                          {c.form_count > 0 ? `${c.form_count} complete` : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        <span className="truncate text-xs text-gray-500">{c.medical_notes || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/app/campers/${c.id}`}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
