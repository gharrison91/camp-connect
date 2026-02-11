/**
 * Camp Connect - Custom Fields Hooks
 * React Query hooks for custom field definitions and values.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CustomFieldDefinition, CustomFieldValue, CustomFieldDefinitionCreate } from '@/types'

// ─── Definitions ────────────────────────────────────────────

export function useCustomFieldDefinitions(entityType?: string) {
  return useQuery({
    queryKey: ['custom-field-definitions', entityType],
    queryFn: async () => {
      const params = entityType ? { entity_type: entityType } : {}
      const res = await api.get('/custom-fields/definitions', { params })
      return res.data as CustomFieldDefinition[]
    },
  })
}

export function useCreateCustomField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CustomFieldDefinitionCreate) => {
      const res = await api.post('/custom-fields/definitions', data)
      return res.data as CustomFieldDefinition
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-field-definitions'] })
    },
  })
}

export function useUpdateCustomField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomFieldDefinition> }) => {
      const res = await api.put(`/custom-fields/definitions/${id}`, data)
      return res.data as CustomFieldDefinition
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-field-definitions'] })
    },
  })
}

export function useDeleteCustomField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/custom-fields/definitions/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-field-definitions'] })
    },
  })
}

export function useReorderCustomFields() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const res = await api.put('/custom-fields/definitions/reorder', { items })
      return res.data as CustomFieldDefinition[]
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-field-definitions'] })
    },
  })
}

// ─── Values ─────────────────────────────────────────────────

export function useCustomFieldValues(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['custom-field-values', entityType, entityId],
    queryFn: async () => {
      const res = await api.get(`/custom-fields/values/${entityType}/${entityId}`)
      return res.data as CustomFieldValue[]
    },
    enabled: !!entityType && !!entityId,
  })
}

export function useSaveCustomFieldValues() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      values,
    }: {
      entityType: string
      entityId: string
      values: { field_definition_id: string; value: string | null }[]
    }) => {
      const res = await api.put(`/custom-fields/values/${entityType}/${entityId}`, { values })
      return res.data as CustomFieldValue[]
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ['custom-field-values', variables.entityType, variables.entityId],
      })
    },
  })
}
