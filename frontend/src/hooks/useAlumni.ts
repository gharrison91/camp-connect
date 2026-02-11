/**
 * Camp Connect - Alumni React Query Hooks
 * Hooks for the alumni network directory and stats.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Interfaces ----

export interface AlumniData {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  years_attended: number[]
  role: 'camper' | 'staff' | 'both'
  graduation_year: number | null
  current_city: string | null
  current_state: string | null
  bio: string | null
  linkedin_url: string | null
  profile_photo_url: string | null
  created_at: string
}

export interface AlumniStats {
  total_alumni: number
  camper_alumni: number
  staff_alumni: number
  avg_years_attended: number
}

// ---- List / Search ----

export function useAlumni(filters?: {
  search?: string
  role?: string
  graduation_year?: number
}) {
  return useQuery<AlumniData[]>({
    queryKey: ['alumni', filters],
    queryFn: () => {
      const params: Record<string, string | number> = {}
      if (filters?.search) params.search = filters.search
      if (filters?.role) params.role = filters.role
      if (filters?.graduation_year) params.graduation_year = filters.graduation_year
      return api.get('/alumni', { params }).then((r) => r.data)
    },
  })
}

// ---- Single record ----

export function useAlumniRecord(id: string | undefined) {
  return useQuery<AlumniData>({
    queryKey: ['alumni', id],
    queryFn: () => api.get(`/alumni/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

// ---- Create ----

export function useCreateAlumni() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AlumniData>) =>
      api.post('/alumni', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumni'] })
      queryClient.invalidateQueries({ queryKey: ['alumni-stats'] })
    },
  })
}

// ---- Update ----

export function useUpdateAlumni() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlumniData> }) =>
      api.put(`/alumni/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumni'] })
      queryClient.invalidateQueries({ queryKey: ['alumni-stats'] })
    },
  })
}

// ---- Delete ----

export function useDeleteAlumni() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/alumni/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumni'] })
      queryClient.invalidateQueries({ queryKey: ['alumni-stats'] })
    },
  })
}

// ---- Stats ----

export function useAlumniStats() {
  return useQuery<AlumniStats>({
    queryKey: ['alumni-stats'],
    queryFn: () => api.get('/alumni/stats').then((r) => r.data),
  })
}
