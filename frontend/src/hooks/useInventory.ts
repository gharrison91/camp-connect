/**
 * Camp Connect - Inventory React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { InventoryItem, CheckoutRecord } from '../types'

export interface InventoryItemCreate {
  name: string
  category?: string
  sku?: string
  quantity?: number
  min_quantity?: number
  location?: string
  condition?: string
  unit_cost?: number
  notes?: string
}

export type InventoryItemUpdate = Partial<InventoryItemCreate>

interface InventoryFilters {
  category?: string
  search?: string
  lowStockOnly?: boolean
}

interface InventoryStats {
  total_items: number
  low_stock_count: number
  checked_out_count: number
  total_value: number
}

export function useInventoryItems(filters?: InventoryFilters) {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory-items', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.category) params.category = filters.category
      if (filters?.search) params.search = filters.search
      if (filters?.lowStockOnly) params.low_stock = 'true'
      return api.get('/inventory/items', { params }).then((r) => r.data)
    },
  })
}

export function useInventoryItem(id: string | undefined) {
  return useQuery<InventoryItem>({
    queryKey: ['inventory-item', id],
    queryFn: () => api.get(`/inventory/items/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InventoryItemCreate) =>
      api.post('/inventory/items', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      qc.invalidateQueries({ queryKey: ['inventory-stats'] })
    },
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InventoryItemUpdate }) =>
      api.put(`/inventory/items/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      qc.invalidateQueries({ queryKey: ['inventory-stats'] })
    },
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      qc.invalidateQueries({ queryKey: ['inventory-stats'] })
    },
  })
}

export function useCheckoutItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string
      data: {
        quantity: number
        checked_out_by: string
        checked_out_to: string
        expected_return?: string
      }
    }) => api.post(`/inventory/items/${itemId}/checkout`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      qc.invalidateQueries({ queryKey: ['inventory-checkouts'] })
      qc.invalidateQueries({ queryKey: ['inventory-stats'] })
    },
  })
}

export function useReturnItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (checkoutId: string) =>
      api.post(`/inventory/checkouts/${checkoutId}/return`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      qc.invalidateQueries({ queryKey: ['inventory-checkouts'] })
      qc.invalidateQueries({ queryKey: ['inventory-stats'] })
    },
  })
}

export function useCheckouts(status?: string, itemId?: string) {
  return useQuery<CheckoutRecord[]>({
    queryKey: ['inventory-checkouts', status, itemId],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (status) params.status = status
      if (itemId) params.item_id = itemId
      return api.get('/inventory/checkouts', { params }).then((r) => r.data)
    },
  })
}

export function useLowStockItems() {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory-low-stock'],
    queryFn: () => api.get('/inventory/low-stock').then((r) => r.data),
  })
}

export function useInventoryStats() {
  return useQuery<InventoryStats>({
    queryKey: ['inventory-stats'],
    queryFn: () => api.get('/inventory/stats').then((r) => r.data),
  })
}
