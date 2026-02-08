/**
 * Camp Connect - Registrations React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Registration, RegistrationCreate, WaitlistEntry } from '../types'

interface RegistrationFilters {
  event_id?: string;
  camper_id?: string;
  status?: string;
}

export function useRegistrations(filters?: RegistrationFilters) {
  return useQuery<Registration[]>({
    queryKey: ['registrations', filters],
    queryFn: () =>
      api
        .get('/registrations', { params: filters })
        .then((r) => r.data),
  })
}

export function useRegistration(registrationId: string | undefined) {
  return useQuery<Registration>({
    queryKey: ['registrations', registrationId],
    queryFn: () =>
      api.get(`/registrations/${registrationId}`).then((r) => r.data),
    enabled: !!registrationId,
  })
}

export function useCreateRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RegistrationCreate) =>
      api.post('/registrations', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['campers'] })
    },
  })
}

export function useCancelRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/registrations/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useEventWaitlist(eventId: string | undefined) {
  return useQuery<WaitlistEntry[]>({
    queryKey: ['waitlist', eventId],
    queryFn: () =>
      api
        .get(`/registrations/events/${eventId}/waitlist`)
        .then((r) => r.data),
    enabled: !!eventId,
  })
}

export function usePromoteFromWaitlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (waitlistId: string) =>
      api
        .post(`/registrations/waitlist/${waitlistId}/promote`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
