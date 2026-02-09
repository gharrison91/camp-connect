/**
 * Settings layout with horizontal tab navigation.
 */

import { NavLink, Outlet } from 'react-router-dom'
import { Building2, MapPin, Shield, Users, Sliders, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'

const settingsTabs = [
  { label: 'Profile', icon: Building2, path: '/settings/profile', permission: null },
  { label: 'Locations', icon: MapPin, path: '/settings/locations', permission: 'core.locations.read' },
  { label: 'Roles', icon: Shield, path: '/settings/roles', permission: 'core.roles.manage' },
  { label: 'Users', icon: Users, path: '/settings/users', permission: 'core.users.read' },
  { label: 'General', icon: Sliders, path: '/settings/general', permission: 'core.settings.manage' },
  { label: 'Notifications', icon: Bell, path: '/settings/notifications', permission: 'core.settings.manage' },
] as const

export function SettingsLayout() {
  const { hasPermission } = usePermissions()

  const visibleTabs = settingsTabs.filter(
    (tab) => tab.permission === null || hasPermission(tab.permission)
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your organization settings and preferences.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Settings tabs">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      <Outlet />
    </div>
  )
}
