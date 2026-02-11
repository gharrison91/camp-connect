/**
 * Camp Connect - Quotes React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---- Types ----

export interface QuoteLineItem {
  description: string
  amount: number
  quantity: number
}

export interface Quote {
  id: string
  organization_id: string
  contact_id: string | null
  family_id: string | null
  contact_name: string | null
  family_name: string | null
  quote_number: string | null
  line_items: QuoteLineItem[] | null
  subtotal: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  valid_until: string | null
  notes: string | null
  accepted_at: string | null
  accepted_signature: string | null
  converted_invoice_id: string | null
  created_at: string
  updated_at: string
}

export interface QuoteCreate {
  contact_id?: string
  family_id?: string
  quote_number?: string
  line_items?: QuoteLineItem[]
  subtotal: number
  tax?: number
  total: number
  valid_until?: string
  notes?: string
}

export interface QuoteUpdate {
  contact_id?: string
  family_id?: string
  quote_number?: string
  line_items?: QuoteLineItem[]
  subtotal?: number
  tax?: number
  total?: number
  status?: string
  valid_until?: string
  notes?: string
}

// ---- Queries ----

export function useQuotes(filters?: { status?: string; contact_id?: string }) {
  return useQuery<Quote[]>({
    queryKey: ['quotes', filters],
    queryFn: () =>
      api.get('/quotes', { params: filters }).then((r) => r.data),
  })
}

export function useQuote(quoteId: string | undefined) {
  return useQuery<Quote>({
    queryKey: ['quotes', quoteId],
    queryFn: () => api.get(`/quotes/${quoteId}`).then((r) => r.data),
    enabled: !!quoteId,
  })
}

// ---- Mutations ----

export function useCreateQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: QuoteCreate) =>
      api.post('/quotes', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useUpdateQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: QuoteUpdate }) =>
      api.put(`/quotes/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useDeleteQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (quoteId: string) =>
      api.delete(`/quotes/${quoteId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useSendQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (quoteId: string) =>
      api.post(`/quotes/${quoteId}/send`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useConvertQuoteToInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (quoteId: string) =>
      api.post(`/quotes/${quoteId}/convert-to-invoice`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
