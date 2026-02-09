/**
 * Camp Connect - Analytics React Query Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

// --- Types ---

export interface EnrollmentTrendItem {
  date: string
  count: number
}

export interface EnrollmentTrendsResponse {
  trends: EnrollmentTrendItem[]
  total: number
}

export interface RevenuePeriodItem {
  period: string
  amount: number
}

export interface RevenueMetricsResponse {
  total_revenue: number
  pending_revenue: number
  deposit_revenue: number
  revenue_by_period: RevenuePeriodItem[]
}

export interface EventCapacityItem {
  event_id: string
  event_name: string
  capacity: number
  enrolled: number
  utilization: number
}

export interface EventCapacityResponse {
  events: EventCapacityItem[]
}

export interface RegistrationStatusResponse {
  pending: number
  confirmed: number
  cancelled: number
  waitlisted: number
  total: number
}

export interface CommunicationStatsResponse {
  total_sent: number
  email_sent: number
  sms_sent: number
  delivered: number
  failed: number
  bounced: number
  delivery_rate: number
}

export interface AgeBucketItem {
  range: string
  count: number
}

export interface GenderItem {
  gender: string
  count: number
}

export interface LocationItem {
  state: string
  count: number
}

export interface CamperDemographicsResponse {
  age_distribution: AgeBucketItem[]
  gender_distribution: GenderItem[]
  location_distribution: LocationItem[]
}

// --- Helper ---

function buildParams(startDate?: string, endDate?: string): string {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

// --- Hooks ---

export function useEnrollmentTrends(startDate?: string, endDate?: string) {
  return useQuery<EnrollmentTrendsResponse>({
    queryKey: ['analytics', 'enrollment-trends', startDate, endDate],
    queryFn: () =>
      api
        .get(`/analytics/enrollment-trends${buildParams(startDate, endDate)}`)
        .then((r) => r.data),
  })
}

export function useRevenueMetrics(startDate?: string, endDate?: string) {
  return useQuery<RevenueMetricsResponse>({
    queryKey: ['analytics', 'revenue-metrics', startDate, endDate],
    queryFn: () =>
      api
        .get(`/analytics/revenue-metrics${buildParams(startDate, endDate)}`)
        .then((r) => r.data),
  })
}

export function useEventCapacity() {
  return useQuery<EventCapacityResponse>({
    queryKey: ['analytics', 'event-capacity'],
    queryFn: () =>
      api.get('/analytics/event-capacity').then((r) => r.data),
  })
}

export function useRegistrationStatus(startDate?: string, endDate?: string) {
  return useQuery<RegistrationStatusResponse>({
    queryKey: ['analytics', 'registration-status', startDate, endDate],
    queryFn: () =>
      api
        .get(`/analytics/registration-status${buildParams(startDate, endDate)}`)
        .then((r) => r.data),
  })
}

export function useCommunicationStats(startDate?: string, endDate?: string) {
  return useQuery<CommunicationStatsResponse>({
    queryKey: ['analytics', 'communication-stats', startDate, endDate],
    queryFn: () =>
      api
        .get(`/analytics/communication-stats${buildParams(startDate, endDate)}`)
        .then((r) => r.data),
  })
}

export function useCamperDemographics() {
  return useQuery<CamperDemographicsResponse>({
    queryKey: ['analytics', 'camper-demographics'],
    queryFn: () =>
      api.get('/analytics/camper-demographics').then((r) => r.data),
  })
}
