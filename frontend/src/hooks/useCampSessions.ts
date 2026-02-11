import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CampSessionData {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  capacity: number
  enrolled_count: number
  waitlist_count: number
  price?: number
  age_min?: number
  age_max?: number
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  created_at: string
}

export interface SessionEnrollmentData {
  id: string
  session_id: string
  camper_id: string
  camper_name?: string
  status: string
  enrolled_at: string
}

export interface SessionStatsData {
  total_sessions: number
  active_sessions: number
  total_enrolled: number
  total_capacity: number
  occupancy_rate: number
}

export function useCampSessions(filters?: { status?: string; search?: string }) {
  return useQuery<CampSessionData[]>({
    queryKey: ['camp-sessions', filters],
    queryFn: () => api.get('/camp-sessions', { params: filters }).then((r) => r.data),
  })
}

export function useCampSessionStats() {
  return useQuery<SessionStatsData>({
    queryKey: ['camp-sessions', 'stats'],
    queryFn: () => api.get('/camp-sessions/stats').then((r) => r.data),
  })
}

export function useCreateCampSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CampSessionData>) =>
      api.post('/camp-sessions', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camp-sessions'] }),
  })
}

export function useUpdateCampSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CampSessionData> }) =>
      api.put(`/camp-sessions/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camp-sessions'] }),
  })
}

export function useDeleteCampSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/camp-sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camp-sessions'] }),
  })
}

export function useSessionEnrollments(sessionId: string | null) {
  return useQuery<SessionEnrollmentData[]>({
    queryKey: ['camp-sessions', sessionId, 'enrollments'],
    queryFn: () => api.get(`/camp-sessions/${sessionId}/enrollments`).then((r) => r.data),
    enabled: !!sessionId,
  })
}

export function useEnrollCamper() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, camperId }: { sessionId: string; camperId: string }) =>
      api.post(`/camp-sessions/${sessionId}/enroll`, { camper_id: camperId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camp-sessions'] }),
  })
}

export function useUnenrollCamper() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      api.delete(`/camp-sessions/enrollments/${enrollmentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camp-sessions'] }),
  })
}
