/**
 * Camp Connect - Waitlist React Query Hooks
 * Full waitlist management with offer/accept/decline workflow.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { WaitlistEntry } from '@/types'

export function useWaitlist(eventId: string | undefined) {
  return useQuery<WaitlistEntry[]>({
    queryKey: ['waitlist', eventId],
    queryFn: () =>
      api.get(`/waitlist/event/${eventId}`).then((r) => r.data),
    enabled: !!eventId,
  })
}

export function useAddToWaitlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      event_id: string
      camper_id: string
      contact_id?: string
      priority?: 'normal' | 'high' | 'vip'
      notes?: string
    }) => api.post('/waitlist', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateWaitlistEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { priority?: string; notes?: string; contact_id?: string }
    }) => api.put(`/waitlist/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    },
  })
}

export function useRemoveFromWaitlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/waitlist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useOfferSpot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      expires_in_hours,
    }: {
      id: string
      expires_in_hours?: number
    }) =>
      api
        .post(`/waitlist/${id}/offer`, {
          expires_in_hours: expires_in_hours ?? 48,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    },
  })
}

export function useAcceptSpot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/waitlist/${id}/accept`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
    },
  })
}

export function useDeclineSpot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/waitlist/${id}/decline`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useReorderWaitlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: { id: string; position: number }[]) =>
      api.post('/waitlist/reorder', { items }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    },
  })
}
