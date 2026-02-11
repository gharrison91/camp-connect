/**
 * Camp Connect - Camper Messages React Query Hooks
 * CRUD for parent-to-camper messaging with daily scheduling.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface CamperMessageCreate {
  camper_id: string
  contact_id: string
  event_id: string
  message_text: string
  scheduled_date: string
}

export interface CamperMessageUpdate {
  message_text?: string
}

export interface CamperMessage {
  id: string
  camper_id: string
  contact_id: string
  event_id: string
  message_text: string
  scheduled_date: string
  is_read: boolean
  read_at: string | null
  read_by: string | null
  camper_name: string | null
  contact_name: string | null
  bunk_name: string | null
  created_at: string
}

export interface DailyBunkGroup {
  bunk_id: string
  bunk_name: string
  messages: {
    id: string
    camper_id: string
    camper_name: string
    message_text: string
    is_read: boolean
    contact_id: string
  }[]
}

export interface DailyMessagesResponse {
  date: string
  bunk_groups: DailyBunkGroup[]
}

export function useCamperMessages(filters?: {
  camper_id?: string
  event_id?: string
  scheduled_date?: string
  is_read?: boolean
}) {
  return useQuery<CamperMessage[]>({
    queryKey: ['camper-messages', filters],
    queryFn: () =>
      api.get('/camper-messages', { params: filters }).then((r) => r.data),
  })
}

export function useDailyMessages(date: string | undefined, eventId?: string) {
  return useQuery<DailyMessagesResponse>({
    queryKey: ['camper-messages', 'daily', date, eventId],
    queryFn: () =>
      api
        .get(`/camper-messages/daily/${date}`, {
          params: eventId ? { event_id: eventId } : undefined,
        })
        .then((r) => r.data),
    enabled: !!date,
  })
}

export function useCreateCamperMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CamperMessageCreate) =>
      api.post('/camper-messages', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camper-messages'] })
    },
  })
}

export function useUpdateCamperMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CamperMessageUpdate }) =>
      api.put(`/camper-messages/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camper-messages'] })
    },
  })
}

export function useDeleteCamperMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/camper-messages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camper-messages'] })
    },
  })
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.put(`/camper-messages/${id}/read`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camper-messages'] })
    },
  })
}