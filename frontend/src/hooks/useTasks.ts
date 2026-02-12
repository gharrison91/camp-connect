/**
 * Camp Connect - Task Assignments React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface TaskItem {
  id: string
  org_id: string
  title: string
  description: string | null
  assigned_to: string
  assigned_by: string
  category: string
  priority: string
  status: string
  due_date: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TaskStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  overdue: number
  by_priority: Record<string, number>
  by_category: Record<string, number>
}

export interface TaskFilters {
  status?: string
  priority?: string
  category?: string
  assigned_to?: string
  search?: string
}

export interface TaskCreateData {
  title: string
  description?: string | null
  assigned_to: string
  category?: string
  priority?: string
  due_date?: string | null
  notes?: string | null
}

export interface TaskUpdateData {
  title?: string
  description?: string | null
  assigned_to?: string
  category?: string
  priority?: string
  status?: string
  due_date?: string | null
  notes?: string | null
}

export function useTasks(filters?: TaskFilters) {
  return useQuery<TaskItem[]>({
    queryKey: ['tasks', filters],
    queryFn: () => api.get('/tasks', { params: filters }).then((r) => r.data),
  })
}

export function useTask(id: string | null) {
  return useQuery<TaskItem>({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/tasks/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useTaskStats() {
  return useQuery<TaskStats>({
    queryKey: ['task-stats'],
    queryFn: () => api.get('/tasks/stats').then((r) => r.data),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TaskCreateData) =>
      api.post('/tasks', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-stats'] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdateData }) =>
      api.put(`/tasks/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-stats'] })
    },
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/tasks/${id}/complete`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-stats'] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-stats'] })
    },
  })
}
