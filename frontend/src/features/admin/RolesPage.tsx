/**
 * Roles management page — list roles and manage permissions.
 */

import { useState, useEffect } from 'react'
import { Loader2, Shield, ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'

interface RoleData {
  id: string
  name: string
  description: string | null
  is_system: boolean
  permissions: string[]
  user_count: number
  created_at: string
}

interface PermissionRegistry {
  grouped: Record<string, Record<string, string[]>>
  flat: string[]
  total: number
}

export function RolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([])
  const [permRegistry, setPermRegistry] = useState<PermissionRegistry | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions'),
      ])
      setRoles(rolesRes.data)
      setPermRegistry(permsRes.data)
    } catch (err) {
      setError('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = async (roleId: string, permission: string) => {
    const role = roles.find((r) => r.id === roleId)
    if (!role) return

    setSaving(true)
    const hasPermission = role.permissions.includes(permission)
    const newPerms = hasPermission
      ? role.permissions.filter((p) => p !== permission)
      : [...role.permissions, permission]

    try {
      await api.put(`/roles/${roleId}`, { permissions: newPerms })
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Roles ({roles.length})
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Click a role to expand and manage its permissions.
        </p>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Role header */}
            <button
              onClick={() =>
                setExpandedRole(expandedRole === role.id ? null : role.id)
              }
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {role.name}
                    </span>
                    {role.is_system && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {role.user_count} user{role.user_count !== 1 ? 's' : ''} &middot;{' '}
                    {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {expandedRole === role.id ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {/* Expanded permission matrix */}
            {expandedRole === role.id && permRegistry && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                {Object.entries(permRegistry.grouped).map(([module, resources]) => (
                  <div key={module} className="mb-4 last:mb-0">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {module}
                    </h4>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(resources).map(([resource, actions]) =>
                        actions.map((action) => {
                          const perm = `${module}.${resource}.${action}`
                          const isChecked = role.permissions.includes(perm)
                          return (
                            <label
                              key={perm}
                              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm transition-colors hover:bg-white"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(role.id, perm)}
                                disabled={saving}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-slate-700">
                                {resource}.{action}
                              </span>
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
