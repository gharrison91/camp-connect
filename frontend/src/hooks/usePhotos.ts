/**
 * Camp Connect - Photos React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Photo } from '../types'

interface PhotoFilters {
  category?: string
  entity_id?: string
}

interface PhotoUpdateData {
  caption?: string
  tags?: string[]
  is_profile_photo?: boolean
}

export function usePhotos(filters?: PhotoFilters) {
  return useQuery<Photo[]>({
    queryKey: ['photos', filters],
    queryFn: () =>
      api
        .get('/photos', { params: filters })
        .then((r) => r.data),
  })
}

export function usePhoto(photoId: string | undefined) {
  return useQuery<Photo>({
    queryKey: ['photos', photoId],
    queryFn: () => api.get(`/photos/${photoId}`).then((r) => r.data),
    enabled: !!photoId,
  })
}

export function useUploadPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      file: File
      category: string
      entity_id?: string
      caption?: string
      custom_name?: string
    }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('category', data.category)
      if (data.entity_id) formData.append('entity_id', data.entity_id)
      if (data.caption) formData.append('caption', data.caption)
      if (data.custom_name) formData.append('custom_name', data.custom_name)
      return api
        .post('/photos', formData, {
          headers: { 'Content-Type': undefined },
        })
        .then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] })
    },
  })
}

export function useUpdatePhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhotoUpdateData }) =>
      api.put(`/photos/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] })
    },
  })
}

export function useDeletePhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/photos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] })
    },
  })
}
