/**
 * Camp Connect - Super Admin Hooks
 * React Query hooks for platform-level admin operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────

export interface PlatformStats {
  total_organizations: number
  total_users: number
  total_campers: number
  total_events: number
  total_registrations: number
  active_organizations: number
  orgs_by_tier: Record<string, number>
  recent_signups: number
  growth_rate: number
}

export interface OrgSummary {
  id: string
  name: string
  slug: string
  logo_url: string | null
  subscription_tier: string
  user_count: number
  camper_count: number
  event_count: number
  registration_count: number
  location: string | null
  created_at: string | null
  is_active: boolean
}

export interface OrgListResponse {
  organizations: OrgSummary[]
  total: number
  page: number
  page_size: number
}

export interface OrgDetail {
  id: string
  name: string
  slug: string
  logo_url: string | null
  domain: string | null
  subscription_tier: string
  enabled_modules: string[]
  settings: Record<string, unknown>
  marketplace_visible: boolean
  created_at: string | null
  updated_at: string | null
  users: Array<{
    id: string
    email: string
    first_name: string
    last_name: string
    role_name: string
    is_active: boolean
    platform_role: string | null
    created_at: string | null
  }>
  locations: Array<{
    id: string
    name: string
    address: string | null
    city: string | null
    state: string | null
    zip_code: string | null
    is_primary: boolean
  }>
  stats: {
    campers: number
    events: number
    registrations: number
    users: number
  }
}

export interface PlatformUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role_name: string
  organization_name: string
  organization_id: string
  is_active: boolean
  platform_role: string | null
  created_at: string | null
}

export interface ActivityItem {
  type: string
  title: string
  subtitle: string
  timestamp: string | null
  org_id: string
  org_name: string
}

// ─── Hooks ────────────────────────────────────────────────────────────

export function usePlatformStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats')
      return data as PlatformStats
    },
    staleTime: 60_000,
  })
}

export function useAdminOrganizations(params: {
  page?: number
  page_size?: number
  search?: string
  tier?: string
  sort_by?: string
  sort_dir?: string
} = {}) {
  return useQuery({
    queryKey: ['admin', 'organizations', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/organizations', { params })
      return data as OrgListResponse
    },
    staleTime: 30_000,
  })
}

export function useAdminOrgDetail(orgId: string | null) {
  return useQuery({
    queryKey: ['admin', 'organizations', orgId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/organizations/${orgId}`)
      return data as OrgDetail
    },
    enabled: !!orgId,
    staleTime: 30_000,
  })
}

export function useUpdateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orgId,
      updates,
    }: {
      orgId: string
      updates: {
        subscription_tier?: string
        enabled_modules?: string[]
        marketplace_visible?: boolean
        is_suspended?: boolean
      }
    }) => {
      const { data } = await api.put(`/admin/organizations/${orgId}`, updates)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'organizations'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminUsers(params: {
  page?: number
  page_size?: number
  search?: string
} = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/users', { params })
      return data as { users: PlatformUser[]; total: number; page: number; page_size: number }
    },
    staleTime: 30_000,
  })
}

export function usePlatformActivity(limit = 20) {
  return useQuery({
    queryKey: ['admin', 'activity', limit],
    queryFn: async () => {
      const { data } = await api.get('/admin/activity', { params: { limit } })
      return data as { activities: ActivityItem[] }
    },
    staleTime: 60_000,
  })
}

export function useImpersonateOrg() {
  return useMutation({
    mutationFn: async (orgId: string) => {
      const { data } = await api.post(`/admin/organizations/${orgId}/impersonate`)
      return data as {
        organization_id: string
        organization_name: string
        organization_slug: string
        message: string
      }
    },
  })
}
