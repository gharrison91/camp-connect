/**
 * Camp Connect - Camp Directory Hooks
 * React Query hooks for camp profile management and public directory browsing.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CampProfile, CampProfileUpdate, DirectorySearchResult } from '@/types'

// ─── Admin hooks (authenticated) ────────────────────────────

export function useCampProfile() {
  return useQuery({
    queryKey: ['camp-profile'],
    queryFn: async () => {
      const res = await api.get('/camp-profile')
      return res.data as CampProfile | { profile: null }
    },
  })
}

export function useUpdateCampProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CampProfileUpdate) => {
      const res = await api.put('/camp-profile', data)
      return res.data as CampProfile
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['camp-profile'] })
    },
  })
}

export function usePublishCampProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (publish: boolean) => {
      const res = await api.post('/camp-profile/publish', null, {
        params: { publish },
      })
      return res.data as CampProfile
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['camp-profile'] })
    },
  })
}

// ─── Public hooks (no auth required) ────────────────────────

interface DirectoryFilters {
  q?: string
  camp_type?: string
  state?: string
  age_min?: number
  age_max?: number
  price_min?: number
  price_max?: number
  skip?: number
  limit?: number
}

export function useDirectorySearch(filters: DirectoryFilters) {
  return useQuery({
    queryKey: ['directory', filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (filters.q) params.q = filters.q
      if (filters.camp_type) params.camp_type = filters.camp_type
      if (filters.state) params.state = filters.state
      if (filters.age_min !== undefined) params.age_min = filters.age_min
      if (filters.age_max !== undefined) params.age_max = filters.age_max
      if (filters.price_min !== undefined) params.price_min = filters.price_min
      if (filters.price_max !== undefined) params.price_max = filters.price_max
      if (filters.skip !== undefined) params.skip = filters.skip
      if (filters.limit !== undefined) params.limit = filters.limit
      const res = await api.get('/directory', { params })
      return res.data as DirectorySearchResult
    },
  })
}

export function useCampBySlug(slug: string) {
  return useQuery({
    queryKey: ['directory', 'camp', slug],
    queryFn: async () => {
      const res = await api.get(`/directory/${slug}`)
      return res.data as CampProfile
    },
    enabled: !!slug,
  })
}

export function useFeaturedCamps() {
  return useQuery({
    queryKey: ['directory', 'featured'],
    queryFn: async () => {
      const res = await api.get('/directory/featured')
      return res.data as CampProfile[]
    },
  })
}
