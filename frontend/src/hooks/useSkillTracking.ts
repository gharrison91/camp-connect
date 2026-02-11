/**
 * Camp Connect - Skill Tracking React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  SkillCategory,
  Skill,
  CamperSkillProgress,
  SkillLeaderboardEntry,
  SkillCategoryStats,
} from '../types'

// ---- Categories ----

export function useSkillCategories() {
  return useQuery<SkillCategory[]>({
    queryKey: ['skill-categories'],
    queryFn: () => api.get('/skill-tracking/categories').then((r) => r.data),
  })
}

export function useCreateSkillCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<SkillCategory>) =>
      api.post('/skill-tracking/categories', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skill-categories'] })
    },
  })
}

export function useUpdateSkillCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SkillCategory> }) =>
      api.put(`/skill-tracking/categories/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skill-categories'] })
    },
  })
}

export function useDeleteSkillCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/skill-tracking/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skill-categories'] })
      qc.invalidateQueries({ queryKey: ['skills'] })
    },
  })
}

// ---- Skills ----

export function useSkills(categoryId?: string) {
  return useQuery<Skill[]>({
    queryKey: ['skills', categoryId],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (categoryId) params.category_id = categoryId
      return api.get('/skill-tracking/skills', { params }).then((r) => r.data)
    },
  })
}

export function useCreateSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Skill>) =>
      api.post('/skill-tracking/skills', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] })
      qc.invalidateQueries({ queryKey: ['skill-categories'] })
    },
  })
}

export function useDeleteSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/skill-tracking/skills/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] })
      qc.invalidateQueries({ queryKey: ['skill-categories'] })
    },
  })
}

// ---- Evaluate ----

export function useEvaluateCamper() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      camper_id: string
      skill_id: string
      level: number
      evaluator: string
      notes?: string
      target_level?: number
    }) => api.post('/skill-tracking/evaluate', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['camper-skill-progress'] })
      qc.invalidateQueries({ queryKey: ['skill-leaderboard'] })
      qc.invalidateQueries({ queryKey: ['skill-stats'] })
    },
  })
}

// ---- Progress ----

export function useCamperSkillProgress(camperId: string | undefined) {
  return useQuery<CamperSkillProgress[]>({
    queryKey: ['camper-skill-progress', camperId],
    queryFn: () =>
      api.get(`/skill-tracking/progress/${camperId}`).then((r) => r.data),
    enabled: !!camperId,
  })
}

// ---- Leaderboard ----

export function useSkillLeaderboard() {
  return useQuery<SkillLeaderboardEntry[]>({
    queryKey: ['skill-leaderboard'],
    queryFn: () => api.get('/skill-tracking/leaderboard').then((r) => r.data),
  })
}

// ---- Stats ----

export function useSkillCategoryStats() {
  return useQuery<SkillCategoryStats[]>({
    queryKey: ['skill-stats'],
    queryFn: () => api.get('/skill-tracking/stats').then((r) => r.data),
  })
}
