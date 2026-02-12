/**
 * Camp Connect - Feedback React Query Hooks
 * Hooks for feedback entries and stats.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedbackEntry {
  id: string
  org_id: string
  submitted_by: string
  submitter_type: 'parent' | 'camper' | 'staff'
  category: 'general' | 'activity' | 'facility' | 'food' | 'staff' | 'safety' | 'other'
  rating: number
  title: string
  comment: string
  is_anonymous: boolean
  response: string | null
  responded_by: string | null
  responded_at: string | null
  status: 'new' | 'reviewed' | 'addressed' | 'archived'
  created_at: string
  updated_at: string
}

export interface FeedbackStats {
  total: number
  avg_rating: number
  new_count: number
  by_category: Record<string, number>
  by_submitter_type: Record<string, number>
}

// ---------------------------------------------------------------------------
// Create / Update types
// ---------------------------------------------------------------------------

export interface FeedbackCreate {
  submitted_by: string
  submitter_type: string
  category: string
  rating: number
  title: string
  comment: string
  is_anonymous?: boolean
  status?: string
}

export type FeedbackUpdate = Partial<FeedbackCreate> & {
  response?: string | null
  responded_by?: string | null
  responded_at?: string | null
}

export interface FeedbackFilters {
  category?: string
  submitter_type?: string
  status?: string
  rating?: number
  search?: string
}

// ---------------------------------------------------------------------------
// Feedback hooks
// ---------------------------------------------------------------------------

export function useFeedbackEntries(filters?: FeedbackFilters) {
  return useQuery<FeedbackEntry[]>({
    queryKey: ['feedback', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.category) params.category = filters.category
      if (filters?.submitter_type) params.submitter_type = filters.submitter_type
      if (filters?.status) params.status = filters.status
      if (filters?.rating) params.rating = String(filters.rating)
      if (filters?.search) params.search = filters.search
      return api.get('/feedback', { params }).then((r) => r.data)
    },
  })
}

export function useFeedbackEntry(feedbackId: string | undefined) {
  return useQuery<FeedbackEntry>({
    queryKey: ['feedback', feedbackId],
    queryFn: () => api.get(`/feedback/${feedbackId}`).then((r) => r.data),
    enabled: !!feedbackId,
  })
}

export function useFeedbackStats() {
  return useQuery<FeedbackStats>({
    queryKey: ['feedback', 'stats'],
    queryFn: () => api.get('/feedback/stats/summary').then((r) => r.data),
  })
}

export function useCreateFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FeedbackCreate) =>
      api.post('/feedback', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
    },
  })
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeedbackUpdate }) =>
      api.put(`/feedback/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
    },
  })
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/feedback/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
    },
  })
}
