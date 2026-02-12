/**
 * Camp Connect - Program Evaluation React Query Hooks
 * Hooks for program evaluation CRUD and statistics.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgramEval {
  id: string
  org_id: string
  program_name: string
  category: 'arts' | 'sports' | 'outdoor' | 'academic' | 'social' | 'other'
  evaluator_name: string
  rating: number
  strengths: string | null
  improvements: string | null
  camper_engagement: 'low' | 'medium' | 'high'
  safety_rating: number
  notes: string | null
  eval_date: string | null
  created_at: string
  updated_at: string | null
}

export interface ProgramEvalStats {
  total_evals: number
  avg_rating: number
  avg_safety: number
  by_category: Record<string, { count: number; avg_rating: number; avg_safety: number }>
  top_programs: { program_name: string; eval_count: number; avg_rating: number }[]
}

export interface ProgramEvalCreatePayload {
  program_name: string
  category?: string
  evaluator_name: string
  rating: number
  strengths?: string
  improvements?: string
  camper_engagement?: string
  safety_rating: number
  notes?: string
  eval_date?: string
}

export type ProgramEvalUpdatePayload = Partial<ProgramEvalCreatePayload>

interface ProgramEvalFilters {
  search?: string
  category?: string
  min_rating?: number
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useProgramEvals(filters?: ProgramEvalFilters) {
  return useQuery<ProgramEval[]>({
    queryKey: ['program-evals', filters],
    queryFn: () => {
      const params: Record<string, string | number> = {}
      if (filters?.search) params.search = filters.search
      if (filters?.category) params.category = filters.category
      if (filters?.min_rating) params.min_rating = filters.min_rating
      return api.get('/program-eval', { params }).then((r) => r.data)
    },
  })
}

export function useProgramEvalStats() {
  return useQuery<ProgramEvalStats>({
    queryKey: ['program-evals', 'stats'],
    queryFn: () => api.get('/program-eval/stats').then((r) => r.data),
  })
}

export function useCreateProgramEval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProgramEvalCreatePayload) =>
      api.post('/program-eval', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-evals'] })
    },
  })
}

export function useUpdateProgramEval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProgramEvalUpdatePayload }) =>
      api.put(`/program-eval/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-evals'] })
    },
  })
}

export function useDeleteProgramEval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/program-eval/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-evals'] })
    },
  })
}
