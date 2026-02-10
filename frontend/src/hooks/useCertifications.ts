/**
 * Camp Connect - Certification Types React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Types ──────────────────────────────────────────────────

export interface CertificationType {
  id: string
  name: string
  description: string | null
  is_required: boolean
  expiry_days: number | null
  created_at: string
}

export interface CertificationTypeCreate {
  name: string
  description?: string
  is_required?: boolean
  expiry_days?: number | null
}

export interface CertificationTypeUpdate {
  name?: string
  description?: string | null
  is_required?: boolean
  expiry_days?: number | null
}

// ─── Hooks ──────────────────────────────────────────────────

export function useCertificationTypes() {
  return useQuery<CertificationType[]>({
    queryKey: ['certification-types'],
    queryFn: () =>
      api.get('/staff/certification-types').then((r) => r.data),
  })
}

export function useCreateCertificationType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CertificationTypeCreate) =>
      api.post('/staff/certification-types', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-types'] })
    },
  })
}

export function useUpdateCertificationType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CertificationTypeUpdate }) =>
      api.put(`/staff/certification-types/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-types'] })
    },
  })
}

export function useDeleteCertificationType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/staff/certification-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-types'] })
    },
  })
}
