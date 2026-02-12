/**
 * Camp Connect - Referral Tracking React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Referral {
  id: string
  org_id: string
  referrer_name: string
  referrer_email: string | null
  referrer_family_id: string | null
  referred_name: string
  referred_email: string | null
  referred_phone: string | null
  status: 'pending' | 'contacted' | 'registered' | 'completed' | 'expired'
  source: 'word_of_mouth' | 'social_media' | 'website' | 'event' | 'other'
  incentive_type: 'discount' | 'credit' | 'gift' | 'none'
  incentive_amount: number | null
  incentive_status: 'pending' | 'awarded' | 'redeemed'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ReferralStats {
  total: number
  converted: number
  conversion_rate: number
  total_incentives: number
  by_source: Record<string, number>
  by_status: Record<string, number>
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useReferrals(filters?: {
  status?: string
  source?: string
  search?: string
}) {
  return useQuery<Referral[]>({
    queryKey: ['referrals', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.status) params.status = filters.status
      if (filters?.source) params.source = filters.source
      if (filters?.search) params.search = filters.search
      return api.get('/referrals', { params }).then((r) => r.data)
    },
  })
}

export function useReferralStats() {
  return useQuery<ReferralStats>({
    queryKey: ['referrals', 'stats'],
    queryFn: () => api.get('/referrals/stats').then((r) => r.data),
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useCreateReferral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Referral>) =>
      api.post('/referrals', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] })
    },
  })
}

export function useUpdateReferral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Referral> }) =>
      api.put(`/referrals/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] })
    },
  })
}

export function useDeleteReferral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/referrals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] })
    },
  })
}
