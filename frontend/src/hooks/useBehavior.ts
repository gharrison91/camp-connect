/**
 * Camp Connect - Behavior Tracking React Query Hooks
 * Hooks for behavior log CRUD and statistics.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---- Types ----

export interface BehaviorLog {
  id: string
  org_id: string
  camper_id: string
  camper_name: string
  type: 'positive' | 'concern' | 'incident' | 'follow_up'
  category: 'social' | 'academic' | 'safety' | 'health' | 'behavioral' | 'other'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  reported_by: string
  action_taken: string | null
  follow_up_required: boolean
  follow_up_date: string | null
  parent_notified: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BehaviorStats {
  total_logs: number
  positive: number
  concerns: number
  incidents: number
  follow_ups_pending: number
  by_severity: Record<string, number>
}

export interface BehaviorFilters {
  type?: string
  severity?: string
  camper_id?: string
  search?: string
}

// ---- Hooks ----

export function useBehaviorLogs(filters?: BehaviorFilters) {
  return useQuery<BehaviorLog[]>({
    queryKey: ['behavior-logs', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.type) params.type = filters.type
      if (filters?.severity) params.severity = filters.severity
      if (filters?.camper_id) params.camper_id = filters.camper_id
      if (filters?.search) params.search = filters.search
      return api.get('/behavior', { params }).then((r) => r.data)
    },
  })
}

export function useBehaviorStats() {
  return useQuery<BehaviorStats>({
    queryKey: ['behavior-stats'],
    queryFn: () => api.get('/behavior/stats').then((r) => r.data),
  })
}

export function useCreateBehaviorLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<BehaviorLog, 'id' | 'org_id' | 'created_at' | 'updated_at'>) =>
      api.post('/behavior', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior-logs'] })
      queryClient.invalidateQueries({ queryKey: ['behavior-stats'] })
    },
  })
}

export function useUpdateBehaviorLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BehaviorLog> }) =>
      api.put(`/behavior/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior-logs'] })
      queryClient.invalidateQueries({ queryKey: ['behavior-stats'] })
    },
  })
}

export function useDeleteBehaviorLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/behavior/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior-logs'] })
      queryClient.invalidateQueries({ queryKey: ['behavior-stats'] })
    },
  })
}
