/**
 * Camp Connect - Volunteers React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Volunteer, VolunteerShift } from '../types'

interface VolunteerFilters {
  status?: string
  search?: string
}

export function useVolunteers(filters?: VolunteerFilters) {
  return useQuery<Volunteer[]>({
    queryKey: ['volunteers', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.status) params.status = filters.status
      if (filters?.search) params.search = filters.search
      return api.get('/volunteers', { params }).then((r) => r.data)
    },
  })
}

export function useVolunteer(id: string | undefined) {
  return useQuery<Volunteer>({
    queryKey: ['volunteers', id],
    queryFn: () => api.get(`/volunteers/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useVolunteerStats() {
  return useQuery<{
    total_volunteers: number
    active: number
    pending: number
    background_cleared: number
    total_hours: number
    upcoming_shifts: number
    completed_shifts: number
  }>({
    queryKey: ['volunteer-stats'],
    queryFn: () => api.get('/volunteers/stats').then((r) => r.data),
  })
}

export function useCreateVolunteer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Volunteer, 'id' | 'org_id' | 'created_at'>) =>
      api.post('/volunteers', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteers'] })
      qc.invalidateQueries({ queryKey: ['volunteer-stats'] })
    },
  })
}

export function useUpdateVolunteer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Volunteer> }) =>
      api.put(`/volunteers/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteers'] })
      qc.invalidateQueries({ queryKey: ['volunteer-stats'] })
    },
  })
}

export function useDeleteVolunteer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/volunteers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteers'] })
      qc.invalidateQueries({ queryKey: ['volunteer-stats'] })
    },
  })
}

export function useLogHours() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, hours }: { id: string; hours: number }) =>
      api.post(`/volunteers/${id}/log-hours?hours=${hours}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteers'] })
      qc.invalidateQueries({ queryKey: ['volunteer-stats'] })
    },
  })
}

// Shifts

interface ShiftFilters {
  volunteer_id?: string
  status?: string
  date_from?: string
  date_to?: string
}

export function useVolunteerShifts(filters?: ShiftFilters) {
  return useQuery<VolunteerShift[]>({
    queryKey: ['volunteer-shifts', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.volunteer_id) params.volunteer_id = filters.volunteer_id
      if (filters?.status) params.status = filters.status
      if (filters?.date_from) params.date_from = filters.date_from
      if (filters?.date_to) params.date_to = filters.date_to
      return api.get('/volunteers/shifts/list', { params }).then((r) => r.data)
    },
  })
}

export function useShiftSchedule(weekStart: string, weekEnd: string) {
  return useQuery<VolunteerShift[]>({
    queryKey: ['volunteer-schedule', weekStart, weekEnd],
    queryFn: () =>
      api
        .get('/volunteers/shifts/schedule', { params: { week_start: weekStart, week_end: weekEnd } })
        .then((r) => r.data),
    enabled: !!weekStart && !!weekEnd,
  })
}

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<VolunteerShift, 'id' | 'org_id' | 'created_at'>) =>
      api.post('/volunteers/shifts', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-shifts'] })
      qc.invalidateQueries({ queryKey: ['volunteer-schedule'] })
      qc.invalidateQueries({ queryKey: ['volunteer-stats'] })
    },
  })
}

export function useUpdateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VolunteerShift> }) =>
      api.put(`/volunteers/shifts/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-shifts'] })
      qc.invalidateQueries({ queryKey: ['volunteer-schedule'] })
      qc.invalidateQueries({ queryKey: ['volunteer-stats'] })
    },
  })
}

export function useDeleteShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/volunteers/shifts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-shifts'] })
      qc.invalidateQueries({ queryKey: ['volunteer-schedule'] })
      qc.invalidateQueries({ queryKey: ['volunteer-stats'] })
    },
  })
}
