/**
 * Camp Connect - Dietary Restrictions React Query Hooks
 * CRUD and stats for the dietary restrictions tracker feature.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DietaryRestriction {
  id: string
  org_id: string
  camper_id: string
  camper_name: string
  restriction_type: 'food_allergy' | 'intolerance' | 'preference' | 'medical' | 'religious'
  restriction: string
  severity: 'mild' | 'moderate' | 'severe'
  alternatives: string | null
  meal_notes: string | null
  created_at: string
  updated_at: string | null
}

export interface DietaryStats {
  total_restrictions: number
  campers_affected: number
  by_type: Record<string, number>
  severe_count: number
}

interface DietaryFilters {
  restriction_type?: string
  severity?: string
  search?: string
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useDietaryRestrictions(filters?: DietaryFilters) {
  return useQuery<DietaryRestriction[]>({
    queryKey: ['dietary', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.restriction_type) params.restriction_type = filters.restriction_type
      if (filters?.severity) params.severity = filters.severity
      if (filters?.search) params.search = filters.search
      return api.get('/dietary', { params }).then((r) => r.data)
    },
  })
}

export function useDietaryStats() {
  return useQuery<DietaryStats>({
    queryKey: ['dietary', 'stats'],
    queryFn: () => api.get('/dietary/stats').then((r) => r.data),
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useCreateDietary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      camper_id: string
      restriction_type: string
      restriction: string
      severity: string
      alternatives?: string | null
      meal_notes?: string | null
    }) => api.post('/dietary', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietary'] })
    },
  })
}

export function useUpdateDietary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        restriction_type: string
        restriction: string
        severity: string
        alternatives: string | null
        meal_notes: string | null
      }>
    }) => api.put(`/dietary/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietary'] })
    },
  })
}

export function useDeleteDietary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/dietary/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietary'] })
    },
  })
}
