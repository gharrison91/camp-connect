/**
 * Camp Connect - Navigation Settings React Query Hooks
 * Manages which navigation items are hidden/visible in the sidebar.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface NavigationSettings {
  hidden_nav_items: string[]
}

export function useNavigationSettings() {
  return useQuery<NavigationSettings>({
    queryKey: ['navigation-settings'],
    queryFn: async () => {
      const res = await api.get('/settings')
      return {
        hidden_nav_items: res.data.settings?.hidden_nav_items || [],
      }
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  })
}

export function useUpdateNavigationSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (hiddenItems: string[]) => {
      console.log('[NavSettings] Saving hidden items:', hiddenItems)
      const response = await api.put('/settings', { hidden_nav_items: hiddenItems })
      console.log('[NavSettings] Save response:', response.data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('[NavSettings] Save successful:', data)
      queryClient.invalidateQueries({ queryKey: ['navigation-settings'] })
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
    },
    onError: (error: unknown) => {
      console.error('[NavSettings] Save failed:', error)
    },
  })
}
