/**
 * Camp Connect - Incident & Safety Reporting React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Incident } from '../types'

interface IncidentFilters {
  status?: string
  severity?: string
  incident_type?: string
  date_from?: string
  date_to?: string
  search?: string
}

interface IncidentStats {
  total: number
  open_count: number
  critical_count: number
  resolved_this_week: number
  avg_resolution_hours: number | null
  by_type: Record<string, number>
  by_severity: Record<string, number>
  by_status: Record<string, number>
  recent_trend: Array<Record<string, unknown>>
}

export function useIncidents(filters?: IncidentFilters) {
  return useQuery<Incident[]>({
    queryKey: ['incidents', filters],
    queryFn: () => api.get('/incidents', { params: filters }).then((r) => r.data),
  })
}

export function useIncident(id: string | null) {
  return useQuery<Incident>({
    queryKey: ['incident', id],
    queryFn: () => api.get(`/incidents/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useIncidentStats() {
  return useQuery<IncidentStats>({
    queryKey: ['incident-stats'],
    queryFn: () => api.get('/incidents/stats').then((r) => r.data),
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/incidents', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['incident-stats'] })
    },
  })
}

export function useUpdateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/incidents/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['incident'] })
      qc.invalidateQueries({ queryKey: ['incident-stats'] })
    },
  })
}

export function useDeleteIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/incidents/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['incident-stats'] })
    },
  })
}

export function useAddFollowUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      api.post(`/incidents/${id}/follow-up`, { note }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['incident'] })
      qc.invalidateQueries({ queryKey: ['incident-stats'] })
    },
  })
}

export function useResolveIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      api.post(`/incidents/${id}/resolve`, { resolution }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['incident'] })
      qc.invalidateQueries({ queryKey: ['incident-stats'] })
    },
  })
}
