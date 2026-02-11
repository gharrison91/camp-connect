/**
 * Camp Connect - Group Notes React Query Hooks
 * Hooks for shift-based group notes CRUD, filtering, and stats.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface GroupNoteData {
  id: string
  org_id: string
  group_name: string
  group_type: 'bunk' | 'activity' | 'age_group' | 'custom'
  note_text: string
  author_name: string
  shift: 'morning' | 'afternoon' | 'evening' | 'overnight'
  priority: 'normal' | 'important' | 'urgent'
  tags: string[]
  created_at: string
}

export interface GroupNoteStats {
  total_notes: number
  urgent_count: number
  groups_with_notes: number
  today_count: number
}

interface GroupNoteFilters {
  group_name?: string
  group_type?: string
  shift?: string
  priority?: string
  limit?: number
  offset?: number
}

// ---- List / Read hooks ----

export function useGroupNotes(filters: GroupNoteFilters = {}) {
  return useQuery<GroupNoteData[]>({
    queryKey: ['group-notes', filters],
    queryFn: () => {
      const params: Record<string, string | number> = {}
      if (filters.group_name) params.group_name = filters.group_name
      if (filters.group_type) params.group_type = filters.group_type
      if (filters.shift) params.shift = filters.shift
      if (filters.priority) params.priority = filters.priority
      if (filters.limit) params.limit = filters.limit
      if (filters.offset) params.offset = filters.offset
      return api.get('/group-notes', { params }).then((r) => r.data)
    },
  })
}

export function useGroupNote(noteId: string | undefined) {
  return useQuery<GroupNoteData>({
    queryKey: ['group-notes', noteId],
    queryFn: () => api.get(`/group-notes/${noteId}`).then((r) => r.data),
    enabled: !!noteId,
  })
}

export function useGroupNoteStats() {
  return useQuery<GroupNoteStats>({
    queryKey: ['group-note-stats'],
    queryFn: () => api.get('/group-notes/stats').then((r) => r.data),
  })
}

// ---- Mutation hooks ----

export function useCreateGroupNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<GroupNoteData, 'id' | 'org_id' | 'created_at'>) =>
      api.post('/group-notes', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-notes'] })
      queryClient.invalidateQueries({ queryKey: ['group-note-stats'] })
    },
  })
}

export function useUpdateGroupNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GroupNoteData> }) =>
      api.put(`/group-notes/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-notes'] })
      queryClient.invalidateQueries({ queryKey: ['group-note-stats'] })
    },
  })
}

export function useDeleteGroupNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/group-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-notes'] })
      queryClient.invalidateQueries({ queryKey: ['group-note-stats'] })
    },
  })
}
