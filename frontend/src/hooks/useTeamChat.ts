/**
 * Camp Connect - Team Chat React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ChatChannel, ChatMessage, ChatUnreadCount } from '../types'

// --- Channels ---

export function useChannels() {
  return useQuery<ChatChannel[]>({
    queryKey: ['team-chat-channels'],
    queryFn: () => api.get('/team-chat/channels').then((r) => r.data),
  })
}

export function useChannel(channelId: string | undefined) {
  return useQuery<ChatChannel>({
    queryKey: ['team-chat-channels', channelId],
    queryFn: () => api.get(`/team-chat/channels/${channelId}`).then((r) => r.data),
    enabled: !!channelId,
  })
}

export function useCreateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description: string; channel_type: string; members: string[] }) =>
      api.post('/team-chat/channels', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-chat-channels'] }) },
  })
}

export function useUpdateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ChatChannel> & { id: string }) =>
      api.put(`/team-chat/channels/${id}`, data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-chat-channels'] }) },
  })
}

export function useDeleteChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/team-chat/channels/${id}`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-chat-channels'] }) },
  })
}

// --- Messages ---

export function useMessages(channelId: string | undefined) {
  return useQuery<ChatMessage[]>({
    queryKey: ['team-chat-messages', channelId],
    queryFn: () => api.get(`/team-chat/channels/${channelId}/messages`).then((r) => r.data),
    enabled: !!channelId,
    refetchInterval: 5000,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ channelId, ...data }: { channelId: string; content: string; message_type?: string }) =>
      api.post(`/team-chat/channels/${channelId}/messages`, data).then((r) => r.data),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: ['team-chat-messages', vars.channelId] }); qc.invalidateQueries({ queryKey: ['team-chat-channels'] }) },
  })
}

export function usePinMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ channelId, messageId, pinned }: { channelId: string; messageId: string; pinned: boolean }) =>
      api.post(`/team-chat/channels/${channelId}/messages/${messageId}/pin?pinned=${pinned}`).then((r) => r.data),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: ['team-chat-messages', vars.channelId] }); qc.invalidateQueries({ queryKey: ['team-chat-pinned', vars.channelId] }) },
  })
}

export function useReactToMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ channelId, messageId, emoji }: { channelId: string; messageId: string; emoji: string }) =>
      api.post(`/team-chat/channels/${channelId}/messages/${messageId}/react?emoji=${encodeURIComponent(emoji)}`).then((r) => r.data),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: ['team-chat-messages', vars.channelId] }) },
  })
}

export function usePinnedMessages(channelId: string | undefined) {
  return useQuery<ChatMessage[]>({
    queryKey: ['team-chat-pinned', channelId],
    queryFn: () => api.get(`/team-chat/channels/${channelId}/pinned`).then((r) => r.data),
    enabled: !!channelId,
  })
}

// --- Unread ---

export function useUnreadCounts() {
  return useQuery<ChatUnreadCount[]>({
    queryKey: ['team-chat-unread'],
    queryFn: () => api.get('/team-chat/unread').then((r) => r.data),
    refetchInterval: 10000,
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      api.post(`/team-chat/channels/${channelId}/mark-read`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-chat-unread'] }) },
  })
}

// --- Search ---

export function useSearchMessages(query: string) {
  return useQuery<ChatMessage[]>({
    queryKey: ['team-chat-search', query],
    queryFn: () => api.get('/team-chat/search', { params: { q: query } }).then((r) => r.data),
    enabled: query.length >= 2,
  })
}
