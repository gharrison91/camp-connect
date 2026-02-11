/**
 * Camp Connect - Permission Slips React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  PermissionSlip,
  PermissionSlipAssignment,
  PermissionSlipCreate,
  PermissionSlipUpdate,
  SlipStats,
} from '../types'


interface SlipFilters {
  search?: string
  status?: string
}


export function usePermissionSlips(filters?: SlipFilters) {
  return useQuery<PermissionSlip[]>({
    queryKey: ['permission-slips', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.search) params.search = filters.search
      if (filters?.status) params.status = filters.status
      return api.get('/permission-slips', { params }).then((r) => r.data)
    },
  })
}


export function usePermissionSlipStats() {
  return useQuery<SlipStats>({
    queryKey: ['permission-slips', 'stats'],
    queryFn: () => api.get('/permission-slips/stats').then((r) => r.data),
  })
}


export function useCreatePermissionSlip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PermissionSlipCreate) =>
      api.post('/permission-slips', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-slips'] })
    },
  })
}


export function useUpdatePermissionSlip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PermissionSlipUpdate }) =>
      api.put(`/permission-slips/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-slips'] })
    },
  })
}


export function useDeletePermissionSlip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/permission-slips/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-slips'] })
    },
  })
}


export function useAssignPermissionSlip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slipId, camperIds }: { slipId: string; camperIds: string[] }) =>
      api.post(`/permission-slips/${slipId}/assign`, { camper_ids: camperIds }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-slips'] })
    },
  })
}


export function usePermissionSlipAssignments(slipId: string | null) {
  return useQuery<PermissionSlipAssignment[]>({
    queryKey: ['permission-slips', slipId, 'assignments'],
    queryFn: () =>
      api.get(`/permission-slips/${slipId}/assignments`).then((r) => r.data),
    enabled: !!slipId,
  })
}


export function useSignAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId, signatureText, ipAddress }: {
      assignmentId: string
      signatureText: string
      ipAddress?: string
    }) =>
      api.post(`/permission-slips/assignments/${assignmentId}/sign`, {
        signature_text: signatureText,
        ip_address: ipAddress,
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-slips'] })
    },
  })
}


export function useSendReminders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slipId: string) =>
      api.post(`/permission-slips/${slipId}/remind`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-slips'] })
    },
  })
}
