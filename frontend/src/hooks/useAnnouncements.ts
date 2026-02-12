/**
 * Camp Connect - Announcement React Query Hooks
 * Hooks for announcements CRUD, pin/unpin, and stats.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnnouncementData {
  id: string
  org_id: string
  title: string
  content: string
  category: 'general' | 'event' | 'safety' | 'schedule' | 'weather' | 'other'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  author: string
  target_audience: 'all' | 'staff' | 'parents' | 'campers'
  is_pinned: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface AnnouncementStats {
  total: number
  active: number
  pinned: number
  by_category: Record<string, number>
  by_priority: Record<string, number>
}

// ---------------------------------------------------------------------------
// Create / Update types
// ---------------------------------------------------------------------------

export interface AnnouncementCreate {
  title: string
  content: string
  category?: string
  priority?: string
  author: string
  target_audience?: string
  is_pinned?: boolean
  expires_at?: string | null
}

export type AnnouncementUpdate = Partial<AnnouncementCreate>

export interface AnnouncementFilters {
  category?: string
  priority?: string
  target_audience?: string
  search?: string
}

// ---------------------------------------------------------------------------
// List & single hooks
// ---------------------------------------------------------------------------

export function useAnnouncements(filters?: AnnouncementFilters) {
  return useQuery<AnnouncementData[]>({
    queryKey: ['announcements', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.category) params.category = filters.category
      if (filters?.priority) params.priority = filters.priority
      if (filters?.target_audience) params.target_audience = filters.target_audience
      if (filters?.search) params.search = filters.search
      return api.get('/announcements', { params }).then((r) => r.data)
    },
  })
}

export function useAnnouncement(id: string | undefined) {
  return useQuery<AnnouncementData>({
    queryKey: ['announcements', id],
    queryFn: () => api.get(`/announcements/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

// ---------------------------------------------------------------------------
// Stats hook
// ---------------------------------------------------------------------------

export function useAnnouncementStats() {
  return useQuery<AnnouncementStats>({
    queryKey: ['announcements', 'stats'],
    queryFn: () => api.get('/announcements/stats').then((r) => r.data),
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AnnouncementCreate) =>
      api.post('/announcements', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AnnouncementUpdate }) =>
      api.put(`/announcements/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useTogglePin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/announcements/${id}/pin`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}
