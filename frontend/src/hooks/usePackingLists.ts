/**
 * Camp Connect - Packing Lists React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  PackingListTemplate,
  PackingListAssignment,
  PackingListStats,
} from '../types'

// --- Templates ---

export function usePackingListTemplates() {
  return useQuery<PackingListTemplate[]>({
    queryKey: ['packing-list-templates'],
    queryFn: () => api.get('/packing-lists/templates').then((r) => r.data),
  })
}

export function useCreatePackingListTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<PackingListTemplate, 'id' | 'organization_id' | 'created_at'>) =>
      api.post('/packing-lists/templates', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packing-list-templates'] })
      qc.invalidateQueries({ queryKey: ['packing-list-stats'] })
    },
  })
}

export function useUpdatePackingListTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<PackingListTemplate> & { id: string }) =>
      api.put(`/packing-lists/templates/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packing-list-templates'] })
    },
  })
}

export function useDeletePackingListTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/packing-lists/templates/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packing-list-templates'] })
      qc.invalidateQueries({ queryKey: ['packing-list-assignments'] })
      qc.invalidateQueries({ queryKey: ['packing-list-stats'] })
    },
  })
}

// --- Assignments ---

interface AssignmentFilters {
  template_id?: string
  camper_id?: string
}

export function usePackingListAssignments(filters?: AssignmentFilters) {
  return useQuery<PackingListAssignment[]>({
    queryKey: ['packing-list-assignments', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.template_id) params.template_id = filters.template_id
      if (filters?.camper_id) params.camper_id = filters.camper_id
      return api.get('/packing-lists/assignments', { params }).then((r) => r.data)
    },
  })
}

export function useAssignPackingList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { template_id: string; camper_ids: string[] }) =>
      api.post('/packing-lists/assign', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packing-list-assignments'] })
      qc.invalidateQueries({ queryKey: ['packing-list-stats'] })
    },
  })
}

export function useCheckPackingListItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { assignmentId: string; item_name: string; checked: boolean }) =>
      api.post(`/packing-lists/assignments/${data.assignmentId}/check`, {
        item_name: data.item_name,
        checked: data.checked,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packing-list-assignments'] })
      qc.invalidateQueries({ queryKey: ['packing-list-stats'] })
    },
  })
}

// --- Stats ---

export function usePackingListStats() {
  return useQuery<PackingListStats>({
    queryKey: ['packing-list-stats'],
    queryFn: () => api.get('/packing-lists/stats').then((r) => r.data),
  })
}
