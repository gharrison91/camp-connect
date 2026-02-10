/**
 * Camp Connect - Face Recognition React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Types ──────────────────────────────────────────────────

export interface FaceTag {
  id: string
  photo_id: string
  camper_id: string | null
  camper_name: string | null
  bounding_box: {
    top: number
    left: number
    width: number
    height: number
  }
  confidence: number
  similarity: number
  status: 'confirmed' | 'suggested' | 'rejected'
  created_at: string
}

export interface CamperPhoto {
  photo_id: string
  photo_url: string
  thumbnail_url: string | null
  caption: string | null
  confidence: number
  similarity: number
  bounding_box: {
    top: number
    left: number
    width: number
    height: number
  }
  taken_at: string
  created_at: string
}

export interface IndexFaceResponse {
  status: 'indexed' | 'no_face_detected'
  face_id?: string
  camper_id?: string
  message?: string
}

export interface ReprocessPhotoResponse {
  photo_id: string
  faces_detected: number
  faces_matched: number
  message: string
}

// ─── Queries ────────────────────────────────────────────────

export function usePhotoFaceTags(photoId: string) {
  return useQuery<FaceTag[]>({
    queryKey: ['photo-face-tags', photoId],
    queryFn: () =>
      api
        .get(`/recognition/photos/${photoId}/faces`)
        .then((r) => r.data),
    enabled: !!photoId,
  })
}

export function useCamperPhotos(camperId: string) {
  return useQuery<CamperPhoto[]>({
    queryKey: ['camper-photos', camperId],
    queryFn: () =>
      api
        .get(`/recognition/campers/${camperId}/photos`)
        .then((r) => r.data),
    enabled: !!camperId,
  })
}

// ─── Mutations ──────────────────────────────────────────────

export function useIndexCamperFace() {
  const queryClient = useQueryClient()
  return useMutation<IndexFaceResponse, Error, string>({
    mutationFn: (camperId: string) =>
      api
        .post(`/recognition/index/${camperId}`)
        .then((r) => r.data),
    onSuccess: (_data, camperId) => {
      queryClient.invalidateQueries({ queryKey: ['camper-photos', camperId] })
    },
  })
}

export function useReprocessPhoto() {
  const queryClient = useQueryClient()
  return useMutation<ReprocessPhotoResponse, Error, string>({
    mutationFn: (photoId: string) =>
      api
        .post(`/recognition/reprocess/${photoId}`)
        .then((r) => r.data),
    onSuccess: (_data, photoId) => {
      queryClient.invalidateQueries({ queryKey: ['photo-face-tags', photoId] })
      queryClient.invalidateQueries({ queryKey: ['camper-photos'] })
    },
  })
}

export interface BulkReprocessResponse {
  total: number
  processed: number
  matches_found: number
  errors: number
}

export function useBulkReprocessPhotos() {
  const queryClient = useQueryClient()
  return useMutation<BulkReprocessResponse, Error, string[] | null>({
    mutationFn: (photoIds: string[] | null) =>
      api
        .post('/recognition/reprocess-bulk', { photo_ids: photoIds })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-face-tags'] })
      queryClient.invalidateQueries({ queryKey: ['camper-photos'] })
      queryClient.invalidateQueries({ queryKey: ['photos'] })
    },
  })
}
