import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { JobListing, JobListingCreate, JobApplication } from '@/types'

export function useJobListings(statusFilter?: string) {
  return useQuery({
    queryKey: ['job-listings', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/jobs', { params })
      return res.data as JobListing[]
    },
  })
}

export function useJobListing(id: string) {
  return useQuery({
    queryKey: ['job-listing', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`)
      return res.data as JobListing
    },
    enabled: !!id,
  })
}

export function useCreateJobListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: JobListingCreate) => {
      const res = await api.post('/jobs', data)
      return res.data as JobListing
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-listings'] })
    },
  })
}

export function useUpdateJobListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<JobListingCreate> }) => {
      const res = await api.put(`/jobs/${id}`, data)
      return res.data as JobListing
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-listings'] })
    },
  })
}

export function useDeleteJobListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-listings'] })
    },
  })
}

export function usePublishJobListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/jobs/${id}/publish`)
      return res.data as JobListing
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-listings'] })
    },
  })
}

export function useCloseJobListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/jobs/${id}/close`)
      return res.data as JobListing
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-listings'] })
    },
  })
}

// ─── Applications ────────────────────────────────────────────

export function useJobApplications(listingId?: string) {
  return useQuery({
    queryKey: ['job-applications', listingId],
    queryFn: async () => {
      if (listingId) {
        const res = await api.get(`/jobs/${listingId}/applications`)
        return res.data as JobApplication[]
      }
      const res = await api.get('/jobs/applications/all')
      return res.data as JobApplication[]
    },
  })
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await api.put(`/jobs/applications/${id}/status`, { status, notes })
      return res.data as JobApplication
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-applications'] })
      qc.invalidateQueries({ queryKey: ['job-listings'] })
    },
  })
}
