/**
 * Camp Connect - Communications React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Message, MessageTemplate } from '../types'

export interface MessageFilters {
  channel?: 'sms' | 'email'
  status?: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced'
  search?: string
}

export interface TemplateFilters {
  channel?: 'sms' | 'email' | 'both'
  category?: string
}

export interface MessageSend {
  channel: 'sms' | 'email'
  to_address: string
  subject?: string | null
  body: string
  html_body?: string | null
  template_id?: string | null
  recipient_type?: string | null
  recipient_id?: string | null
}

export interface BulkMessageSend {
  channel: 'sms' | 'email'
  subject?: string | null
  body: string
  html_body?: string | null
  template_id?: string | null
  recipient_ids: string[]
}

export interface TemplateCreate {
  name: string
  channel: 'sms' | 'email' | 'both'
  subject?: string | null
  body: string
  html_body?: string | null
  category: string
  variables?: string[]
}

export interface TemplateUpdate extends Partial<TemplateCreate> {
  is_active?: boolean
}

// ─── Message hooks ───────────────────────────────────────────

export function useMessages(filters?: MessageFilters) {
  return useQuery<Message[]>({
    queryKey: ['messages', filters],
    queryFn: () =>
      api.get('/communications/messages', { params: filters }).then((r) => r.data),
  })
}

export function useMessage(id: string | undefined) {
  return useQuery<Message>({
    queryKey: ['messages', id],
    queryFn: () => api.get(`/communications/messages/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MessageSend) =>
      api.post('/communications/send', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

export function useSendBulkMessages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkMessageSend) =>
      api.post('/communications/send-bulk', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

// ─── Template hooks ──────────────────────────────────────────

export function useMessageTemplates(filters?: TemplateFilters) {
  return useQuery<MessageTemplate[]>({
    queryKey: ['message-templates', filters],
    queryFn: () =>
      api.get('/communications/templates', { params: filters }).then((r) => r.data),
  })
}

export function useCreateMessageTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TemplateCreate) =>
      api.post('/communications/templates', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
    },
  })
}

export function useUpdateMessageTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TemplateUpdate }) =>
      api.put(`/communications/templates/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
    },
  })
}

export function useDeleteMessageTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/communications/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
    },
  })
}
