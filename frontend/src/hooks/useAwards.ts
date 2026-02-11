/**
 * Camp Connect - Awards React Query Hooks
 * Hooks for the awards & achievements gamification system.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { AwardBadge, AwardGrant, LeaderboardEntry } from '../types'

// ---- Badge hooks ----

export function useBadges(category?: string) {
  return useQuery<AwardBadge[]>({
    queryKey: ['award-badges', category],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (category) params.category = category
      return api.get('/awards/badges', { params }).then((r) => r.data)
    },
  })
}

export function useBadge(badgeId: string | undefined) {
  return useQuery<AwardBadge>({
    queryKey: ['award-badges', badgeId],
    queryFn: () => api.get(`/awards/badges/${badgeId}`).then((r) => r.data),
    enabled: !!badgeId,
  })
}

export function useCreateBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AwardBadge>) =>
      api.post('/awards/badges', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['award-badges'] })
      queryClient.invalidateQueries({ queryKey: ['award-stats'] })
    },
  })
}

export function useUpdateBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AwardBadge> }) =>
      api.put(`/awards/badges/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['award-badges'] })
    },
  })
}

export function useDeleteBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/awards/badges/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['award-badges'] })
      queryClient.invalidateQueries({ queryKey: ['award-stats'] })
    },
  })
}

// ---- Grant hooks ----

export function useGrantAward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { badge_id: string; camper_id: string; reason?: string }) =>
      api.post('/awards/grants', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['award-badges'] })
      queryClient.invalidateQueries({ queryKey: ['award-grants'] })
      queryClient.invalidateQueries({ queryKey: ['award-leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['award-recent'] })
      queryClient.invalidateQueries({ queryKey: ['award-stats'] })
      queryClient.invalidateQueries({ queryKey: ['camper-awards'] })
    },
  })
}

export function useRevokeAward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (grantId: string) => api.delete(`/awards/grants/${grantId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['award-badges'] })
      queryClient.invalidateQueries({ queryKey: ['award-grants'] })
      queryClient.invalidateQueries({ queryKey: ['award-leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['award-recent'] })
      queryClient.invalidateQueries({ queryKey: ['award-stats'] })
      queryClient.invalidateQueries({ queryKey: ['camper-awards'] })
    },
  })
}

// ---- Camper award hooks ----

export function useCamperAwards(camperId: string | undefined) {
  return useQuery<AwardGrant[]>({
    queryKey: ['camper-awards', camperId],
    queryFn: () => api.get(`/awards/campers/${camperId}/awards`).then((r) => r.data),
    enabled: !!camperId,
  })
}

export function useCamperAwardSummary(camperId: string | undefined) {
  return useQuery({
    queryKey: ['camper-awards', camperId, 'summary'],
    queryFn: () => api.get(`/awards/campers/${camperId}/summary`).then((r) => r.data),
    enabled: !!camperId,
  })
}

// ---- Leaderboard & activity hooks ----

export function useLeaderboard(limit?: number, category?: string) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['award-leaderboard', limit, category],
    queryFn: () => {
      const params: Record<string, string | number> = {}
      if (limit) params.limit = limit
      if (category) params.category = category
      return api.get('/awards/leaderboard', { params }).then((r) => r.data)
    },
  })
}

export function useRecentAwards(limit?: number) {
  return useQuery<AwardGrant[]>({
    queryKey: ['award-recent', limit],
    queryFn: () => {
      const params: Record<string, number> = {}
      if (limit) params.limit = limit
      return api.get('/awards/recent', { params }).then((r) => r.data)
    },
  })
}

export function useBadgeRecipients(badgeId: string | undefined) {
  return useQuery<AwardGrant[]>({
    queryKey: ['award-badges', badgeId, 'recipients'],
    queryFn: () => api.get(`/awards/badges/${badgeId}/recipients`).then((r) => r.data),
    enabled: !!badgeId,
  })
}

export function useAwardStats() {
  return useQuery<{
    total_awards_given: number
    active_badges: number
    most_popular_badge: string | null
    top_earner_name: string | null
    top_earner_points: number
  }>({
    queryKey: ['award-stats'],
    queryFn: () => api.get('/awards/stats').then((r) => r.data),
  })
}
