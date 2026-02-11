/**
 * Camp Connect - Allergy Matrix React Query Hooks
 * CRUD, matrix view, and stats for the allergy matrix feature.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AllergyEntry {
  id: string
  camper_id: string
  camper_name: string
  allergy_type: 'food' | 'environmental' | 'medication' | 'insect' | 'other'
  allergen: string
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening'
  treatment: string | null
  epipen_required: boolean
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface AllergyStats {
  total_entries: number
  campers_with_allergies: number
  severe_count: number
  epipen_count: number
  top_allergens: { allergen: string; count: number }[]
}

export interface AllergyMatrixRow {
  camper_id: string
  camper_name: string
  allergies: AllergyEntry[]
}

interface AllergyFilters {
  allergy_type?: string
  severity?: string
  search?: string
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useAllergies(filters?: AllergyFilters) {
  return useQuery<AllergyEntry[]>({
    queryKey: ['allergy-matrix', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.allergy_type) params.allergy_type = filters.allergy_type
      if (filters?.severity) params.severity = filters.severity
      if (filters?.search) params.search = filters.search
      return api.get('/allergy-matrix', { params }).then((r) => r.data)
    },
  })
}

export function useAllergyStats() {
  return useQuery<AllergyStats>({
    queryKey: ['allergy-matrix', 'stats'],
    queryFn: () => api.get('/allergy-matrix/stats').then((r) => r.data),
  })
}

export function useAllergyMatrix(filters?: { allergy_type?: string; severity?: string }) {
  return useQuery<AllergyMatrixRow[]>({
    queryKey: ['allergy-matrix', 'matrix', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.allergy_type) params.allergy_type = filters.allergy_type
      if (filters?.severity) params.severity = filters.severity
      return api.get('/allergy-matrix/matrix', { params }).then((r) => r.data)
    },
  })
}

export function useAllergy(allergyId: string | undefined) {
  return useQuery<AllergyEntry>({
    queryKey: ['allergy-matrix', allergyId],
    queryFn: () => api.get(`/allergy-matrix/${allergyId}`).then((r) => r.data),
    enabled: !!allergyId,
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useCreateAllergy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      camper_id: string
      allergy_type: string
      allergen: string
      severity: string
      treatment?: string
      epipen_required?: boolean
      notes?: string
    }) => api.post('/allergy-matrix', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergy-matrix'] })
    },
  })
}

export function useUpdateAllergy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        allergy_type: string
        allergen: string
        severity: string
        treatment: string
        epipen_required: boolean
        notes: string
      }>
    }) => api.put(`/allergy-matrix/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergy-matrix'] })
    },
  })
}

export function useDeleteAllergy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/allergy-matrix/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergy-matrix'] })
    },
  })
}
