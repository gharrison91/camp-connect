/**
 * Camp Connect - Cabins React Query Hooks
 * Queries and mutations for cabin CRUD and cabin-bunk relationships.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---- Types ----

export interface Cabin {
  id: string
  name: string
  description: string | null
  location: string | null
  total_capacity: number
  gender_restriction: string
  is_active: boolean
  bunk_count: number
  created_at: string
}

export interface CabinWithBunks extends Cabin {
  bunks: CabinBunkSummary[]
}

export interface CabinBunkSummary {
  id: string
  name: string
  capacity: number
  gender_restriction: string
  min_age: number | null
  max_age: number | null
  location: string | null
  counselor_user_id: string | null
  counselor_name: string | null
  created_at: string
}

export interface CabinCreate {
  name: string
  description?: string
  location?: string
  total_capacity?: number
  gender_restriction?: string
  is_active?: boolean
}

export interface CabinUpdate extends Partial<CabinCreate> {}

// ---- Queries ----

export function useCabins(includeInactive = false) {
  return useQuery<Cabin[]>({
    queryKey: ['cabins', { includeInactive }],
    queryFn: () =>
      api
        .get('/cabins', { params: { include_inactive: includeInactive } })
        .then((r) => r.data),
  })
}

export function useCabin(cabinId: string | undefined) {
  return useQuery<CabinWithBunks>({
    queryKey: ['cabins', cabinId],
    queryFn: () => api.get(`/cabins/${cabinId}`).then((r) => r.data),
    enabled: !!cabinId,
  })
}

export function useCabinBunks(cabinId: string | undefined) {
  return useQuery<CabinBunkSummary[]>({
    queryKey: ['cabins', cabinId, 'bunks'],
    queryFn: () => api.get(`/cabins/${cabinId}/bunks`).then((r) => r.data),
    enabled: !!cabinId,
  })
}

// ---- Mutations ----

export function useCreateCabin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CabinCreate) =>
      api.post('/cabins', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabins'] })
    },
  })
}

export function useUpdateCabin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CabinUpdate }) =>
      api.put(`/cabins/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabins'] })
    },
  })
}

export function useDeleteCabin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cabins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabins'] })
      queryClient.invalidateQueries({ queryKey: ['bunks'] })
    },
  })
}

export function useAssignBunkToCabin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cabinId, bunkId }: { cabinId: string; bunkId: string }) =>
      api.post(`/cabins/${cabinId}/bunks/${bunkId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabins'] })
      queryClient.invalidateQueries({ queryKey: ['bunks'] })
    },
  })
}

export function useUnassignBunkFromCabin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cabinId, bunkId }: { cabinId: string; bunkId: string }) =>
      api.delete(`/cabins/${cabinId}/bunks/${bunkId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabins'] })
      queryClient.invalidateQueries({ queryKey: ['bunks'] })
    },
  })
}
