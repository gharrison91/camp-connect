/**
 * Camp Connect - Activities React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface Activity {
  id: string
  name: string
  description: string | null
  category: string
  location: string | null
  capacity: number | null
  min_age: number | null
  max_age: number | null
  duration_minutes: number | null
  staff_required: number
  equipment_needed: string[]
  is_active: boolean
  created_at: string
}

export interface ActivityCreate {
  name: string
  description?: string
  category: string
  location?: string
  capacity?: number | null
  min_age?: number | null
  max_age?: number | null
  duration_minutes?: number | null
  staff_required?: number
  equipment_needed?: string[]
  is_active?: boolean
}

export type ActivityUpdate = Partial<ActivityCreate>

interface ActivityFilters {
  search?: string
  category?: string
  is_active?: boolean
}

export function useActivities(filters?: ActivityFilters) {
  return useQuery<Activity[]>({
    queryKey: ['activities', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.search) params.search = filters.search
      if (filters?.category) params.category = filters.category
      if (filters?.is_active !== undefined) params.is_active = String(filters.is_active)
      return api.get('/activities', { params }).then((r) => r.data)
    },
  })
}

export function useActivity(activityId: string | undefined) {
  return useQuery<Activity>({
    queryKey: ['activities', activityId],
    queryFn: () => api.get(`/activities/${activityId}`).then((r) => r.data),
    enabled: !!activityId,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ActivityCreate) =>
      api.post('/activities', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ActivityUpdate }) =>
      api.put(`/activities/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
