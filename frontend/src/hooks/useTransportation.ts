/**
 * Camp Connect - Transportation React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Vehicle, TransportRoute } from '../types'

// ─── Vehicles ─────────────────────────────────────────────────

interface VehicleFilters {
  status?: string
}

export function useVehicles(filters?: VehicleFilters) {
  return useQuery<Vehicle[]>({
    queryKey: ['vehicles', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.status) params.status = filters.status
      return api.get('/transportation/vehicles', { params }).then((r) => r.data)
    },
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Vehicle, 'id' | 'org_id' | 'created_at'>) =>
      api.post('/transportation/vehicles', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); qc.invalidateQueries({ queryKey: ['transportation-stats'] }) },
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Vehicle> & { id: string }) =>
      api.put(`/transportation/vehicles/${id}`, data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }) },
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/transportation/vehicles/${id}`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); qc.invalidateQueries({ queryKey: ['transportation-stats'] }) },
  })
}

// ─── Routes ───────────────────────────────────────────────────

interface RouteFilters {
  date?: string
  route_type?: string
  vehicle_id?: string
}

export function useRoutes(filters?: RouteFilters) {
  return useQuery<TransportRoute[]>({
    queryKey: ['transport-routes', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.date) params.date = filters.date
      if (filters?.route_type) params.route_type = filters.route_type
      if (filters?.vehicle_id) params.vehicle_id = filters.vehicle_id
      return api.get('/transportation/routes', { params }).then((r) => r.data)
    },
  })
}

export function useCreateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<TransportRoute, 'id' | 'org_id' | 'vehicle_name' | 'created_at'>) =>
      api.post('/transportation/routes', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-routes'] }); qc.invalidateQueries({ queryKey: ['transportation-stats'] }) },
  })
}

export function useUpdateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TransportRoute> & { id: string }) =>
      api.put(`/transportation/routes/${id}`, data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-routes'] }); qc.invalidateQueries({ queryKey: ['transportation-stats'] }) },
  })
}

export function useDeleteRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/transportation/routes/${id}`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-routes'] }); qc.invalidateQueries({ queryKey: ['transportation-stats'] }) },
  })
}

export function useRouteStops(routeId: string | undefined) {
  return useQuery<TransportRoute>({
    queryKey: ['transport-routes', routeId, 'stops'],
    queryFn: () => api.get(`/transportation/routes/${routeId}/stops`).then((r) => r.data),
    enabled: !!routeId,
  })
}

export function useAssignCampersToStop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ routeId, stopOrder, camperIds }: { routeId: string; stopOrder: number; camperIds: string[] }) =>
      api.post(`/transportation/routes/${routeId}/stops/${stopOrder}/assign`, camperIds).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-routes'] }) },
  })
}

// ─── Stats ────────────────────────────────────────────────────

interface TransportationStats {
  total_vehicles: number
  active_routes: number
  campers_transported_today: number
}

export function useTransportationStats() {
  return useQuery<TransportationStats>({
    queryKey: ['transportation-stats'],
    queryFn: () => api.get('/transportation/stats').then((r) => r.data),
  })
}
