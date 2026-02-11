/**
 * Camp Connect - Budget React Query Hooks
 * Hooks for budgets, categories, expenses, and stats.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BudgetCategory {
  id: string
  budget_id: string
  name: string
  planned_amount: number
  actual_amount: number
  notes: string | null
  created_at: string
}

export interface BudgetExpense {
  id: string
  category_id: string
  category_name: string
  description: string
  amount: number
  date: string
  vendor: string | null
  receipt_url: string | null
  approved_by: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface BudgetData {
  id: string
  name: string
  fiscal_year: number
  total_budget: number
  notes: string | null
  is_active: boolean
  categories: BudgetCategory[]
  created_at: string
}

export interface BudgetStats {
  total_budget: number
  total_planned: number
  total_spent: number
  remaining: number
  category_count: number
}

// ---------------------------------------------------------------------------
// Create / Update types
// ---------------------------------------------------------------------------

interface BudgetCreate {
  name: string
  fiscal_year: number
  total_budget: number
  notes?: string | null
  is_active?: boolean
}

type BudgetUpdate = Partial<BudgetCreate>

interface CategoryCreate {
  name: string
  planned_amount: number
  notes?: string | null
}

type CategoryUpdate = Partial<CategoryCreate>

interface ExpenseCreate {
  category_id: string
  description: string
  amount: number
  date: string
  vendor?: string | null
  receipt_url?: string | null
  approved_by?: string | null
  status?: string
}

type ExpenseUpdate = Partial<ExpenseCreate>

interface BudgetFilters {
  fiscal_year?: number
  is_active?: boolean
}

interface ExpenseFilters {
  category_id?: string
  status?: string
}

// ---------------------------------------------------------------------------
// Budget hooks
// ---------------------------------------------------------------------------

export function useBudgets(filters?: BudgetFilters) {
  return useQuery<BudgetData[]>({
    queryKey: ['budgets', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.fiscal_year) params.fiscal_year = String(filters.fiscal_year)
      if (filters?.is_active !== undefined) params.is_active = String(filters.is_active)
      return api.get('/budgets', { params }).then((r) => r.data)
    },
  })
}

export function useBudget(budgetId: string | undefined) {
  return useQuery<BudgetData>({
    queryKey: ['budgets', budgetId],
    queryFn: () => api.get(`/budgets/${budgetId}`).then((r) => r.data),
    enabled: !!budgetId,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BudgetCreate) =>
      api.post('/budgets', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetUpdate }) =>
      api.put(`/budgets/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Category hooks
// ---------------------------------------------------------------------------

export function useBudgetCategories(budgetId: string | undefined) {
  return useQuery<BudgetCategory[]>({
    queryKey: ['budgets', budgetId, 'categories'],
    queryFn: () =>
      api.get(`/budgets/${budgetId}/categories`).then((r) => r.data),
    enabled: !!budgetId,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      budgetId,
      data,
    }: {
      budgetId: string
      data: CategoryCreate
    }) => api.post(`/budgets/${budgetId}/categories`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      api.put(`/budgets/categories/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Expense hooks
// ---------------------------------------------------------------------------

export function useBudgetExpenses(
  budgetId: string | undefined,
  filters?: ExpenseFilters
) {
  return useQuery<BudgetExpense[]>({
    queryKey: ['budgets', budgetId, 'expenses', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.category_id) params.category_id = filters.category_id
      if (filters?.status) params.status = filters.status
      return api
        .get(`/budgets/${budgetId}/expenses`, { params })
        .then((r) => r.data)
    },
    enabled: !!budgetId,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      budgetId,
      data,
    }: {
      budgetId: string
      data: ExpenseCreate
    }) => api.post(`/budgets/${budgetId}/expenses`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseUpdate }) =>
      api.put(`/budgets/expenses/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Stats hook
// ---------------------------------------------------------------------------

export function useBudgetStats(budgetId: string | undefined) {
  return useQuery<BudgetStats>({
    queryKey: ['budgets', budgetId, 'stats'],
    queryFn: () =>
      api.get(`/budgets/${budgetId}/stats`).then((r) => r.data),
    enabled: !!budgetId,
  })
}
