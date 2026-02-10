/**
 * Camp Connect - Campers React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Camper, CamperCreate, CamperUpdate, CamperContactLink, PaginatedCampers } from '../types'

interface CamperFilters {
  search?: string;
  event_id?: string;
  age_min?: number;
  age_max?: number;
  skip?: number;
  limit?: number;
}

export function useCampers(filters?: CamperFilters) {
  return useQuery<PaginatedCampers>({
    queryKey: ['campers', filters],
    queryFn: () =>
      api
        .get('/campers', { params: filters })
        .then((r) => r.data),
  })
}

export function useCamper(camperId: string | undefined) {
  return useQuery<Camper>({
    queryKey: ['campers', camperId],
    queryFn: () => api.get(`/campers/${camperId}`).then((r) => r.data),
    enabled: !!camperId,
  })
}

export function useCreateCamper() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CamperCreate) =>
      api.post('/campers', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campers'] })
    },
  })
}

export function useUpdateCamper() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CamperUpdate }) =>
      api.put(`/campers/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campers'] })
    },
  })
}

export function useDeleteCamper() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/campers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campers'] })
    },
  })
}

export function useLinkContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      camperId,
      data,
    }: {
      camperId: string
      data: CamperContactLink
    }) => api.post(`/campers/${camperId}/contacts`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campers'] })
    },
  })
}

export function useUnlinkContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      camperId,
      contactId,
    }: {
      camperId: string
      contactId: string
    }) => api.delete(`/campers/${camperId}/contacts/${contactId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campers'] })
    },
  })
}

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ camperId, file }: { camperId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      return api
        .post(`/campers/${camperId}/profile-photo`, formData, {
          headers: { 'Content-Type': undefined },
        })
        .then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camper-profile'] })
      queryClient.invalidateQueries({ queryKey: ['campers'] })
    },
  })
}
