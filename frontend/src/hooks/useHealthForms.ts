/**
 * Camp Connect - Health Forms React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  HealthFormTemplate,
  HealthFormTemplateCreate,
  HealthFormTemplateUpdate,
  HealthForm,
  HealthFormAssign,
  HealthFormSubmit,
  HealthFormSubmission,
  HealthFormReview,
} from '../types/health'

interface TemplateFilters {
  category?: string
  search?: string
}

interface FormFilters {
  camper_id?: string
  event_id?: string
  status?: string
}

// ─── Template hooks ──────────────────────────────────────────

export function useHealthTemplates(filters?: TemplateFilters) {
  return useQuery<HealthFormTemplate[]>({
    queryKey: ['health-templates', filters],
    queryFn: () =>
      api.get('/health/templates', { params: filters }).then((r) => r.data),
  })
}

export function useHealthTemplate(id: string | undefined) {
  return useQuery<HealthFormTemplate>({
    queryKey: ['health-templates', id],
    queryFn: () => api.get(`/health/templates/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateHealthTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: HealthFormTemplateCreate) =>
      api.post('/health/templates', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-templates'] })
    },
  })
}

export function useUpdateHealthTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HealthFormTemplateUpdate }) =>
      api.put(`/health/templates/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-templates'] })
    },
  })
}

export function useDeleteHealthTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/health/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-templates'] })
    },
  })
}

// ─── Form hooks ──────────────────────────────────────────────

export function useHealthForms(filters?: FormFilters) {
  return useQuery<HealthForm[]>({
    queryKey: ['health-forms', filters],
    queryFn: () =>
      api.get('/health/forms', { params: filters }).then((r) => r.data),
  })
}

export function useHealthForm(id: string | undefined) {
  return useQuery<HealthForm>({
    queryKey: ['health-forms', id],
    queryFn: () => api.get(`/health/forms/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useAssignHealthForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: HealthFormAssign) =>
      api.post('/health/forms/assign', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-forms'] })
    },
  })
}

export function useSubmitHealthForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HealthFormSubmit }) =>
      api.post(`/health/forms/${id}/submit`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-forms'] })
    },
  })
}

export function useReviewHealthForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HealthFormReview }) =>
      api.post(`/health/forms/${id}/review`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-forms'] })
    },
  })
}

export function useHealthFormSubmission(formId: string | undefined) {
  return useQuery<HealthFormSubmission>({
    queryKey: ['health-form-submission', formId],
    queryFn: () =>
      api.get(`/health/forms/${formId}/submission`).then((r) => r.data),
    enabled: !!formId,
  })
}
