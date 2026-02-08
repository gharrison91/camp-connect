/**
 * Camp Connect - Contacts React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Contact, ContactCreate, ContactUpdate } from '../types'

interface ContactFilters {
  search?: string;
}

export function useContacts(filters?: ContactFilters) {
  return useQuery<Contact[]>({
    queryKey: ['contacts', filters],
    queryFn: () =>
      api
        .get('/contacts', { params: filters })
        .then((r) => r.data),
  })
}

export function useContact(contactId: string | undefined) {
  return useQuery<Contact>({
    queryKey: ['contacts', contactId],
    queryFn: () => api.get(`/contacts/${contactId}`).then((r) => r.data),
    enabled: !!contactId,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ContactCreate) =>
      api.post('/contacts', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactUpdate }) =>
      api.put(`/contacts/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
