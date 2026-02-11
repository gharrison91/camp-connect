/**
 * Camp Connect - Notification Preferences React Query Hooks
 * Hooks for fetching, updating, and resetting user notification preferences.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { NotificationPreferences } from '../types'

const QUERY_KEY = ['notification-preferences']

export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: QUERY_KEY,
    queryFn: () => api.get('/notification-preferences').then((r) => r.data),
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      preferences: { category: string; channels: { email: boolean; in_app: boolean; push: boolean } }[]
      quiet_hours_enabled?: boolean
      quiet_hours_start?: string | null
      quiet_hours_end?: string | null
      digest_frequency?: string
    }) => api.put('/notification-preferences', data).then((r) => r.data),
    onSuccess: (data: NotificationPreferences) => {
      queryClient.setQueryData(QUERY_KEY, data)
    },
  })
}

export function useResetNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/notification-preferences/reset').then((r) => r.data),
    onSuccess: (data: NotificationPreferences) => {
      queryClient.setQueryData(QUERY_KEY, data)
    },
  })
}
