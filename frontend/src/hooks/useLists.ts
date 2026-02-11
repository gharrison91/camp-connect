/**
 * Camp Connect - Saved Lists React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Types ──────────────────────────────────────────────────

export interface SavedList {
  id: string
  name: string
  description: string | null
  list_type: 'static' | 'dynamic'
  entity_type: string
  filter_criteria: Record<string, unknown> | null
  member_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SavedListMember {
  id: string
  list_id: string
  entity_type: string
  entity_id: string
  entity_name: string | null
  entity_email: string | null
  added_at: string
}

export interface SavedListDetail extends SavedList {
  members: SavedListMember[]
}

export interface SavedListCreate {
  name: string
  description?: string
  list_type?: string
  entity_type?: string
  filter_criteria?: Record<string, unknown>
}

export interface SavedListUpdate extends Partial<SavedListCreate> {}

// ─── List Hooks ──────────────────────────────────────────────

export function useSavedLists() {
  return useQuery<SavedList[]>({
    queryKey: ['saved-lists'],
    queryFn: () => api.get('/lists').then((r) => r.data),
  })
}

export function useSavedList(id: string | undefined) {
  return useQuery<SavedListDetail>({
    queryKey: ['saved-lists', id],
    queryFn: () => api.get(`/lists/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateSavedList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SavedListCreate) =>
      api.post('/lists', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lists'] })
    },
  })
}

export function useUpdateSavedList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SavedListUpdate }) =>
      api.put(`/lists/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lists'] })
    },
  })
}

export function useDeleteSavedList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lists'] })
    },
  })
}

// ─── Member Hooks ────────────────────────────────────────────

export function useAddListMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      listId,
      data,
    }: {
      listId: string
      data: { entity_type: string; entity_id: string }
    }) => api.post(`/lists/${listId}/members`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lists'] })
    },
  })
}

export function useRemoveListMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      listId,
      memberId,
    }: {
      listId: string
      memberId: string
    }) => api.delete(`/lists/${listId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lists'] })
    },
  })
}

// ─── Preview Types & Hooks ──────────────────────────────────

export interface PreviewResultItem {
  id: string
  name: string
  email: string | null
  extra: Record<string, string> | null
}

export interface PreviewResponse {
  total_count: number
  results: PreviewResultItem[]
  entity_type: string
}

export interface PreviewRequestPayload {
  entity_type: string
  filter_criteria: Record<string, unknown>
}

export function usePreviewFilter() {
  return useMutation<PreviewResponse, Error, PreviewRequestPayload>({
    mutationFn: (data) =>
      api.post('/lists/preview', data).then((r) => r.data),
  })
}

export function usePreviewSavedList() {
  const queryClient = useQueryClient()
  return useMutation<PreviewResponse, Error, string>({
    mutationFn: (listId) =>
      api.post(`/lists/${listId}/preview`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-lists'] })
    },
  })
}
