/**
 * Camp Connect - Check-In / Check-Out React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckInRecord {
  id: string
  org_id: string
  camper_id: string
  camper_name: string
  type: 'check_in' | 'check_out'
  guardian_name: string | null
  guardian_relationship: string | null
  guardian_id_verified: boolean
  method: 'in_person' | 'carpool' | 'bus'
  notes: string | null
  checked_by: string | null
  created_at: string
}

export interface CheckInStats {
  total_today: number
  checked_in: number
  checked_out: number
  pending: number
  attendance_rate: number
}

export interface TodayStatus {
  camper_id: string
  camper_name: string
  status: 'checked_in' | 'checked_out' | 'pending'
  last_action: CheckInRecord | null
}

export interface TodayResponse {
  campers: TodayStatus[]
  stats: CheckInStats
}

export interface CheckInCreatePayload {
  camper_id: string
  camper_name: string
  type: 'check_in' | 'check_out'
  guardian_name?: string
  guardian_relationship?: string
  guardian_id_verified?: boolean
  method?: 'in_person' | 'carpool' | 'bus'
  notes?: string
  checked_by?: string
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCheckInToday() {
  return useQuery<TodayResponse>({
    queryKey: ['checkin-today'],
    queryFn: () => api.get('/checkin/today').then((r) => r.data),
    refetchInterval: 30_000, // Refresh every 30s for live updates
  })
}

export function useCheckInStats() {
  return useQuery<CheckInStats>({
    queryKey: ['checkin-stats'],
    queryFn: () => api.get('/checkin/stats').then((r) => r.data),
  })
}

interface HistoryFilters {
  camper_id?: string
  start_date?: string
  end_date?: string
  type?: 'check_in' | 'check_out'
}

export function useCheckInHistory(filters?: HistoryFilters) {
  return useQuery<CheckInRecord[]>({
    queryKey: ['checkin-history', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.camper_id) params.camper_id = filters.camper_id
      if (filters?.start_date) params.start_date = filters.start_date
      if (filters?.end_date) params.end_date = filters.end_date
      if (filters?.type) params.type = filters.type
      return api.get('/checkin/history', { params }).then((r) => r.data)
    },
  })
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CheckInCreatePayload) =>
      api.post('/checkin', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-today'] })
      queryClient.invalidateQueries({ queryKey: ['checkin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['checkin-history'] })
    },
  })
}
