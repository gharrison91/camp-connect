/**
 * Camp Connect - Organization Settings React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface OrgSettings {
  settings: Record<string, unknown>
  enabled_modules: string[]
  subscription_tier: string
}

export function useOrgSettings() {
  return useQuery<OrgSettings>({
    queryKey: ['org-settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  })
}

export function useUpdateOrgSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put('/settings', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
    },
  })
}

// Developer Reference types
export interface DeveloperReferenceEntity {
  id: string
  name: string
  created_at: string | null
}

export interface DeveloperReference {
  organization_id: string
  api_base_url: string
  entities: {
    events: DeveloperReferenceEntity[]
    activities: DeveloperReferenceEntity[]
    bunks: DeveloperReferenceEntity[]
    locations: DeveloperReferenceEntity[]
    roles: DeveloperReferenceEntity[]
    form_templates: DeveloperReferenceEntity[]
  }
}

export function useDeveloperReference() {
  return useQuery<DeveloperReference>({
    queryKey: ['developer-reference'],
    queryFn: async () => {
      const res = await api.get('/settings/developer-reference')
      return res.data
    },
    staleTime: 2 * 60 * 1000, // cache for 2 minutes
  })
}
