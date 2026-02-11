import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Deal, DealCreate, DealUpdate, DealPipeline } from '@/types'

export function useDeals(stage?: string) {
  return useQuery({
    queryKey: ['deals', stage],
    queryFn: async () => {
      const params = stage ? { stage } : {}
      const res = await api.get('/deals', { params })
      return res.data as Deal[]
    },
  })
}

export function useDealPipeline() {
  return useQuery({
    queryKey: ['deal-pipeline'],
    queryFn: async () => {
      const res = await api.get('/deals/pipeline')
      return res.data as DealPipeline
    },
  })
}

export function useCreateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: DealCreate) => {
      const res = await api.post('/deals', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['deal-pipeline'] })
    },
  })
}

export function useUpdateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DealUpdate }) => {
      const res = await api.put(`/deals/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['deal-pipeline'] })
    },
  })
}

export function useDeleteDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/deals/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['deal-pipeline'] })
    },
  })
}

export function useMoveDealStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, stage, position }: { id: string; stage: string; position: number }) => {
      const res = await api.put(`/deals/${id}/stage`, { stage, position })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['deal-pipeline'] })
    },
  })
}
