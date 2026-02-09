/**
 * Camp Connect - Notification Config React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  NotificationConfig,
  NotificationConfigCreate,
  NotificationConfigUpdate,
} from '../types'

// ─── Queries ────────────────────────────────────────────────

export function useNotificationConfigs() {
  return useQuery<NotificationConfig[]>({
    queryKey: ['notification-configs'],
    queryFn: () => api.get('/notifications/configs').then((r) => r.data),
  })
}

export function useNotificationConfig(configId: string | undefined) {
  return useQuery<NotificationConfig>({
    queryKey: ['notification-configs', configId],
    queryFn: () => api.get(`/notifications/configs/${configId}`).then((r) => r.data),
    enabled: !!configId,
  })
}

// ─── Mutations ──────────────────────────────────────────────

export function useCreateNotificationConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NotificationConfigCreate) =>
      api.post('/notifications/configs', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-configs'] })
    },
  })
}

export function useUpdateNotificationConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NotificationConfigUpdate }) =>
      api.put(`/notifications/configs/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-configs'] })
    },
  })
}

export function useDeleteNotificationConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/configs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-configs'] })
    },
  })
}

// ─── Test Trigger ───────────────────────────────────────────

export function useTestNotification() {
  return useMutation({
    mutationFn: (data: {
      trigger_type: string;
      context?: Record<string, any>;
      recipient_email?: string;
      recipient_phone?: string;
    }) => api.post('/notifications/test', data).then((r) => r.data),
  })
}
