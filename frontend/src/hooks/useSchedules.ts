/**
 * Camp Connect - Schedules React Query Hooks
 * CRUD for schedule sessions, daily view, and assignments.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  Schedule,
  ScheduleCreate,
  ScheduleUpdate,
  ScheduleAssignment,
  ScheduleAssignmentCreate,
  StaffScheduleEntry,
} from '../types'

// ─── Queries ────────────────────────────────────────────────

export function useSchedules(eventId: string | undefined, date?: string) {
  return useQuery<Schedule[]>({
    queryKey: ['schedules', eventId, date],
    queryFn: () =>
      api
        .get('/schedules', { params: { event_id: eventId, date } })
        .then((r) => r.data),
    enabled: !!eventId,
  })
}

export function useSchedule(scheduleId: string | undefined) {
  return useQuery<Schedule>({
    queryKey: ['schedules', 'detail', scheduleId],
    queryFn: () => api.get(`/schedules/${scheduleId}`).then((r) => r.data),
    enabled: !!scheduleId,
  })
}

export function useDailyView(eventId: string | undefined, date: string | undefined) {
  return useQuery<Schedule[]>({
    queryKey: ['schedules', 'daily-view', eventId, date],
    queryFn: async () => {
      const res = await api.get('/schedules/daily-view', {
        params: { event_id: eventId, date },
      })
      const data = res.data
      // Backend returns { date, event_id, time_slots: [{ start_time, end_time, sessions }] }
      // Flatten into a simple Schedule[] array for the DayView component
      if (data && Array.isArray(data.time_slots)) {
        return data.time_slots.flatMap(
          (slot: { sessions: Schedule[] }) => slot.sessions || []
        )
      }
      // Fallback: if backend ever returns a flat array directly
      if (Array.isArray(data)) return data
      return []
    },
    enabled: !!eventId && !!date,
  })
}

// ─── Schedule CRUD Mutations ────────────────────────────────

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ScheduleCreate) =>
      api.post('/schedules', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScheduleUpdate }) =>
      api.put(`/schedules/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

// ─── Assignment Mutations ───────────────────────────────────

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  return useMutation<ScheduleAssignment, Error, ScheduleAssignmentCreate>({
    mutationFn: (data) =>
      api.post('/schedules/assignments', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete(`/schedules/assignments/${assignmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

// ─── Staff Schedule View Query ──────────────────────────────

export function useStaffScheduleView(
  eventId: string | undefined,
  date: string | undefined
) {
  return useQuery<StaffScheduleEntry[]>({
    queryKey: ['schedules', 'staff-view', eventId, date],
    queryFn: () =>
      api
        .get('/schedules/staff-view', { params: { event_id: eventId, date } })
        .then((r) => r.data),
    enabled: !!eventId && !!date,
  })
}
