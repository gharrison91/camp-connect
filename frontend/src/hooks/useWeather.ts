/**
 * Camp Connect - Weather React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { WeatherAlert, WeatherCondition, WeatherForecast } from '../types'

export interface WeatherAlertCreate {
  alert_type: string
  severity: string
  title: string
  description?: string
  source?: string
  starts_at: string
  expires_at: string
  affected_areas?: string[]
  recommended_actions?: string[]
}

export function useWeatherConditions() {
  return useQuery<WeatherCondition>({
    queryKey: ['weather-conditions'],
    queryFn: () => api.get('/weather/conditions').then((r) => r.data),
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useWeatherForecast() {
  return useQuery<WeatherForecast[]>({
    queryKey: ['weather-forecast'],
    queryFn: () => api.get('/weather/forecast').then((r) => r.data),
    refetchInterval: 30 * 60 * 1000,
  })
}

export function useWeatherAlerts() {
  return useQuery<WeatherAlert[]>({
    queryKey: ['weather-alerts'],
    queryFn: () => api.get('/weather/alerts').then((r) => r.data),
    refetchInterval: 60 * 1000,
  })
}

export function useWeatherHistory() {
  return useQuery<WeatherAlert[]>({
    queryKey: ['weather-history'],
    queryFn: () => api.get('/weather/history').then((r) => r.data),
  })
}

export function useCreateWeatherAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: WeatherAlertCreate) =>
      api.post('/weather/alerts', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weather-alerts'] })
      qc.invalidateQueries({ queryKey: ['weather-history'] })
    },
  })
}

export function useDismissWeatherAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) =>
      api.post(`/weather/alerts/${alertId}/dismiss`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weather-alerts'] })
      qc.invalidateQueries({ queryKey: ['weather-history'] })
    },
  })
}

export function useAcknowledgeWeatherAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) =>
      api.post(`/weather/alerts/${alertId}/acknowledge`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weather-alerts'] })
      qc.invalidateQueries({ queryKey: ['weather-history'] })
    },
  })
}
