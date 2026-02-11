/**
 * Camp Connect - Spending Accounts React Query Hooks
 * CRUD for camper spending accounts and transactions.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  SpendingAccountData,
  SpendingTransactionData,
  SpendingSummary,
} from '../types'

// --- Account Queries ---

export function useSpendingAccounts(filters?: { search?: string; status?: string }) {
  return useQuery<SpendingAccountData[]>({
    queryKey: ['spending-accounts', filters],
    queryFn: () =>
      api.get('/spending-accounts', { params: filters }).then((r) => r.data),
  })
}

export function useSpendingAccountDetail(accountId: string | undefined) {
  return useQuery<SpendingAccountData>({
    queryKey: ['spending-accounts', accountId],
    queryFn: () =>
      api.get(`/spending-accounts/${accountId}`).then((r) => r.data),
    enabled: !!accountId,
  })
}

export function useSpendingSummary() {
  return useQuery<SpendingSummary>({
    queryKey: ['spending-accounts', 'summary'],
    queryFn: () => api.get('/spending-accounts/summary').then((r) => r.data),
  })
}

// --- Account Mutations ---

export function useCreateSpendingAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { camper_id: string; initial_balance: number; daily_limit: number | null }) =>
      api.post('/spending-accounts', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending-accounts'] })
    },
  })
}

// --- Transaction Queries ---

export function useAccountTransactions(
  accountId: string | undefined,
  params?: { page?: number; per_page?: number },
) {
  return useQuery<{ items: SpendingTransactionData[]; total: number; page: number; per_page: number }>({
    queryKey: ['spending-transactions', accountId, params],
    queryFn: () =>
      api
        .get(`/spending-accounts/${accountId}/transactions`, { params })
        .then((r) => r.data),
    enabled: !!accountId,
  })
}

// --- Transaction Mutations ---

export function useAddSpendingTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string
      data: { amount: number; type: string; description?: string }
    }) => api.post(`/spending-accounts/${accountId}/transactions`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['spending-transactions'] })
    },
  })
}
