/**
 * Camp Connect - Dashboard Settings Hook
 * Manages customizable dashboard KPIs and quick actions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface DashboardKPI {
  id: string
  label: string
  enabled: boolean
  order: number
}

export interface QuickAction {
  id: string
  label: string
  path: string
  enabled: boolean
  order: number
}

export interface DashboardSettings {
  kpis: DashboardKPI[]
  quick_actions: QuickAction[]
}

// Default KPIs available
export const DEFAULT_KPIS: DashboardKPI[] = [
  { id: 'total_campers', label: 'Total Campers', enabled: true, order: 0 },
  { id: 'total_events', label: 'Total Events', enabled: true, order: 1 },
  { id: 'upcoming_events', label: 'Upcoming Events', enabled: true, order: 2 },
  { id: 'total_registrations', label: 'Total Registrations', enabled: true, order: 3 },
  { id: 'pending_registrations', label: 'Pending Registrations', enabled: false, order: 4 },
  { id: 'total_staff', label: 'Total Staff', enabled: false, order: 5 },
  { id: 'open_tasks', label: 'Open Tasks', enabled: false, order: 6 },
  { id: 'unread_messages', label: 'Unread Messages', enabled: false, order: 7 },
]

// Default quick actions available
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'ai_insights', label: 'AI Insights', path: '/app/ai-insights', enabled: true, order: 0 },
  { id: 'messages', label: 'Messages', path: '/app/camper-messages', enabled: true, order: 1 },
  { id: 'photos', label: 'Photos', path: '/app/photos', enabled: true, order: 2 },
  { id: 'analytics', label: 'Analytics', path: '/app/analytics', enabled: true, order: 3 },
  { id: 'registrations', label: 'Registrations', path: '/app/registrations', enabled: false, order: 4 },
  { id: 'schedule', label: 'Schedule', path: '/app/schedule', enabled: false, order: 5 },
  { id: 'payments', label: 'Payments', path: '/app/payments', enabled: false, order: 6 },
  { id: 'reports', label: 'Reports', path: '/app/reports', enabled: false, order: 7 },
]

export function useDashboardSettings() {
  return useQuery<DashboardSettings>({
    queryKey: ['dashboard-settings'],
    queryFn: async () => {
      const res = await api.get('/settings')
      const settings = res.data.settings || {}
      
      // Merge saved settings with defaults
      const savedKpis = settings.dashboard_kpis || []
      const savedActions = settings.dashboard_quick_actions || []
      
      // Merge saved KPIs with defaults
      const kpis = DEFAULT_KPIS.map((defaultKpi) => {
        const saved = savedKpis.find((k: DashboardKPI) => k.id === defaultKpi.id)
        return saved ? { ...defaultKpi, ...saved } : defaultKpi
      }).sort((a, b) => a.order - b.order)
      
      // Merge saved quick actions with defaults
      const quick_actions = DEFAULT_QUICK_ACTIONS.map((defaultAction) => {
        const saved = savedActions.find((a: QuickAction) => a.id === defaultAction.id)
        return saved ? { ...defaultAction, ...saved } : defaultAction
      }).sort((a, b) => a.order - b.order)
      
      return { kpis, quick_actions }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateDashboardSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (settings: Partial<DashboardSettings>) => {
      const payload: Record<string, unknown> = {}
      if (settings.kpis) {
        payload.dashboard_kpis = settings.kpis
      }
      if (settings.quick_actions) {
        payload.dashboard_quick_actions = settings.quick_actions
      }
      const response = await api.put('/settings', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-settings'] })
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
    },
  })
}
