import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BackgroundCheck, BackgroundCheckCreate, BackgroundCheckUpdate, BackgroundCheckSettings } from '@/types'

export function useBackgroundChecks(status?: string) {
  return useQuery({
    queryKey: ['background-checks', status],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (status) params.status = status
      const res = await api.get('/background-checks', { params })
      return res.data as { items: BackgroundCheck[]; total: number }
    },
  })
}

export function useStaffBackgroundChecks(userId: string) {
  return useQuery({
    queryKey: ['background-checks', 'staff', userId],
    queryFn: async () => {
      const res = await api.get(`/background-checks/staff/${userId}`)
      return res.data as BackgroundCheck[]
    },
    enabled: !!userId,
  })
}

export function useBackgroundCheck(id: string) {
  return useQuery({
    queryKey: ['background-checks', id],
    queryFn: async () => {
      const res = await api.get(`/background-checks/${id}`)
      return res.data as BackgroundCheck
    },
    enabled: !!id,
  })
}

export function useCreateBackgroundCheck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BackgroundCheckCreate) => {
      const res = await api.post('/background-checks', data)
      return res.data as BackgroundCheck
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['background-checks'] })
    },
  })
}

export function useUpdateBackgroundCheck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BackgroundCheckUpdate }) => {
      const res = await api.put(`/background-checks/${id}`, data)
      return res.data as BackgroundCheck
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['background-checks'] })
    },
  })
}

export function useRefreshBackgroundCheck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/background-checks/${id}/refresh`)
      return res.data as BackgroundCheck
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['background-checks'] })
    },
  })
}

export function useBackgroundCheckSettings() {
  return useQuery({
    queryKey: ['background-check-settings'],
    queryFn: async () => {
      const res = await api.get('/background-checks/settings')
      return res.data as BackgroundCheckSettings
    },
  })
}

export function useUpdateBackgroundCheckSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { api_key?: string; webhook_url?: string }) => {
      const res = await api.put('/background-checks/settings', data)
      return res.data as BackgroundCheckSettings
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['background-check-settings'] })
    },
  })
}
