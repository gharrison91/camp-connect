/**
 * Camp Connect - Parent Communication Log & Check-In React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ParentLogEntry, CamperCheckIn } from '../types'

interface LogFilters {
  parent_id?: string
  camper_id?: string
  log_type?: string
  sentiment?: string
  date_from?: string
  date_to?: string
  search?: string
}

interface CheckInFilters {
  camper_id?: string
  date?: string
  check_in_type?: string
}

interface ParentLogStats {
  total_communications_this_week: number
  check_ins_today: number
  follow_ups_due: number
  response_rate: number
  by_type: Record<string, number>
  by_sentiment: Record<string, number>
}

export function useParentLogEntries(filters?: LogFilters) {
  return useQuery<ParentLogEntry[]>({
    queryKey: ['parent-log-entries', filters],
    queryFn: () => api.get('/parent-logs/entries', { params: filters }).then((r) => r.data),
  })
}

export function useParentLogStats() {
  return useQuery<ParentLogStats>({
    queryKey: ['parent-log-stats'],
    queryFn: () => api.get('/parent-logs/stats').then((r) => r.data),
  })
}

export function useFollowUps(overdueOnly = false) {
  return useQuery<ParentLogEntry[]>({
    queryKey: ['parent-log-follow-ups', overdueOnly],
    queryFn: () =>
      api.get('/parent-logs/follow-ups', { params: { overdue_only: overdueOnly } }).then((r) => r.data),
  })
}

export function useCheckIns(filters?: CheckInFilters) {
  return useQuery<CamperCheckIn[]>({
    queryKey: ['camper-check-ins', filters],
    queryFn: () => api.get('/parent-logs/check-ins', { params: filters }).then((r) => r.data),
  })
}

export function useCreateLogEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/parent-logs/entries', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-log-entries'] })
      qc.invalidateQueries({ queryKey: ['parent-log-stats'] })
      qc.invalidateQueries({ queryKey: ['parent-log-follow-ups'] })
    },
  })
}

export function useCreateCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/parent-logs/check-ins', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['camper-check-ins'] })
      qc.invalidateQueries({ queryKey: ['parent-log-stats'] })
    },
  })
}

export function useCompleteFollowUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) =>
      api.post(`/parent-logs/follow-ups/${entryId}/complete`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-log-entries'] })
      qc.invalidateQueries({ queryKey: ['parent-log-follow-ups'] })
      qc.invalidateQueries({ queryKey: ['parent-log-stats'] })
    },
  })
}

export function useShareCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (checkInId: string) =>
      api.post(`/parent-logs/check-ins/${checkInId}/share`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['camper-check-ins'] })
    },
  })
}
