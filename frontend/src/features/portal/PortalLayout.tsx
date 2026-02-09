/**
 * Camp Connect - PortalLayout
 * Simple layout for parent portal with top navigation.
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Tent, LogOut, Home, Camera, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const portalNav = [
  { label: 'Dashboard', icon: Home, path: '/portal' },
  { label: 'Photos', icon: Camera, path: '/portal/photos' },
  { label: 'Invoices', icon: Receipt, path: '/portal/invoices' },
]

export function PortalLayout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <Tent className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Camp Connect</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Parent Portal
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Navigation */}
        <div className="mx-auto max-w-5xl px-4">
          <nav className="-mb-px flex gap-1">
            {portalNav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/portal'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
