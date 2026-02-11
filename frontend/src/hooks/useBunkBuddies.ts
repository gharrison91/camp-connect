/**
 * Camp Connect - Bunk Buddy v2 React Query Hooks
 * Portal buddy requests, admin settings, and query/mutation hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { BuddySettings, PortalBuddyRequestsResponse } from '../types'

// --- Portal Hooks -----------------------------------------------------------

export function usePortalBuddyRequests() {
  return useQuery<PortalBuddyRequestsResponse>({
    queryKey: ['portal', 'bunk-buddies'],
    queryFn: () => api.get('/portal/bunk-buddies').then((r) => r.data),
  })
}

export function useSubmitBuddyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      event_id: string
      requester_camper_id: string
      requested_camper_name: string
    }) => api.post('/portal/bunk-buddies', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'bunk-buddies'] })
    },
  })
}

export function useCancelPortalBuddyRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) =>
      api.delete(`/portal/bunk-buddies/${requestId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'bunk-buddies'] })
    },
  })
}

// --- Admin Settings Hooks ---------------------------------------------------

export function useBuddySettings() {
  return useQuery<BuddySettings>({
    queryKey: ['buddy-settings'],
    queryFn: () =>
      api.get('/bunks/buddy-requests/settings').then((r) => r.data),
  })
}

export function useUpdateBuddySettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BuddySettings>) =>
      api
        .put('/bunks/buddy-requests/settings', data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buddy-settings'] })
    },
  })
}
