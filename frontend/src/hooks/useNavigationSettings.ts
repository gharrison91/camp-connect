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
    mutationFn: (hiddenItems: string[]) =>
      api.put('/settings', { hidden_nav_items: hiddenItems }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-settings'] })
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
    },
  })
}
