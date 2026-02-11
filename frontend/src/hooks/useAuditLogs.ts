/**
 * Camp Connect - Audit Log React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AuditLogEntry, AuditLogStats } from '@/types'

interface AuditLogListResponse {
  items: AuditLogEntry[]
  total: number
  page: number
  per_page: number
}

interface AuditLogParams {
  page?: number
  per_page?: number
  action?: string
  resource_type?: string
  user_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

interface AuditLogCreatePayload {
  action: string
  resource_type: string
  resource_id?: string
  resource_name?: string
  details?: string
}

export function useAuditLogs(params: AuditLogParams = {}) {
  return useQuery<AuditLogListResponse>({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', String(params.page))
      if (params.per_page) searchParams.set('per_page', String(params.per_page))
      if (params.action) searchParams.set('action', params.action)
      if (params.resource_type) searchParams.set('resource_type', params.resource_type)
      if (params.user_id) searchParams.set('user_id', params.user_id)
      if (params.date_from) searchParams.set('date_from', params.date_from)
      if (params.date_to) searchParams.set('date_to', params.date_to)
      if (params.search) searchParams.set('search', params.search)
      const { data } = await api.get(`/audit-logs?${searchParams.toString()}`)
      return data
    },
  })
}

export function useAuditLogStats() {
  return useQuery<AuditLogStats[]>({
    queryKey: ['audit-logs', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/audit-logs/stats')
      return data
    },
  })
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AuditLogCreatePayload) => {
      const { data } = await api.post('/audit-logs', payload)
      return data as AuditLogEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}
