/**
 * Camp Connect - Facility Maintenance React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { MaintenanceRequest } from '../types'

interface MaintenanceFilters {
  status?: string
  priority?: string
  category?: string
  search?: string
}

interface MaintenanceStats {
  total: number
  open_count: number
  urgent_count: number
  completed_this_week: number
  avg_completion_hours: number | null
  by_category: Record<string, number>
  by_priority: Record<string, number>
  by_status: Record<string, number>
}

export function useMaintenanceRequests(filters?: MaintenanceFilters) {
  return useQuery<MaintenanceRequest[]>({
    queryKey: ['maintenance', filters],
    queryFn: () => api.get('/maintenance', { params: filters }).then((r) => r.data),
  })
}

export function useMaintenanceRequest(id: string | null) {
  return useQuery<MaintenanceRequest>({
    queryKey: ['maintenance', id],
    queryFn: () => api.get(`/maintenance/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useMaintenanceStats() {
  return useQuery<MaintenanceStats>({
    queryKey: ['maintenance-stats'],
    queryFn: () => api.get('/maintenance/stats').then((r) => r.data),
  })
}

export function useCreateMaintenanceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/maintenance', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
    },
  })
}

export function useUpdateMaintenanceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/maintenance/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
    },
  })
}

export function useDeleteMaintenanceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/maintenance/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
    },
  })
}

export function useAssignMaintenanceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, assigned_to, assigned_to_name }: { id: string; assigned_to: string; assigned_to_name: string }) =>
      api.post(`/maintenance/${id}/assign`, { assigned_to, assigned_to_name }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
    },
  })
}

export function useCompleteMaintenanceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, actual_cost, notes }: { id: string; actual_cost?: number; notes?: string }) =>
      api.post(`/maintenance/${id}/complete`, { actual_cost, notes }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
    },
  })
}
