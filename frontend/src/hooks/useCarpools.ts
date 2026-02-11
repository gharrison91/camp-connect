/**
 * Camp Connect - Carpool React Query Hooks
 * Hooks for carpools, riders, and stats.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CarpoolRider {
  id: string
  carpool_id: string
  camper_name: string
  parent_name: string
  status: 'pending' | 'confirmed'
  created_at: string
}

export interface CarpoolData {
  id: string
  org_id: string
  driver_name: string
  phone: string | null
  email: string | null
  pickup_location: string
  dropoff_location: string
  departure_time: string
  seats_available: number
  days: string[]
  notes: string | null
  rider_count: number
  riders: CarpoolRider[]
  created_at: string
}

export interface CarpoolStats {
  total: number
  active: number
  total_riders: number
  avg_occupancy: number
}

// ---------------------------------------------------------------------------
// Create / Update types
// ---------------------------------------------------------------------------

interface CarpoolCreate {
  driver_name: string
  phone?: string | null
  email?: string | null
  pickup_location: string
  dropoff_location?: string
  departure_time: string
  seats_available: number
  days?: string[]
  notes?: string | null
}

type CarpoolUpdate = Partial<CarpoolCreate>

interface RiderCreate {
  camper_name: string
  parent_name: string
  status?: string
}

interface RiderStatusUpdate {
  status: 'pending' | 'confirmed'
}

// ---------------------------------------------------------------------------
// Carpool hooks
// ---------------------------------------------------------------------------

export function useCarpools(search?: string) {
  return useQuery<CarpoolData[]>({
    queryKey: ['carpools', search],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (search) params.search = search
      return api.get('/carpools', { params }).then((r) => r.data)
    },
  })
}

export function useCarpool(carpoolId: string | undefined) {
  return useQuery<CarpoolData>({
    queryKey: ['carpools', carpoolId],
    queryFn: () => api.get(`/carpools/${carpoolId}`).then((r) => r.data),
    enabled: !!carpoolId,
  })
}

export function useCarpoolStats() {
  return useQuery<CarpoolStats>({
    queryKey: ['carpools', 'stats'],
    queryFn: () => api.get('/carpools/stats').then((r) => r.data),
  })
}

export function useCreateCarpool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CarpoolCreate) =>
      api.post('/carpools', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carpools'] })
    },
  })
}

export function useUpdateCarpool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CarpoolUpdate }) =>
      api.put(`/carpools/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carpools'] })
    },
  })
}

export function useDeleteCarpool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/carpools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carpools'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Rider hooks
// ---------------------------------------------------------------------------

export function useCarpoolRiders(carpoolId: string | undefined) {
  return useQuery<CarpoolRider[]>({
    queryKey: ['carpools', carpoolId, 'riders'],
    queryFn: () =>
      api.get(`/carpools/${carpoolId}/riders`).then((r) => r.data),
    enabled: !!carpoolId,
  })
}

export function useAddRider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      carpoolId,
      data,
    }: {
      carpoolId: string
      data: RiderCreate
    }) =>
      api.post(`/carpools/${carpoolId}/riders`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carpools'] })
    },
  })
}

export function useUpdateRider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RiderStatusUpdate }) =>
      api.put(`/carpools/riders/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carpools'] })
    },
  })
}

export function useRemoveRider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/carpools/riders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carpools'] })
    },
  })
}
