/**
 * Camp Connect - Onboarding React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Types ──────────────────────────────────────────────────

export interface OnboardingCertification {
  id: string
  name: string
  issuing_authority: string
  certificate_number?: string | null
  issue_date: string
  expiry_date?: string | null
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface PolicyAcknowledgment {
  policy_name: string
  acknowledged: boolean
  acknowledged_at?: string | null
}

export interface OnboardingRecord {
  id: string
  user_id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  department?: string | null
  status: 'invited' | 'in_progress' | 'completed'
  current_step: number
  personal_info_completed: boolean
  emergency_contacts_completed: boolean
  certifications_completed: boolean
  policies_completed: boolean
  payroll_completed: boolean
  emergency_contacts: EmergencyContact[]
  certifications: OnboardingCertification[]
  policy_acknowledgments: PolicyAcknowledgment[]
  completed_at?: string | null
  created_at: string
}

export interface OnboardingListItem {
  user_id: string
  first_name: string
  last_name: string
  email: string
  department?: string | null
  status: 'invited' | 'in_progress' | 'completed'
  current_step: number
  progress: number
  created_at: string
}

export interface PersonalInfoPayload {
  first_name: string
  last_name: string
  phone: string
  department: string
}

export interface CertificationPayload {
  name: string
  issuing_authority: string
  certificate_number?: string
  issue_date: string
  expiry_date?: string
}

// ─── Hooks ──────────────────────────────────────────────────

export function useMyOnboarding() {
  return useQuery<OnboardingRecord>({
    queryKey: ['onboarding', 'me'],
    queryFn: () => api.get('/onboarding/me').then((r) => r.data),
  })
}

export function useOnboardingList(status?: string) {
  return useQuery<OnboardingListItem[]>({
    queryKey: ['onboarding', 'list', status],
    queryFn: () =>
      api
        .get('/onboarding', { params: status ? { status } : undefined })
        .then((r) => r.data),
  })
}

export function useOnboardingDetail(userId: string | undefined) {
  return useQuery<OnboardingRecord>({
    queryKey: ['onboarding', userId],
    queryFn: () => api.get(`/onboarding/${userId}`).then((r) => r.data),
    enabled: !!userId,
  })
}

export function useInitiateOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string }) =>
      api.post('/onboarding/initiate', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] })
    },
  })
}

export function useUpdatePersonalInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PersonalInfoPayload) =>
      api.put('/onboarding/me/personal-info', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] })
    },
  })
}

export function useUpdateEmergencyContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { contacts: EmergencyContact[] }) =>
      api.put('/onboarding/me/emergency-contacts', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] })
    },
  })
}

export function useAddCertification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CertificationPayload) =>
      api.post('/onboarding/me/certifications', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] })
    },
  })
}

export function useDeleteCertification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/onboarding/me/certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] })
    },
  })
}

export function useAcknowledgePolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (policyName: string) =>
      api
        .post(`/onboarding/me/policies/${policyName}/acknowledge`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] })
    },
  })
}

export function useCompletePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post('/onboarding/me/payroll/complete').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] })
    },
  })
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post('/onboarding/me/complete').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] })
    },
  })
}
