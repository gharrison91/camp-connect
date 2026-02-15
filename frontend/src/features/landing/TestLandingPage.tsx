/**
 * Camp Connect - Test Landing Page
 * Quick access page with role-based login buttons for testing.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Tent,
  Users,
  UserCog,
  Shield,
  Baby,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

interface TestRole {
  id: string
  label: string
  sublabel: string
  icon: typeof Tent
  color: string
  bgColor: string
  email: string
  password: string
}

const TEST_ROLES: TestRole[] = [
  {
    id: 'camper',
    label: 'Camper',
    sublabel: 'Victory Ranch Camper',
    icon: Baby,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    email: 'camper@victoryranch.test',
    password: 'testpassword123',
  },
  {
    id: 'parent',
    label: 'Parent',
    sublabel: 'Victory Ranch Parent',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    email: 'parent@victoryranch.test',
    password: 'testpassword123',
  },
  {
    id: 'employee',
    label: 'Employee',
    sublabel: 'Victory Ranch Staff',
    icon: UserCog,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    email: 'staff@victoryranch.test',
    password: 'testpassword123',
  },
  {
    id: 'camp_owner',
    label: 'Camp Owner',
    sublabel: 'Victory Ranch Owner',
    icon: Tent,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    email: 'owner@victoryranch.test',
    password: 'testpassword123',
  },
  {
    id: 'platform_admin',
    label: 'Platform Admin',
    sublabel: 'Camp Connect Admin',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    email: 'admin@campconnect.test',
    password: 'testpassword123',
  },
]

export function TestLandingPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (role: TestRole) => {
    setLoadingRole(role.id)
    setError(null)

    try {
      const res = await api.post('/auth/login', {
        email: role.email,
        password: role.password,
      })

      const { access_token, user } = res.data
      setAuth(access_token, user)

      // Redirect based on role
      if (role.id === 'platform_admin') {
        navigate('/admin')
      } else if (role.id === 'parent' || role.id === 'camper') {
        navigate('/portal')
      } else {
        navigate('/app/dashboard')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(
        axiosErr?.response?.data?.detail ||
          `Failed to login as ${role.label}. Test user may not exist yet.`
      )
      setLoadingRole(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Tent className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Camp Connect</h1>
              <p className="text-xs text-slate-500">Test Environment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Quick Test Login
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            Select a role to quickly login and test the platform. All test
            accounts use the organization "Victory Ranch" except for Platform
            Admin.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Role Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEST_ROLES.map((role) => {
            const Icon = role.icon
            const isLoading = loadingRole === role.id

            return (
              <button
                key={role.id}
                onClick={() => handleLogin(role)}
                disabled={loadingRole !== null}
                className={cn(
                  'group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200',
                  role.bgColor,
                  loadingRole !== null && loadingRole !== role.id && 'opacity-50',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
                )}
              >
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110',
                    role.color
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <Icon className="h-7 w-7" />
                  )}
                </div>

                <div className="text-center">
                  <p className={cn('text-lg font-semibold', role.color)}>
                    {role.label}
                  </p>
                  <p className="text-sm text-slate-500">{role.sublabel}</p>
                </div>

                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100',
                    role.color
                  )}
                >
                  Login as {role.label}
                  <ChevronRight className="h-3 w-3" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Test Account Information
          </h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              <strong>Camper, Parent, Employee, Camp Owner:</strong> These
              accounts belong to the "Victory Ranch" organization. They have
              different permission levels within that organization.
            </p>
            <p>
              <strong>Platform Admin:</strong> This is your super admin account
              with access to the Camp Connect admin portal. You can manage all
              organizations, view analytics, and configure platform-wide
              settings.
            </p>
            <p className="text-slate-400 text-xs mt-4">
              Note: If test accounts don't exist, you'll need to create them via
              the admin portal or database seeding.
            </p>
          </div>
        </div>

        {/* Go to Full Landing Page */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/home')}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Go to full marketing landing page →
          </button>
        </div>
      </div>
    </div>
  )
}
