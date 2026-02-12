/**
 * Camp Connect - Super Admin Organization Detail Page
 * Deep-dive into a specific organization's data, users, and settings.
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  UserCheck,
  Calendar,
  ClipboardList,
  MapPin,
  ArrowLeft,
  Globe,
  Settings,
  Eye,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useAdminOrgDetail,
  useUpdateOrganization,
  useImpersonateOrg,
} from '@/hooks/useAdmin'
import { useToast } from '@/components/ui/Toast'

const TIER_OPTIONS = ['free', 'starter', 'pro', 'enterprise']

const TIER_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700 ring-slate-200',
  starter: 'bg-blue-50 text-blue-700 ring-blue-200',
  pro: 'bg-violet-50 text-violet-700 ring-violet-200',
  enterprise: 'bg-amber-50 text-amber-700 ring-amber-200',
}

export function AdminOrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: org, isLoading } = useAdminOrgDetail(orgId || null)
  const updateOrg = useUpdateOrganization()
  const impersonate = useImpersonateOrg()

  const [changingTier, setChangingTier] = useState(false)
  const [selectedTier, setSelectedTier] = useState('')

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-64 rounded-xl bg-slate-100" />
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-slate-500">Organization not found</p>
        <button
          onClick={() => navigate('/admin/organizations')}
          className="mt-4 text-violet-600 text-sm"
        >
          Back to organizations
        </button>
      </div>
    )
  }

  const handleTierChange = async () => {
    if (!selectedTier || !orgId) return
    try {
      await updateOrg.mutateAsync({
        orgId,
        updates: { subscription_tier: selectedTier },
      })
      toast({ type: 'success', message: `Tier updated to ${selectedTier}` })
      setChangingTier(false)
    } catch {
      toast({ type: 'error', message: 'Failed to update tier' })
    }
  }

  const handleImpersonate = async () => {
    if (!orgId) return
    try {
      const result = await impersonate.mutateAsync(orgId)
      toast({
        type: 'success',
        message: result.message,
      })
    } catch {
      toast({ type: 'error', message: 'Failed to start impersonation' })
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/organizations')}
        className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to organizations
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="h-14 w-14 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Building2 className="h-7 w-7 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-500">/{org.slug}</span>
              {org.domain && (
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Globe className="h-3 w-3" /> {org.domain}
                </span>
              )}
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1',
                  TIER_COLORS[org.subscription_tier] || TIER_COLORS.free
                )}
              >
                {org.subscription_tier}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImpersonate}
            className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View as Org
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <Users className="mx-auto h-5 w-5 text-blue-500 mb-1" />
          <p className="text-xl font-bold text-slate-900">{org.stats.users}</p>
          <p className="text-xs text-slate-500">Users</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <UserCheck className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
          <p className="text-xl font-bold text-slate-900">{org.stats.campers}</p>
          <p className="text-xs text-slate-500">Campers</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <Calendar className="mx-auto h-5 w-5 text-pink-500 mb-1" />
          <p className="text-xl font-bold text-slate-900">{org.stats.events}</p>
          <p className="text-xs text-slate-500">Events</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <ClipboardList className="mx-auto h-5 w-5 text-amber-500 mb-1" />
          <p className="text-xl font-bold text-slate-900">
            {org.stats.registrations}
          </p>
          <p className="text-xs text-slate-500">Registrations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            Users ({org.users.length})
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {org.users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                      u.is_active ? 'bg-violet-500' : 'bg-slate-400'
                    )}
                  >
                    {u.first_name[0]}
                    {u.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {u.first_name} {u.last_name}
                      {u.platform_role === 'platform_admin' && (
                        <Crown className="inline ml-1 h-3 w-3 text-amber-500" />
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-700">
                    {u.role_name}
                  </p>
                  <span
                    className={cn(
                      'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      u.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    )}
                  >
                    {u.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            ))}
            {org.users.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No users
              </p>
            )}
          </div>
        </div>

        {/* Settings & Config */}
        <div className="space-y-6">
          {/* Locations */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-slate-400" />
              Locations ({org.locations.length})
            </h2>
            <div className="space-y-2">
              {org.locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {loc.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {[loc.city, loc.state, loc.zip_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                  {loc.is_primary && (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                      Primary
                    </span>
                  )}
                </div>
              ))}
              {org.locations.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No locations set
                </p>
              )}
            </div>
          </div>

          {/* Subscription Management */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-400" />
              Subscription
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Current Tier</span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1',
                    TIER_COLORS[org.subscription_tier] || TIER_COLORS.free
                  )}
                >
                  {org.subscription_tier}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Marketplace</span>
                <span className="text-sm text-slate-900">
                  {org.marketplace_visible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Modules</span>
                <span className="text-sm text-slate-900">
                  {org.enabled_modules?.length || 0} enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Created</span>
                <span className="text-sm text-slate-900">
                  {org.created_at
                    ? new Date(org.created_at).toLocaleDateString()
                    : 'Unknown'}
                </span>
              </div>

              {/* Change tier */}
              {!changingTier ? (
                <button
                  onClick={() => {
                    setSelectedTier(org.subscription_tier)
                    setChangingTier(true)
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Change Tier
                </button>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {TIER_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleTierChange}
                    disabled={updateOrg.isPending}
                    className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setChangingTier(false)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
