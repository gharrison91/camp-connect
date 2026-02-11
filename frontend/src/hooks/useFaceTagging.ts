/**
 * Camp Connect - Face Tagging React Query Hooks
 * Hooks for the face tagging management workflow.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DetectedFace, FaceSuggestion, FaceTagStats } from '@/types'

// ─── Queries ────────────────────────────────────────────────

export function useUntaggedFaces(page = 1, perPage = 20) {
  return useQuery<{ faces: DetectedFace[]; total: number }>({
    queryKey: ['face-tagging', 'untagged', page, perPage],
    queryFn: () =>
      api
        .get('/recognition/faces/untagged', {
          params: { page, per_page: perPage },
        })
        .then((r) => r.data),
  })
}

export function useFaceSuggestions(faceId: string | null) {
  return useQuery<FaceSuggestion[]>({
    queryKey: ['face-tagging', 'suggestions', faceId],
    queryFn: () =>
      api
        .get(`/recognition/faces/${faceId}/suggestions`)
        .then((r) => r.data),
    enabled: !!faceId,
  })
}

export function useFaceTagStats() {
  return useQuery<FaceTagStats>({
    queryKey: ['face-tagging', 'stats'],
    queryFn: () =>
      api.get('/recognition/faces/stats').then((r) => r.data),
  })
}

// ─── Mutations ──────────────────────────────────────────────

export function useTagFace() {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { faceId: string; camperId: string }
  >({
    mutationFn: ({ faceId, camperId }) =>
      api
        .post(`/recognition/faces/${faceId}/tag`, {
          camper_id: camperId,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-tagging'] })
      queryClient.invalidateQueries({ queryKey: ['photo-face-tags'] })
    },
  })
}

export function useDismissFace() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (faceId: string) =>
      api
        .post(`/recognition/faces/${faceId}/dismiss`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-tagging'] })
    },
  })
}

export function useBatchAutoTag() {
  const queryClient = useQueryClient()
  return useMutation<
    { tagged: number; dismissed: number },
    Error,
    { minConfidence?: number; action: 'tag' | 'dismiss' }
  >({
    mutationFn: (params) =>
      api
        .post('/recognition/faces/batch', params)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-tagging'] })
      queryClient.invalidateQueries({ queryKey: ['photo-face-tags'] })
    },
  })
}
