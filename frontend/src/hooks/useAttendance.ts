/**
 * Camp Connect - Attendance React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AttendanceRecord, AttendanceSession, AttendanceStats, AttendanceDailyReport } from '@/types'

interface SessionFilters {
  activity_id?: string
  start_date?: string
  end_date?: string
}

export function useAttendanceSessions(filters?: SessionFilters) {
  return useQuery<AttendanceSession[]>({
    queryKey: ['attendance-sessions', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.activity_id) params.activity_id = filters.activity_id
      if (filters?.start_date) params.start_date = filters.start_date
      if (filters?.end_date) params.end_date = filters.end_date
      return api.get('/attendance/sessions', { params }).then((r) => r.data)
    },
  })
}

export function useCamperAttendanceHistory(camperId: string | undefined, filters?: { start_date?: string; end_date?: string }) {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance-history', camperId, filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.start_date) params.start_date = filters.start_date
      if (filters?.end_date) params.end_date = filters.end_date
      return api.get(`/attendance/camper/${camperId}/history`, { params }).then((r) => r.data)
    },
    enabled: !!camperId,
  })
}

export function useAttendanceStats(filters?: SessionFilters) {
  return useQuery<AttendanceStats>({
    queryKey: ['attendance-stats', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.activity_id) params.activity_id = filters.activity_id
      if (filters?.start_date) params.start_date = filters.start_date
      if (filters?.end_date) params.end_date = filters.end_date
      return api.get('/attendance/stats', { params }).then((r) => r.data)
    },
  })
}

export function useAttendanceDailyReport(reportDate: string) {
  return useQuery<AttendanceDailyReport>({
    queryKey: ['attendance-daily-report', reportDate],
    queryFn: () => api.get('/attendance/daily-report', { params: { report_date: reportDate } }).then((r) => r.data),
    enabled: !!reportDate,
  })
}

export function useRecordAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/attendance/record', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
    },
  })
}

export function useBulkAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/attendance/bulk', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-daily-report'] })
    },
  })
}
