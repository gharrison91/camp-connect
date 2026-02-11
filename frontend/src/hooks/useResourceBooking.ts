/**
 * Camp Connect - Resource Booking React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ResourceData {
  id: string
  organization_id: string
  name: string
  resource_type: 'facility' | 'equipment' | 'vehicle' | 'other'
  description: string | null
  location: string | null
  capacity: number | null
  available: boolean
  booking_count: number
  created_at: string
}

export interface BookingData {
  id: string
  resource_id: string
  resource_name: string
  booked_by: string
  booked_by_name: string
  title: string
  start_time: string
  end_time: string
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

export interface ResourceStats {
  total_resources: number
  total_bookings: number
  upcoming_bookings: number
  utilization_rate: number
}

export interface ResourceCreate {
  name: string
  resource_type?: string
  description?: string
  location?: string
  capacity?: number | null
  available?: boolean
}

export type ResourceUpdate = Partial<ResourceCreate>

export interface BookingCreate {
  resource_id: string
  title: string
  start_time: string
  end_time: string
  notes?: string
  status?: string
}

export type BookingUpdate = Partial<Omit<BookingCreate, 'resource_id'>>

// ---------------------------------------------------------------------------
// Resource filters
// ---------------------------------------------------------------------------

interface ResourceFilters {
  search?: string
  resource_type?: string
  available?: boolean
}

interface BookingFilters {
  resource_id?: string
  status?: string
  date_from?: string
  date_to?: string
}

// ---------------------------------------------------------------------------
// Resource hooks
// ---------------------------------------------------------------------------

export function useResources(filters?: ResourceFilters) {
  return useQuery<ResourceData[]>({
    queryKey: ['resources', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.search) params.search = filters.search
      if (filters?.resource_type) params.resource_type = filters.resource_type
      if (filters?.available !== undefined) params.available = String(filters.available)
      return api.get('/resource-bookings/resources', { params }).then((r) => r.data)
    },
  })
}

export function useResource(resourceId: string | undefined) {
  return useQuery<ResourceData>({
    queryKey: ['resources', resourceId],
    queryFn: () =>
      api.get(`/resource-bookings/resources/${resourceId}`).then((r) => r.data),
    enabled: !!resourceId,
  })
}

export function useCreateResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ResourceCreate) =>
      api.post('/resource-bookings/resources', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource-stats'] })
    },
  })
}

export function useUpdateResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResourceUpdate }) =>
      api.put(`/resource-bookings/resources/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource-stats'] })
    },
  })
}

export function useDeleteResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/resource-bookings/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource-stats'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Booking hooks
// ---------------------------------------------------------------------------

export function useBookings(filters?: BookingFilters) {
  return useQuery<BookingData[]>({
    queryKey: ['bookings', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.resource_id) params.resource_id = filters.resource_id
      if (filters?.status) params.status = filters.status
      if (filters?.date_from) params.date_from = filters.date_from
      if (filters?.date_to) params.date_to = filters.date_to
      return api.get('/resource-bookings/bookings', { params }).then((r) => r.data)
    },
  })
}

export function useBooking(bookingId: string | undefined) {
  return useQuery<BookingData>({
    queryKey: ['bookings', bookingId],
    queryFn: () =>
      api.get(`/resource-bookings/bookings/${bookingId}`).then((r) => r.data),
    enabled: !!bookingId,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BookingCreate) =>
      api.post('/resource-bookings/bookings', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource-stats'] })
    },
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BookingUpdate }) =>
      api.put(`/resource-bookings/bookings/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['resource-stats'] })
    },
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/resource-bookings/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource-stats'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Stats hook
// ---------------------------------------------------------------------------

export function useResourceStats() {
  return useQuery<ResourceStats>({
    queryKey: ['resource-stats'],
    queryFn: () =>
      api.get('/resource-bookings/resources/stats').then((r) => r.data),
  })
}
