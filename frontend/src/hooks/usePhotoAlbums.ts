/**
 * Camp Connect - Photo Albums React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface PhotoAlbum {
  id: string
  name: string
  description: string | null
  cover_photo_id: string | null
  cover_photo_url: string | null
  event_id: string | null
  activity_id: string | null
  photo_count: number
  is_auto_generated: boolean
  created_at: string
  updated_at: string
}

export function usePhotoAlbums(params?: { event_id?: string; search?: string }) {
  return useQuery<PhotoAlbum[]>({
    queryKey: ['photo-albums', params],
    queryFn: () => api.get('/photo-albums', { params }).then((r) => r.data),
  })
}

export function usePhotoAlbum(id: string | undefined) {
  return useQuery<PhotoAlbum>({
    queryKey: ['photo-albums', id],
    queryFn: () => api.get(`/photo-albums/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreatePhotoAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      description?: string
      event_id?: string
      activity_id?: string
    }) => api.post('/photo-albums', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-albums'] })
    },
  })
}

export function useUpdatePhotoAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; cover_photo_id?: string } }) =>
      api.put(`/photo-albums/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-albums'] })
    },
  })
}

export function useDeletePhotoAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/photo-albums/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-albums'] })
    },
  })
}

export function useAddPhotosToAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ albumId, photoIds }: { albumId: string; photoIds: string[] }) =>
      api.post(`/photo-albums/${albumId}/photos`, photoIds).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-albums'] })
      qc.invalidateQueries({ queryKey: ['photos'] })
    },
  })
}

export function useSchoolSearch() {
  // This is in a separate hook but adding here for convenience
  return useMutation({
    mutationFn: (query: string) =>
      api.get('/schools/search', { params: { q: query } }).then((r) => r.data),
  })
}
