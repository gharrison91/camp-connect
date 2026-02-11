/**
 * Camp Connect - Payment Plans React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---- Types ----

export interface Installment {
  id: string
  plan_id: string
  installment_number: number
  amount: number
  due_date: string
  status: 'pending' | 'paid' | 'overdue' | 'failed'
  paid_at: string | null
  payment_id: string | null
  created_at: string
  updated_at: string
}

export interface PaymentPlan {
  id: string
  organization_id: string
  invoice_id: string | null
  contact_id: string | null
  contact_name: string | null
  total_amount: number
  num_installments: number
  frequency: 'weekly' | 'biweekly' | 'monthly'
  start_date: string
  status: 'active' | 'completed' | 'cancelled' | 'defaulted'
  paid_count: number
  paid_amount: number
  installments: Installment[]
  created_at: string
  updated_at: string
}

export interface PaymentPlanCreate {
  invoice_id?: string
  contact_id?: string
  total_amount: number
  num_installments: number
  frequency?: string
  start_date: string
}

export interface PaymentPlanUpdate {
  status?: string
  frequency?: string
}

// ---- Queries ----

export function usePaymentPlans(filters?: { status?: string; contact_id?: string }) {
  return useQuery<PaymentPlan[]>({
    queryKey: ['payment-plans', filters],
    queryFn: () =>
      api.get('/payment-plans', { params: filters }).then((r) => r.data),
  })
}

export function usePaymentPlan(planId: string | undefined) {
  return useQuery<PaymentPlan>({
    queryKey: ['payment-plans', planId],
    queryFn: () => api.get(`/payment-plans/${planId}`).then((r) => r.data),
    enabled: !!planId,
  })
}

// ---- Mutations ----

export function useCreatePaymentPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PaymentPlanCreate) =>
      api.post('/payment-plans', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}

export function useUpdatePaymentPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentPlanUpdate }) =>
      api.put(`/payment-plans/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}

export function useMarkInstallmentPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, installmentId }: { planId: string; installmentId: string }) =>
      api.post(`/payment-plans/${planId}/installments/${installmentId}/mark-paid`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}
