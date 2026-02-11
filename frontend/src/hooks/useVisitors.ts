/**
 * Camp Connect - Visitor Management React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Visitor, VisitorStats } from '../types'

// ─── List / Filter ────────────────────────────────────────────

interface VisitorFilters {
  status?: string
  visitor_type?: string
  date_from?: string
  date_to?: string
}

export function useVisitors(filters?: VisitorFilters) {
  return useQuery<Visitor[]>({
    queryKey: ['visitors', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.status) params.status = filters.status
      if (filters?.visitor_type) params.visitor_type = filters.visitor_type
      if (filters?.date_from) params.date_from = filters.date_from
      if (filters?.date_to) params.date_to = filters.date_to
      return api.get('/visitors', { params }).then((r) => r.data)
    },
  })
}

// ─── Current Visitors ─────────────────────────────────────────

export function useCurrentVisitors() {
  return useQuery<Visitor[]>({
    queryKey: ['visitors', 'current'],
    queryFn: () => api.get('/visitors/current').then((r) => r.data),
    refetchInterval: 30000,
  })
}

// ─── Visitor Log ──────────────────────────────────────────────

export function useVisitorLog(filters?: VisitorFilters) {
  return useQuery<Visitor[]>({
    queryKey: ['visitors', 'log', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.status) params.status = filters.status
      if (filters?.visitor_type) params.visitor_type = filters.visitor_type
      if (filters?.date_from) params.date_from = filters.date_from
      if (filters?.date_to) params.date_to = filters.date_to
      return api.get('/visitors/log', { params }).then((r) => r.data)
    },
  })
}

// ─── Stats ────────────────────────────────────────────────────

export function useVisitorStats() {
  return useQuery<VisitorStats>({
    queryKey: ['visitors', 'stats'],
    queryFn: () => api.get('/visitors/stats').then((r) => r.data),
  })
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateVisitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Visitor>) =>
      api.post('/visitors', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] })
    },
  })
}

export function usePreRegisterVisitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Visitor>) =>
      api.post('/visitors/pre-register', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] })
    },
  })
}

export function useUpdateVisitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Visitor> & { id: string }) =>
      api.put(`/visitors/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] })
    },
  })
}

export function useDeleteVisitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/visitors/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] })
    },
  })
}

export function useCheckInVisitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/visitors/${id}/check-in`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] })
    },
  })
}

export function useCheckOutVisitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/visitors/${id}/check-out`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] })
    },
  })
}
