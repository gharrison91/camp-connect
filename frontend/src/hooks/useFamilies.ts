/**
 * Camp Connect - Families React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FamilyListItem {
  id: string
  family_name: string
  camper_count: number
  contact_count: number
  created_at: string
}

export interface FamilyMemberCamper {
  id: string
  first_name: string
  last_name: string
  age: number | null
  gender: string | null
}

export interface FamilyMemberContact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  relationship_type: string
  user_id: string | null
}

export interface Family {
  id: string
  family_name: string
  campers: FamilyMemberCamper[]
  contacts: FamilyMemberContact[]
  camper_count: number
  contact_count: number
  created_at: string
}

export interface FamilyCreate {
  family_name: string
}

export interface FamilyUpdate {
  family_name?: string
}

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export function useFamilies(search?: string) {
  return useQuery<FamilyListItem[]>({
    queryKey: ['families', search],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (search) params.search = search
      return api.get('/families', { params }).then((r) => r.data)
    },
  })
}

export function useFamily(familyId: string | undefined) {
  return useQuery<Family>({
    queryKey: ['families', familyId],
    queryFn: () => api.get(`/families/${familyId}`).then((r) => r.data),
    enabled: !!familyId,
  })
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

export function useCreateFamily() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FamilyCreate) =>
      api.post('/families', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
    },
  })
}

export function useUpdateFamily() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FamilyUpdate }) =>
      api.put(`/families/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
    },
  })
}

export function useAddCamperToFamily() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      familyId,
      camperId,
    }: {
      familyId: string
      camperId: string
    }) =>
      api.post(`/families/${familyId}/campers`, { camper_id: camperId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
    },
  })
}

export function useAddContactToFamily() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      familyId,
      contactId,
    }: {
      familyId: string
      contactId: string
    }) =>
      api.post(`/families/${familyId}/contacts`, { contact_id: contactId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      familyId,
      memberId,
      memberType,
    }: {
      familyId: string
      memberId: string
      memberType: 'camper' | 'contact'
    }) =>
      api.delete(
        `/families/${familyId}/members/${memberId}?member_type=${memberType}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
    },
  })
}
