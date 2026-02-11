/**
 * Camp Connect - Contact Alerts React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface ContactAlert {
  id: string
  alert_type: string
  title: string
  message: string | null
  severity: string
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  is_dismissed: boolean
  metadata_json: Record<string, unknown> | null
  created_at: string
}

export interface AlertCounts {
  total: number
  by_type: Record<string, number>
}

export function useAlerts(params?: { alert_type?: string; is_read?: boolean; limit?: number }) {
  return useQuery<ContactAlert[]>({
    queryKey: ['alerts', params],
    queryFn: () => api.get('/alerts', { params }).then((r) => r.data),
  })
}

export function useAlertCounts() {
  return useQuery<AlertCounts>({
    queryKey: ['alert-counts'],
    queryFn: () => api.get('/alerts/counts').then((r) => r.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useMarkAlertRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.put(`/alerts/${id}/read`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['alert-counts'] })
    },
  })
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.put('/alerts/read-all').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['alert-counts'] })
    },
  })
}

export function useDismissAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.put(`/alerts/${id}/dismiss`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['alert-counts'] })
    },
  })
}
