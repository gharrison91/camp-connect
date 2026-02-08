/**
 * Camp Connect - Dashboard React Query Hook
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { DashboardStats } from '../types'

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () =>
      api.get('/dashboard/stats').then((r) => r.data),
  })
}
