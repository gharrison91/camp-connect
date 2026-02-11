/**
 * Camp Connect - Supply Requests React Query Hooks
 * Hooks for supply request CRUD, approval workflow, and stats.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---- Interfaces ----

export interface SupplyRequestData {
  id: string
  organization_id: string
  title: string
  description: string | null
  category: string
  priority: string
  quantity: number
  estimated_cost: number | null
  needed_by: string | null
  requested_by: string | null
  status: string
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
}

export interface SupplyRequestCreate {
  title: string
  description?: string
  category?: string
  priority?: string
  quantity?: number
  estimated_cost?: number | null
  needed_by?: string | null
  requested_by?: string
}

export interface SupplyRequestUpdate {
  title?: string
  description?: string
  category?: string
  priority?: string
  quantity?: number
  estimated_cost?: number | null
  needed_by?: string | null
  requested_by?: string
  status?: string
  notes?: string
}

export interface SupplyStats {
  total_requests: number
  pending_count: number
  approved_count: number
  ordered_count: number
  received_count: number
  rejected_count: number
  total_cost: number
  avg_fulfillment_days: number | null
}

interface SupplyFilters {
  status?: string
  category?: string
  priority?: string
  search?: string
}

// ---- List / Get ----

export function useSupplyRequests(filters?: SupplyFilters) {
  return useQuery<SupplyRequestData[]>({
    queryKey: ['supply-requests', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.status) params.status = filters.status
      if (filters?.category) params.category = filters.category
      if (filters?.priority) params.priority = filters.priority
      if (filters?.search) params.search = filters.search
      return api.get('/supply-requests', { params }).then((r) => r.data)
    },
  })
}

export function useSupplyRequest(id: string | undefined) {
  return useQuery<SupplyRequestData>({
    queryKey: ['supply-requests', id],
    queryFn: () => api.get(`/supply-requests/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

// ---- Create ----

export function useCreateSupplyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SupplyRequestCreate) =>
      api.post('/supply-requests', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] })
      queryClient.invalidateQueries({ queryKey: ['supply-stats'] })
    },
  })
}

// ---- Update ----

export function useUpdateSupplyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplyRequestUpdate }) =>
      api.put(`/supply-requests/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] })
      queryClient.invalidateQueries({ queryKey: ['supply-stats'] })
    },
  })
}

// ---- Delete ----

export function useDeleteSupplyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/supply-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] })
      queryClient.invalidateQueries({ queryKey: ['supply-stats'] })
    },
  })
}

// ---- Approve / Reject ----

export function useApproveSupplyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => {
      const params: Record<string, string> = {}
      if (notes) params.notes = notes
      return api.post(`/supply-requests/${id}/approve`, null, { params }).then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] })
      queryClient.invalidateQueries({ queryKey: ['supply-stats'] })
    },
  })
}

export function useRejectSupplyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => {
      const params: Record<string, string> = {}
      if (notes) params.notes = notes
      return api.post(`/supply-requests/${id}/reject`, null, { params }).then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] })
      queryClient.invalidateQueries({ queryKey: ['supply-stats'] })
    },
  })
}

// ---- Stats ----

export function useSupplyStats() {
  return useQuery<SupplyStats>({
    queryKey: ['supply-stats'],
    queryFn: () => api.get('/supply-requests/stats').then((r) => r.data),
  })
}
