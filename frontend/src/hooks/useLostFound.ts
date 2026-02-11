/**
 * Camp Connect - Lost & Found React Query Hooks
 * Hooks for lost item tracking, claiming, and statistics.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LostItemData {
  id: string
  org_id: string
  item_name: string
  description: string | null
  category: "clothing" | "electronics" | "sports" | "personal" | "other"
  location_found: string | null
  found_date: string | null
  found_by: string | null
  photo_url: string | null
  claimed_by: string | null
  claimed_date: string | null
  status: "unclaimed" | "claimed" | "disposed"
  created_at: string
}

export interface LostFoundStats {
  total_items: number
  unclaimed: number
  claimed: number
  disposed: number
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useLostFoundItems(filters?: {
  category?: string
  status?: string
  search?: string
}) {
  return useQuery<LostItemData[]>({
    queryKey: ["lost-found", filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.category) params.category = filters.category
      if (filters?.status) params.status = filters.status
      if (filters?.search) params.search = filters.search
      return api.get("/lost-found", { params }).then((r) => r.data)
    },
  })
}

export function useLostFoundItem(itemId: string | undefined) {
  return useQuery<LostItemData>({
    queryKey: ["lost-found", itemId],
    queryFn: () => api.get(`/lost-found/${itemId}`).then((r) => r.data),
    enabled: !!itemId,
  })
}

export function useLostFoundStats() {
  return useQuery<LostFoundStats>({
    queryKey: ["lost-found-stats"],
    queryFn: () => api.get("/lost-found/stats").then((r) => r.data),
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useCreateLostItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<LostItemData>) =>
      api.post("/lost-found", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-found"] })
      queryClient.invalidateQueries({ queryKey: ["lost-found-stats"] })
    },
  })
}

export function useUpdateLostItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LostItemData> }) =>
      api.put(`/lost-found/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-found"] })
      queryClient.invalidateQueries({ queryKey: ["lost-found-stats"] })
    },
  })
}

export function useDeleteLostItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lost-found/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-found"] })
      queryClient.invalidateQueries({ queryKey: ["lost-found-stats"] })
    },
  })
}

export function useClaimLostItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, claimed_by }: { id: string; claimed_by: string }) =>
      api.post(`/lost-found/${id}/claim?claimed_by=${encodeURIComponent(claimed_by)}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-found"] })
      queryClient.invalidateQueries({ queryKey: ["lost-found-stats"] })
    },
  })
}

export function useUnclaimLostItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/lost-found/${id}/unclaim`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-found"] })
      queryClient.invalidateQueries({ queryKey: ["lost-found-stats"] })
    },
  })
}
