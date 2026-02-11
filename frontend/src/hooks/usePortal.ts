/**
 * Camp Connect - Parent Portal React Query Hooks
 * Hooks for the parent-facing portal using /portal/* endpoints.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Portal Queries ─────────────────────────────────────────

export function usePortalCampers() {
  return useQuery<any[]>({
    queryKey: ['portal', 'campers'],
    queryFn: () => api.get('/portal/campers').then((r) => r.data),
  })
}

export function usePortalCamperProfile(camperId: string | undefined) {
  return useQuery<any>({
    queryKey: ['portal', 'campers', camperId],
    queryFn: () => api.get(`/portal/campers/${camperId}`).then((r) => r.data),
    enabled: !!camperId,
  })
}

export function usePortalInvoices() {
  return useQuery<any[]>({
    queryKey: ['portal', 'invoices'],
    queryFn: () => api.get('/portal/invoices').then((r) => r.data),
  })
}

export function usePortalPhotos() {
  return useQuery<any[]>({
    queryKey: ['portal', 'photos'],
    queryFn: () => api.get('/portal/photos').then((r) => r.data),
  })
}

// ─── Portal Mutations ───────────────────────────────────────

export function useSubmitHealthForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ healthFormId, formData }: { healthFormId: string; formData: Record<string, any> }) =>
      api.post(`/portal/health-forms/${healthFormId}/submit`, { form_data: formData }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal'] })
    },
  })
}


// --- Portal Documents ---------------------------------------------------

export interface PortalDocumentItem {
  id: string
  name: string
  type: string
  size_bytes: number
  uploaded_at: string
  camper_name: string | null
  download_url: string | null
}

export interface PortalFormAssignmentItem {
  id: string
  form_name: string
  description: string | null
  status: 'pending' | 'completed' | 'overdue'
  due_date: string | null
  camper_name: string | null
  template_id: string
  fields: any[]
  settings: Record<string, any>
  require_signature: boolean
  submitted_at: string | null
}

export function usePortalDocuments(params?: { camper_id?: string; search?: string }) {
  return useQuery<{ items: PortalDocumentItem[]; total: number }>({
    queryKey: ['portal', 'documents', params],
    queryFn: () =>
      api
        .get('/portal/documents', { params })
        .then((r) => r.data),
  })
}

export function usePortalForms(params?: { camper_id?: string; status_filter?: string }) {
  return useQuery<{ items: PortalFormAssignmentItem[]; total: number }>({
    queryKey: ['portal', 'forms', params],
    queryFn: () =>
      api
        .get('/portal/forms', { params })
        .then((r) => r.data),
  })
}

export function useSubmitPortalForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      templateId,
      answers,
      signature_data,
    }: {
      templateId: string
      answers: Record<string, any>
      signature_data?: Record<string, any> | null
    }) =>
      api
        .post('/portal/forms/' + templateId + '/submit', {
          answers,
          signature_data: signature_data || null,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'forms'] })
    },
  })
}
