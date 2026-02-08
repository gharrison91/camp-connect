/**
 * Camp Connect - Events React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Event, EventCreate, EventUpdate } from '../types'

interface EventFilters {
  search?: string;
  status?: string;
}

export function useEvents(filters?: EventFilters) {
  return useQuery<Event[]>({
    queryKey: ['events', filters],
    queryFn: () =>
      api
        .get('/events', { params: filters })
        .then((r) => r.data),
  })
}

export function useEvent(eventId: string | undefined) {
  return useQuery<Event>({
    queryKey: ['events', eventId],
    queryFn: () => api.get(`/events/${eventId}`).then((r) => r.data),
    enabled: !!eventId,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EventCreate) =>
      api.post('/events', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventUpdate }) =>
      api.put(`/events/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useCloneEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name?: string; start_date: string; end_date: string }
    }) => api.post(`/events/${id}/clone`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
