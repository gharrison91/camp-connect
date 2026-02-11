/**
 * Camp Connect - Store React Query Hooks
 * CRUD for store items, spending accounts, purchases, transactions,
 * and e-commerce integration settings.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  StoreItem,
  StoreItemCreate,
  StoreItemUpdate,
  SpendingAccount,
  SpendingAccountUpdate,
  StoreTransaction,
} from '../types'

// --- Item Queries ---

export function useStoreItems(filters?: { category?: string; is_active?: boolean }) {
  return useQuery<StoreItem[]>({
    queryKey: ['store-items', filters],
    queryFn: () =>
      api.get('/store/items', { params: filters }).then((r) => r.data),
  })
}

export function useStoreItem(itemId: string | undefined) {
  return useQuery<StoreItem>({
    queryKey: ['store-items', itemId],
    queryFn: () => api.get(`/store/items/${itemId}`).then((r) => r.data),
    enabled: !!itemId,
  })
}

// --- Item Mutations ---

export function useCreateStoreItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StoreItemCreate) =>
      api.post('/store/items', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] })
    },
  })
}

export function useUpdateStoreItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StoreItemUpdate }) =>
      api.put(`/store/items/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] })
    },
  })
}

export function useDeleteStoreItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/store/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] })
    },
  })
}

// --- Spending Account ---

export function useSpendingAccount(camperId: string | undefined) {
  return useQuery<SpendingAccount>({
    queryKey: ['spending-account', camperId],
    queryFn: () => api.get(`/store/accounts/${camperId}`).then((r) => r.data),
    enabled: !!camperId,
  })
}

export function useUpdateSpendingAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ camperId, data }: { camperId: string; data: SpendingAccountUpdate }) =>
      api.put(`/store/accounts/${camperId}`, data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spending-account', variables.camperId] })
    },
  })
}

// --- Purchases ---

export function usePurchaseItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { camper_id: string; item_id: string; quantity: number }) =>
      api.post('/store/purchase', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] })
      queryClient.invalidateQueries({ queryKey: ['spending-account'] })
      queryClient.invalidateQueries({ queryKey: ['store-transactions'] })
    },
  })
}

// --- Transactions ---

export function useStoreTransactions(camperId?: string) {
  return useQuery<StoreTransaction[]>({
    queryKey: ['store-transactions', camperId],
    queryFn: () =>
      api
        .get('/store/transactions', { params: camperId ? { camper_id: camperId } : undefined })
        .then((r) => r.data),
  })
}

// --- E-Commerce Integration ---

export interface StoreIntegration {
  provider: 'none' | 'shopify' | 'woocommerce' | 'square'
  api_key: string
  api_secret: string
  store_url: string
  sync_enabled: boolean
  last_sync: string | null
}

export interface StoreIntegrationUpdate {
  provider: string
  api_key: string
  api_secret: string
  store_url: string
  sync_enabled: boolean
}

export interface TestConnectionResult {
  success: boolean
  message: string
  product_count: number | null
}

export interface SyncResult {
  synced: number
  errors: number
  message: string
}

export function useStoreIntegration() {
  return useQuery<StoreIntegration>({
    queryKey: ['store-integration'],
    queryFn: () => api.get('/store/integration').then((r) => r.data),
  })
}

export function useUpdateStoreIntegration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StoreIntegrationUpdate) =>
      api.put('/store/integration', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integration'] })
    },
  })
}

export function useTestStoreConnection() {
  return useMutation<TestConnectionResult>({
    mutationFn: () =>
      api.post('/store/integration/test').then((r) => r.data),
  })
}

export function useSyncStoreProducts() {
  const queryClient = useQueryClient()
  return useMutation<SyncResult>({
    mutationFn: () =>
      api.post('/store/integration/sync').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integration'] })
      queryClient.invalidateQueries({ queryKey: ['store-items'] })
    },
  })
}
