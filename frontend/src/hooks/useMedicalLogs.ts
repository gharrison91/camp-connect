/**
 * Camp Connect - Medical Log React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MedicalLogVitals {
  temperature?: string | null
  blood_pressure?: string | null
  pulse?: string | null
  respiratory_rate?: string | null
}

export interface MedicalLogMedication {
  name: string
  dose: string
  time: string
}

export interface MedicalLogEntry {
  id: string
  organization_id: string
  camper_id: string
  camper_name: string
  staff_id: string
  staff_name: string
  visit_type: string
  chief_complaint: string
  description: string
  vitals: MedicalLogVitals | null
  medications_given: MedicalLogMedication[]
  treatment_notes: string
  follow_up_required: boolean
  follow_up_date: string | null
  disposition: string
  parent_notified: boolean
  created_at: string
  updated_at: string
}

export interface MedicalLogStats {
  total_visits: number
  visits_today: number
  medications_given_today: number
  follow_ups_pending: number
}

interface MedicalLogFilters {
  page?: number
  per_page?: number
  camper_id?: string
  visit_type?: string
  date_from?: string
  date_to?: string
  search?: string
}

export function useMedicalLogs(filters?: MedicalLogFilters) {
  return useQuery<{ items: MedicalLogEntry[]; total: number; page: number; per_page: number }>({
    queryKey: ['medical-logs', filters],
    queryFn: () => api.get('/medical-logs', { params: filters }).then((r) => r.data),
  })
}

export function useMedicalLogStats() {
  return useQuery<MedicalLogStats>({
    queryKey: ['medical-log-stats'],
    queryFn: () => api.get('/medical-logs/stats').then((r) => r.data),
  })
}

export function useMedicalLogFollowUps() {
  return useQuery<MedicalLogEntry[]>({
    queryKey: ['medical-log-follow-ups'],
    queryFn: () => api.get('/medical-logs/follow-ups').then((r) => r.data),
  })
}

export function useCreateMedicalLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/medical-logs', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-logs'] })
      qc.invalidateQueries({ queryKey: ['medical-log-stats'] })
      qc.invalidateQueries({ queryKey: ['medical-log-follow-ups'] })
    },
  })
}

export function useUpdateMedicalLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      api.put(`/medical-logs/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-logs'] })
      qc.invalidateQueries({ queryKey: ['medical-log-stats'] })
      qc.invalidateQueries({ queryKey: ['medical-log-follow-ups'] })
    },
  })
}
