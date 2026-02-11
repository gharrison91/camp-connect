/**
 * Camp Connect - Payments & Invoices React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Invoice, InvoiceCreate, InvoiceUpdate, Payment } from '../types'

// --- Invoice Queries ---

export function useInvoices(filters?: { status?: string; family_id?: string; contact_id?: string }) {
  return useQuery<Invoice[]>({
    queryKey: ['invoices', filters],
    queryFn: () =>
      api.get('/payments/invoices', { params: filters }).then((r) => r.data),
  })
}

export function useInvoice(invoiceId: string | undefined) {
  return useQuery<Invoice>({
    queryKey: ['invoices', invoiceId],
    queryFn: () => api.get(`/payments/invoices/${invoiceId}`).then((r) => r.data),
    enabled: !!invoiceId,
  })
}

// --- Invoice Mutations ---

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InvoiceCreate) =>
      api.post('/payments/invoices', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceUpdate }) =>
      api.put(`/payments/invoices/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId: string) =>
      api.post(`/payments/invoices/${invoiceId}/mark-paid`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { registration_ids: string[]; contact_id?: string; family_id?: string }) =>
      api.post('/payments/invoices/generate', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

// --- Payment Queries ---

export function usePayments(filters?: { invoice_id?: string; contact_id?: string }) {
  return useQuery<Payment[]>({
    queryKey: ['payments', filters],
    queryFn: () =>
      api.get('/payments/transactions', { params: filters }).then((r) => r.data),
  })
}

// --- Payment Mutations ---

export function useRecordPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      invoice_id?: string;
      registration_id?: string;
      contact_id?: string;
      amount: number;
      payment_method?: string;
    }) => api.post('/payments/transactions', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useRefundPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, amount }: { paymentId: string; amount?: number }) =>
      api
        .post(`/payments/transactions/${paymentId}/refund`, null, {
          params: amount ? { amount } : undefined,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useACHSetup() {
  return useMutation({
    mutationFn: (data: { invoice_id: string; return_url: string }) =>
      api.post('/payments/ach-setup', data).then((r) => r.data),
  })
}

// --- Portal Checkout (Stripe) ---

export interface PortalCheckoutRequest {
  invoiceId: string
  success_url: string
  cancel_url: string
  payment_method: 'card' | 'ach'
}

export interface PortalCheckoutResponse {
  session_id: string
  checkout_url: string
}

export function useCreatePortalCheckout() {
  return useMutation<PortalCheckoutResponse, Error, PortalCheckoutRequest>({
    mutationFn: ({ invoiceId, success_url, cancel_url, payment_method }) =>
      api
        .post(`/portal/invoices/${invoiceId}/checkout`, {
          success_url,
          cancel_url,
          payment_method,
        })
        .then((r) => r.data),
  })
}
