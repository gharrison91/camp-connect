/**
 * Roles management page — list roles and manage permissions.
 * Displays human-readable permission labels with tooltips and module grouping.
 */

import { useState, useEffect } from 'react'
import { Loader2, Shield, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

// ─── Permission Labels ──────────────────────────────────────

interface PermissionMeta {
  label: string
  description: string
}

const PERMISSION_LABELS: Record<string, PermissionMeta> = {
  'core.events.read': { label: 'View Events', description: 'View camp sessions and event details' },
  'core.events.create': { label: 'Create Events', description: 'Create new camp sessions and events' },
  'core.events.update': { label: 'Edit Events', description: 'Modify existing events and sessions' },
  'core.events.delete': { label: 'Delete Events', description: 'Remove events from the system' },
  'core.campers.read': { label: 'View Campers', description: 'Access camper profiles and records' },
  'core.campers.create': { label: 'Add Campers', description: 'Register new campers' },
  'core.campers.update': { label: 'Edit Campers', description: 'Update camper information' },
  'core.campers.delete': { label: 'Remove Campers', description: 'Delete camper records' },
  'core.contacts.read': { label: 'View Contacts', description: 'Access contact/parent information' },
  'core.contacts.create': { label: 'Add Contacts', description: 'Add new contacts and parents' },
  'core.contacts.update': { label: 'Edit Contacts', description: 'Update contact details' },
  'core.contacts.delete': { label: 'Remove Contacts', description: 'Delete contact records' },
  'core.registrations.read': { label: 'View Registrations', description: 'See enrollment records' },
  'core.registrations.create': { label: 'Create Registrations', description: 'Enroll campers in events' },
  'core.registrations.update': { label: 'Edit Registrations', description: 'Modify enrollment details' },
  'core.registrations.delete': { label: 'Cancel Registrations', description: 'Cancel or remove enrollments' },
  'core.families.read': { label: 'View Families', description: 'Access family group info' },
  'core.families.create': { label: 'Create Families', description: 'Create family groupings' },
  'core.families.update': { label: 'Edit Families', description: 'Modify family relationships' },
  'core.families.delete': { label: 'Remove Families', description: 'Delete family records' },
  'core.activities.read': { label: 'View Activities', description: 'See camp activities list' },
  'core.activities.create': { label: 'Create Activities', description: 'Add new camp activities' },
  'core.activities.update': { label: 'Edit Activities', description: 'Modify activity details' },
  'core.activities.delete': { label: 'Remove Activities', description: 'Delete activities' },
  'core.bunks.read': { label: 'View Bunks', description: 'Access bunk/cabin info' },
  'core.bunks.update': { label: 'Manage Bunks', description: 'Assign campers and configure bunks' },
  'core.bunks.delete': { label: 'Remove Bunks', description: 'Delete bunk records' },
  'comms.messages.read': { label: 'View Messages', description: 'Read sent and received messages' },
  'comms.messages.send': { label: 'Send Messages', description: 'Send emails and SMS messages' },
  'comms.templates.manage': { label: 'Manage Templates', description: 'Create and edit message templates' },
  'health.forms.read': { label: 'View Health Forms', description: 'Access medical and health information' },
  'health.forms.manage': { label: 'Manage Health Forms', description: 'Create and update health records' },
  'staff.employees.read': { label: 'View Staff', description: 'Access staff directory and profiles' },
  'staff.employees.manage': { label: 'Manage Staff', description: 'Edit staff info and assignments' },
  'photos.media.view': { label: 'View Photos', description: 'Browse photo galleries' },
  'photos.media.upload': { label: 'Upload Photos', description: 'Upload new photos and media' },
  'photos.media.manage': { label: 'Manage Photos', description: 'Edit, tag, and delete photos' },
  'scheduling.sessions.read': { label: 'View Schedule', description: 'Access the camp schedule' },
  'scheduling.sessions.manage': { label: 'Manage Schedule', description: 'Create and modify schedules' },
  'payments.invoices.read': { label: 'View Payments', description: 'Access payment and invoice records' },
  'payments.invoices.manage': { label: 'Manage Payments', description: 'Process payments and invoices' },
  'analytics.dashboards.read': { label: 'View Analytics', description: 'Access dashboards and reports' },
  'reports.export.read': { label: 'View Reports', description: 'Access and export reports' },
  'store.manage.manage': { label: 'Manage Store', description: 'Configure camp store and inventory' },
}

const MODULE_LABELS: Record<string, string> = {
  core: 'Core Platform',
  comms: 'Communications',
  health: 'Health & Safety',
  staff: 'Staff Management',
  photos: 'Photos & Media',
  scheduling: 'Scheduling',
  payments: 'Payments & Billing',
  analytics: 'Analytics',
  reports: 'Reports',
  store: 'Camp Store',
}

// ─── Types ───────────────────────────────────────────────────

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

// ─── Tooltip Component ──────────────────────────────────────

function PermTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="ml-1 text-slate-400 hover:text-slate-600"
        tabIndex={-1}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg">
          {text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  )
}

// ─── Main Component ─────────────────────────────────────────

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
    } catch {
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
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } }
      setError(apiErr.response?.data?.detail || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const getPermLabel = (perm: string): string => {
    return PERMISSION_LABELS[perm]?.label || perm
  }

  const getPermDescription = (perm: string): string | null => {
    return PERMISSION_LABELS[perm]?.description || null
  }

  const getModuleLabel = (module: string): string => {
    return MODULE_LABELS[module] || module.charAt(0).toUpperCase() + module.slice(1)
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
                  <div key={module} className="mb-5 last:mb-0">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-px flex-1 bg-slate-200" />
                      <h4 className="shrink-0 text-xs font-bold uppercase tracking-wider text-emerald-600">
                        {getModuleLabel(module)}
                      </h4>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(resources).map(([resource, actions]) =>
                        actions.map((action) => {
                          const perm = `${module}.${resource}.${action}`
                          const isChecked = role.permissions.includes(perm)
                          const description = getPermDescription(perm)
                          return (
                            <label
                              key={perm}
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-white',
                                isChecked && 'bg-emerald-50/50'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(role.id, perm)}
                                disabled={saving}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className={cn(
                                'text-slate-700',
                                isChecked && 'font-medium'
                              )}>
                                {getPermLabel(perm)}
                              </span>
                              {description && <PermTooltip text={description} />}
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
