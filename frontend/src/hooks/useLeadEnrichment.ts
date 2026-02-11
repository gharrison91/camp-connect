/**
 * Camp Connect - Lead Enrichment React Query Hooks
 * Apollo.io-style lead generation / enrichment integration.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { LeadEnrichmentSettings, EnrichedLead } from '@/types'

// Types

interface LeadSearchResult {
  id: string
  name: string
  email: string | null
  phone: string | null
  title: string | null
  company: string | null
  linkedin_url: string | null
  location: string | null
  confidence_score: number | null
}

interface LeadSearchResponse {
  results: LeadSearchResult[]
  total: number
  query: {
    domain: string | null
    company: string | null
    title: string | null
    location: string | null
    limit: number
  }
}

interface BulkEnrichResponse {
  enriched: number
  failed: number
  results: EnrichedLead[]
}

interface EnrichmentHistoryItem {
  id: string
  contact_id: string | null
  contact_name: string | null
  action: string
  status: string
  details: string | null
  created_at: string
}

interface EnrichmentHistoryResponse {
  items: EnrichmentHistoryItem[]
  total: number
}

// Settings

export function useLeadEnrichmentSettings() {
  return useQuery<LeadEnrichmentSettings>({
    queryKey: ['lead-enrichment', 'settings'],
    queryFn: async () => {
      const { data } = await api.get('/lead-enrichment/settings')
      return data
    },
  })
}

export function useUpdateLeadEnrichmentSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      api_key?: string
      enabled?: boolean
      auto_enrich?: boolean
      provider?: string
    }) => {
      const { data } = await api.put('/lead-enrichment/settings', payload)
      return data as LeadEnrichmentSettings
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-enrichment', 'settings'] })
    },
  })
}

// Enrich

export function useEnrichContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contactId: string) => {
      const { data } = await api.post(`/lead-enrichment/enrich/${contactId}`)
      return data as EnrichedLead
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-enrichment', 'history'] })
    },
  })
}

export function useBulkEnrich() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contactIds: string[]) => {
      const { data } = await api.post('/lead-enrichment/bulk-enrich', {
        contact_ids: contactIds,
      })
      return data as BulkEnrichResponse
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-enrichment', 'history'] })
    },
  })
}

// Search

export function useLeadSearch(query: {
  domain?: string
  company?: string
  title?: string
  location?: string
  limit?: number
}) {
  return useQuery<LeadSearchResponse>({
    queryKey: ['lead-enrichment', 'search', query],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (query.domain) params.set('domain', query.domain)
      if (query.company) params.set('company', query.company)
      if (query.title) params.set('title', query.title)
      if (query.location) params.set('location', query.location)
      if (query.limit) params.set('limit', String(query.limit))
      const { data } = await api.get(`/lead-enrichment/search?${params.toString()}`)
      return data
    },
    enabled: !!(query.domain || query.company || query.title || query.location),
  })
}

// History

export function useEnrichmentHistory(limit = 50) {
  return useQuery<EnrichmentHistoryResponse>({
    queryKey: ['lead-enrichment', 'history', limit],
    queryFn: async () => {
      const { data } = await api.get(`/lead-enrichment/history?limit=${limit}`)
      return data
    },
  })
}

export type { LeadSearchResult, LeadSearchResponse, BulkEnrichResponse, EnrichmentHistoryItem, EnrichmentHistoryResponse }
