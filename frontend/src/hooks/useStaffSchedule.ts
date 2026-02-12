/**
 * Camp Connect - Staff Schedule React Query Hooks
 * Hooks for staff shift scheduling: list, create, update, delete, stats.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Shift {
  id: string
  organization_id: string
  staff_name: string
  staff_id: string | null
  role: string
  shift_type: 'morning' | 'afternoon' | 'evening' | 'overnight' | 'full_day'
  start_time: string
  end_time: string
  location: string | null
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  notes: string | null
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
}

export interface StaffScheduleStats {
  total_shifts: number
  staff_count: number
  by_shift_type: Record<string, number>
  by_day: Record<string, number>
  coverage_gaps: number
}

interface ShiftCreate {
  staff_name: string
  staff_id?: string | null
  role: string
  shift_type?: string
  start_time: string
  end_time: string
  location?: string | null
  day_of_week: string
  notes?: string | null
  status?: string
}

type ShiftUpdate = Partial<ShiftCreate>

interface ShiftFilters {
  day_of_week?: string
  shift_type?: string
  staff_name?: string
  search?: string
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const SHIFTS_KEY = ['staff-schedule']
const STATS_KEY = ['staff-schedule', 'stats']

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useStaffShifts(filters?: ShiftFilters) {
  return useQuery<Shift[]>({
    queryKey: [...SHIFTS_KEY, filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.day_of_week) params.day_of_week = filters.day_of_week
      if (filters?.shift_type) params.shift_type = filters.shift_type
      if (filters?.staff_name) params.staff_name = filters.staff_name
      if (filters?.search) params.search = filters.search
      return api.get('/staff-schedule', { params }).then((r) => r.data)
    },
  })
}

export function useStaffScheduleStats() {
  return useQuery<StaffScheduleStats>({
    queryKey: STATS_KEY,
    queryFn: () => api.get('/staff-schedule/stats').then((r) => r.data),
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ShiftCreate) =>
      api.post('/staff-schedule', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_KEY })
      queryClient.invalidateQueries({ queryKey: STATS_KEY })
    },
  })
}

export function useUpdateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShiftUpdate }) =>
      api.put(`/staff-schedule/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_KEY })
      queryClient.invalidateQueries({ queryKey: STATS_KEY })
    },
  })
}

export function useDeleteShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff-schedule/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_KEY })
      queryClient.invalidateQueries({ queryKey: STATS_KEY })
    },
  })
}
