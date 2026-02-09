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
