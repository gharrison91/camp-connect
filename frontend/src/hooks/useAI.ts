/**
 * Camp Connect - AI Insights React Query Hooks
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  response: string
  sql: string | null
  data: Record<string, unknown>[] | null
  row_count?: number | null
  error: string | null
}

export interface SuggestedPrompt {
  title: string
  prompt: string
  icon: string
}

export function useAIChat() {
  return useMutation<ChatResponse, Error, { messages: ChatMessage[] }>({
    mutationFn: (body) =>
      api.post('/ai/chat', body).then((r) => r.data),
  })
}

export function useSuggestedPrompts() {
  return useQuery<SuggestedPrompt[]>({
    queryKey: ['ai-suggested-prompts'],
    queryFn: () => api.get('/ai/suggested-prompts').then((r) => r.data),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}
