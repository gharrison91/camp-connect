/**
 * Camp Connect - Goals React Query Hooks
 * Hooks for camper goal CRUD and statistics.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---- Types ----

export interface GoalMilestone {
  title: string
  completed: boolean
}

export interface GoalRecord {
  id: string
  org_id: string
  camper_id: string
  camper_name: string
  title: string
  description: string | null
  category: 'academic' | 'social' | 'physical' | 'creative' | 'personal' | 'other'
  target_date: string | null
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  progress: number
  milestones: GoalMilestone[] | null
  counselor_notes: string | null
  created_at: string
  updated_at: string
}

export interface GoalStats {
  total: number
  completed: number
  in_progress: number
  completion_rate: number
  by_category: Record<string, number>
}

export interface GoalFilters {
  status?: string
  category?: string
  camper_id?: string
  search?: string
}

// ---- Hooks ----

export function useGoals(filters?: GoalFilters) {
  return useQuery<GoalRecord[]>({
    queryKey: ['goals', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.status) params.status = filters.status
      if (filters?.category) params.category = filters.category
      if (filters?.camper_id) params.camper_id = filters.camper_id
      if (filters?.search) params.search = filters.search
      return api.get('/goals', { params }).then((r) => r.data)
    },
  })
}

export function useGoal(goalId: string | undefined) {
  return useQuery<GoalRecord>({
    queryKey: ['goals', goalId],
    queryFn: () => api.get(`/goals/${goalId}`).then((r) => r.data),
    enabled: !!goalId,
  })
}

export function useGoalStats() {
  return useQuery<GoalStats>({
    queryKey: ['goal-stats'],
    queryFn: () => api.get('/goals/stats').then((r) => r.data),
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<GoalRecord, 'id' | 'org_id' | 'created_at' | 'updated_at'>) =>
      api.post('/goals', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal-stats'] })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalRecord> }) =>
      api.put(`/goals/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal-stats'] })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal-stats'] })
    },
  })
}
