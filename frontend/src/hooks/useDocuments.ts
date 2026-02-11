/**
 * Camp Connect - Document Management React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { CampDocument, DocumentFolder } from '../types'

interface DocumentFilters {
  search?: string
  category?: string
  folder_id?: string
  status?: string
}

interface DocumentCreate {
  name: string
  description?: string
  file_url?: string
  file_type?: string
  file_size?: number
  category?: string
  tags?: string[]
  version?: number
  requires_signature?: boolean
  expiry_date?: string | null
  shared_with?: string[]
  folder_id?: string | null
}

type DocumentUpdate = Partial<DocumentCreate> & { status?: string }

export function useDocuments(filters?: DocumentFilters) {
  return useQuery<CampDocument[]>({
    queryKey: ['documents', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.search) params.search = filters.search
      if (filters?.category) params.category = filters.category
      if (filters?.folder_id) params.folder_id = filters.folder_id
      if (filters?.status) params.status = filters.status
      return api.get('/documents', { params }).then((r) => r.data)
    },
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DocumentCreate) =>
      api.post('/documents', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdate }) =>
      api.put(`/documents/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useArchiveDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/documents/${id}/archive`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDocumentFolders() {
  return useQuery<DocumentFolder[]>({
    queryKey: ['document-folders'],
    queryFn: () => api.get('/documents/folders').then((r) => r.data),
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; parent_id?: string | null }) =>
      api.post('/documents/folders', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-folders'] })
    },
  })
}

export function useExpiringDocuments(daysAhead = 30) {
  return useQuery<CampDocument[]>({
    queryKey: ['documents', 'expiring', daysAhead],
    queryFn: () =>
      api.get('/documents/expiring', { params: { days_ahead: daysAhead } }).then((r) => r.data),
  })
}

export function useDocumentStats() {
  return useQuery<{
    total_documents: number
    active_documents: number
    pending_signatures: number
    expiring_soon: number
    total_storage_bytes: number
  }>({
    queryKey: ['documents', 'stats'],
    queryFn: () => api.get('/documents/stats').then((r) => r.data),
  })
}
