/**
 * Camp Connect - Bunks React Query Hooks
 * Queries and mutations for bunk management and camper assignments.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Types ──────────────────────────────────────────────────

export interface Bunk {
  id: string
  name: string
  capacity: number
  gender_restriction: string | null
  min_age: number | null
  max_age: number | null
  location: string | null
  counselor_user_id: string | null
  counselor_name: string | null
  cabin_id: string | null
  cabin_name: string | null
  created_at: string
}

export interface BunkAssignment {
  id: string
  bunk_id: string
  camper_id: string
  event_id: string
  bed_number: number | null
  camper_name: string
  camper_age: number | null
  camper_gender: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface UnassignedCamper {
  id: string
  first_name: string
  last_name: string
  age: number | null
  gender: string | null
}

export interface Counselor {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

export interface BunkCreate {
  name: string
  capacity: number
  gender_restriction?: string
  min_age?: number | null
  max_age?: number | null
  location?: string
  counselor_user_id?: string | null
  cabin_id?: string | null
}

export interface BunkUpdate extends Partial<BunkCreate> {}

// ─── Queries ────────────────────────────────────────────────

export function useBunks() {
  return useQuery<Bunk[]>({
    queryKey: ['bunks'],
    queryFn: () => api.get('/bunks').then((r) => r.data),
  })
}

export function useBunk(bunkId: string | undefined) {
  return useQuery<Bunk>({
    queryKey: ['bunks', bunkId],
    queryFn: () => api.get(`/bunks/${bunkId}`).then((r) => r.data),
    enabled: !!bunkId,
  })
}

export function useBunkAssignments(eventId: string | undefined) {
  return useQuery<BunkAssignment[]>({
    queryKey: ['bunk-assignments', eventId],
    queryFn: () =>
      api
        .get('/bunks/assignments', { params: { event_id: eventId } })
        .then((r) => r.data),
    enabled: !!eventId,
  })
}

export function useUnassignedCampers(eventId: string | undefined) {
  return useQuery<UnassignedCamper[]>({
    queryKey: ['unassigned-campers', eventId],
    queryFn: () =>
      api
        .get('/bunks/unassigned-campers', { params: { event_id: eventId } })
        .then((r) => r.data),
    enabled: !!eventId,
  })
}

// ─── Bunk CRUD Mutations ────────────────────────────────────

export function useCreateBunk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BunkCreate) =>
      api.post('/bunks', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bunks'] })
    },
  })
}

export function useUpdateBunk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BunkUpdate }) =>
      api.put(`/bunks/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bunks'] })
    },
  })
}

export function useDeleteBunk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bunks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bunks'] })
    },
  })
}

// ─── Assignment Mutations ───────────────────────────────────

export function useAssignCamper(eventId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      bunk_id: string
      camper_id: string
      event_id: string
      start_date?: string
      end_date?: string
    }) => api.post('/bunks/assignments', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bunk-assignments', eventId] })
      queryClient.invalidateQueries({
        queryKey: ['unassigned-campers', eventId],
      })
    },
  })
}

export function useUnassignCamper(eventId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete(`/bunks/assignments/${assignmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bunk-assignments', eventId] })
      queryClient.invalidateQueries({
        queryKey: ['unassigned-campers', eventId],
      })
    },
  })
}

export function useMoveCamper(eventId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      newBunkId,
    }: {
      assignmentId: string
      newBunkId: string
    }) =>
      api
        .put(`/bunks/assignments/${assignmentId}/move`, {
          new_bunk_id: newBunkId,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bunk-assignments', eventId] })
    },
  })
}

// ─── Counselor Queries & Mutations ──────────────────────────

export function useCounselors(eventId: string | undefined) {
  return useQuery<Counselor[]>({
    queryKey: ['counselors', eventId],
    queryFn: () =>
      api
        .get('/staff/counselors', { params: { event_id: eventId } })
        .then((r) => r.data),
    enabled: !!eventId,
  })
}

export function useAssignCounselor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      bunkId,
      counselorUserId,
    }: {
      bunkId: string
      counselorUserId: string | null
    }) =>
      api
        .put(`/bunks/${bunkId}/counselor`, {
          counselor_user_id: counselorUserId,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bunks'] })
    },
  })
}

// ─── Bunk Buddy Request Types & Hooks ───────────────────────

export interface BuddyRequest {
  id: string
  event_id: string
  event_name: string | null
  requester_camper_id: string
  requester_name: string
  requested_camper_id: string
  requested_name: string
  status: 'pending' | 'approved' | 'denied'
  is_mutual: boolean
  submitted_by_contact_id: string | null
  submitted_by_name: string | null
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface BuddyRequestCreate {
  event_id: string
  requester_camper_id: string
  requested_camper_id: string
  submitted_by_contact_id?: string | null
}

export function useBuddyRequests(eventId?: string, statusFilter?: string) {
  return useQuery<BuddyRequest[]>({
    queryKey: ['buddy-requests', eventId, statusFilter],
    queryFn: () =>
      api
        .get('/bunks/buddy-requests', {
          params: {
            ...(eventId ? { event_id: eventId } : {}),
            ...(statusFilter ? { status_filter: statusFilter } : {}),
          },
        })
        .then((r) => r.data),
  })
}

export function useCreateBuddyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BuddyRequestCreate) =>
      api.post('/bunks/buddy-requests', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buddy-requests'] })
    },
  })
}

export function useUpdateBuddyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { status: 'approved' | 'denied'; admin_notes?: string }
    }) =>
      api.put(`/bunks/buddy-requests/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buddy-requests'] })
    },
  })
}

export function useDeleteBuddyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bunks/buddy-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buddy-requests'] })
    },
  })
}
