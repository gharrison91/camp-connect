/**
 * Camp Connect - Form Builder React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Types ──────────────────────────────────────────────────

export interface FormFieldDef {
  id: string
  type: string
  label: string
  placeholder: string
  required: boolean
  width: 'full' | 'half'
  options: { label: string; value: string }[]
  validation: Record<string, unknown>
  order: number
}

export interface FormTemplate {
  id: string
  organization_id: string
  name: string
  description: string | null
  category: string
  status: 'draft' | 'published' | 'archived'
  fields: FormFieldDef[]
  settings: Record<string, unknown>
  require_signature: boolean
  version: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FormTemplateListItem {
  id: string
  name: string
  description: string | null
  category: string
  status: string
  require_signature: boolean
  field_count: number
  submission_count: number
  created_at: string
  updated_at: string
}

export interface FormTemplateCreate {
  name: string
  description?: string
  category?: string
  fields?: FormFieldDef[]
  settings?: Record<string, unknown>
  require_signature?: boolean
  status?: string
}

export interface FormTemplateUpdate extends Partial<FormTemplateCreate> {}

export interface FormSubmission {
  id: string
  template_id: string
  template_name: string | null
  submitted_by_user_id: string | null
  submitted_by_contact_id: string | null
  submitted_by_email: string | null
  submitted_by_name: string | null
  related_entity_type: string | null
  related_entity_id: string | null
  answers: Record<string, unknown>
  signature_data: Record<string, unknown> | null
  status: string
  ip_address: string | null
  submitted_at: string | null
  created_at: string
}

export interface FormSubmissionCreate {
  template_id: string
  answers: Record<string, unknown>
  signature_data?: Record<string, unknown>
  related_entity_type?: string
  related_entity_id?: string
  status?: string
}

// ─── Template Hooks ─────────────────────────────────────────

export function useFormTemplates(filters?: { category?: string; status?: string }) {
  return useQuery<FormTemplateListItem[]>({
    queryKey: ['form-templates', filters],
    queryFn: () =>
      api.get('/forms/templates', { params: filters }).then((r) => r.data),
  })
}

export function useFormTemplate(id: string | undefined) {
  return useQuery<FormTemplate>({
    queryKey: ['form-templates', id],
    queryFn: () => api.get(`/forms/templates/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateFormTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FormTemplateCreate) =>
      api.post('/forms/templates', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] })
    },
  })
}

export function useUpdateFormTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormTemplateUpdate }) =>
      api.put(`/forms/templates/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] })
    },
  })
}

export function useDeleteFormTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/forms/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] })
    },
  })
}

export function useDuplicateFormTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/forms/templates/${id}/duplicate`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] })
    },
  })
}

// ─── Submission Hooks ───────────────────────────────────────

export function useFormSubmissions(filters?: {
  template_id?: string
  status?: string
}) {
  return useQuery<{ items: FormSubmission[]; total: number }>({
    queryKey: ['form-submissions', filters],
    queryFn: () =>
      api.get('/forms/submissions', { params: filters }).then((r) => r.data),
  })
}

export function useFormSubmission(id: string | undefined) {
  return useQuery<FormSubmission>({
    queryKey: ['form-submissions', id],
    queryFn: () => api.get(`/forms/submissions/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateFormSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FormSubmissionCreate) =>
      api.post('/forms/submissions', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] })
    },
  })
}
