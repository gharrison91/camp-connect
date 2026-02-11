/**
 * Camp Connect - Staff Certifications React Query Hooks
 * Hooks for managing staff certification records and types.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CertificationPageRecord,
} from '@/types'

// --- Types for API payloads ---

interface CertTypeFromAPI {
  id: string
  name: string
  description?: string | null
  is_required: boolean
  expiry_days?: number | null
  created_at: string
}

interface StaffFromAPI {
  id: string
  user_id?: string
  first_name: string
  last_name: string
}

interface CertRecordFromAPI {
  id: string
  user_id: string
  certification_type_id: string
  certification_type_name?: string | null
  status: string
  issued_date?: string | null
  expiry_date?: string | null
  document_url?: string | null
  notes?: string | null
  issuing_authority?: string | null
  certificate_number?: string | null
  verified_by?: string | null
  created_at: string
}

// --- Certification Type Hooks ---

export function useCertificationTypesForPage() {
  return useQuery<CertTypeFromAPI[]>({
    queryKey: ['staff-certification-types'],
    queryFn: () =>
      api.get('/staff/certification-types').then((r) => r.data),
  })
}

export function useCreateCertificationTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      description?: string
      is_required?: boolean
      expiry_days?: number | null
    }) =>
      api.post('/staff/certification-types', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-certification-types'] })
      queryClient.invalidateQueries({ queryKey: ['certification-types'] })
    },
  })
}

export function useUpdateCertificationTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: {
        name?: string
        description?: string | null
        is_required?: boolean
        expiry_days?: number | null
      }
    }) =>
      api.put(`/staff/certification-types/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-certification-types'] })
      queryClient.invalidateQueries({ queryKey: ['certification-types'] })
    },
  })
}

export function useDeleteCertificationTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/staff/certification-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-certification-types'] })
      queryClient.invalidateQueries({ queryKey: ['certification-types'] })
    },
  })
}

// --- Helper ---

function mapCert(c: CertRecordFromAPI, employeeName?: string): CertificationPageRecord {
  let status: CertificationPageRecord['status'] = 'active'
  if (c.status === 'valid' || c.status === 'active') status = 'active'
  else if (c.status === 'expired') status = 'expired'
  else if (c.status === 'pending') status = 'pending'
  else if (c.status === 'expiring_soon') status = 'expiring_soon'
  else status = c.status as CertificationPageRecord['status']

  if (status === 'active' && c.expiry_date) {
    const now = new Date()
    const expiry = new Date(c.expiry_date)
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    if (expiry < now) status = 'expired'
    else if (expiry.getTime() - now.getTime() < thirtyDays) status = 'expiring_soon'
  }

  return {
    id: c.id,
    employee_id: c.user_id,
    employee_name: employeeName,
    certification_type_id: c.certification_type_id,
    certification_type_name: c.certification_type_name ?? undefined,
    issued_date: c.issued_date || '',
    expiry_date: c.expiry_date ?? undefined,
    issuing_authority: c.issuing_authority ?? undefined,
    certificate_number: c.certificate_number ?? undefined,
    status,
    document_url: c.document_url ?? undefined,
    notes: c.notes ?? undefined,
  }
}

// --- Staff Certification Record Hooks ---

export function useStaffCertificationsForPage(staffId?: string) {
  return useQuery<CertificationPageRecord[]>({
    queryKey: ['staff-certifications', staffId],
    queryFn: async () => {
      if (staffId) {
        const res = await api.get(`/staff/${staffId}/certifications`)
        return (res.data as CertRecordFromAPI[]).map((c) => mapCert(c))
      }
      const staffRes = await api.get('/staff', { params: { limit: 500 } })
      const staffList: StaffFromAPI[] = staffRes.data?.items || staffRes.data || []
      const allCerts: CertificationPageRecord[] = []
      for (const s of staffList) {
        try {
          const uid = s.user_id || s.id
          const certRes = await api.get(`/staff/${uid}/certifications`)
          const certs: CertRecordFromAPI[] = certRes.data || []
          for (const c of certs) {
            allCerts.push(mapCert(c, `${s.first_name} ${s.last_name}`))
          }
        } catch {
          // Skip staff members that fail
        }
      }
      return allCerts
    },
  })
}

export function useCreateCertification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string
      data: {
        certification_type_id: string
        status?: string
        issued_date?: string | null
        expiry_date?: string | null
        document_url?: string | null
        notes?: string | null
      }
    }) =>
      api.post(`/staff/${userId}/certifications`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-certifications'] })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

export function useUpdateCertification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      certId,
      data,
    }: {
      certId: string
      data: {
        status?: string
        issued_date?: string | null
        expiry_date?: string | null
        document_url?: string | null
        notes?: string | null
      }
    }) =>
      api.put(`/staff/certifications/${certId}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-certifications'] })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

export function useDeleteCertification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (certId: string) =>
      api.delete(`/staff/certifications/${certId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-certifications'] })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

export function useExpiringCertifications() {
  return useQuery<CertificationPageRecord[]>({
    queryKey: ['staff-certifications', 'expiring'],
    queryFn: async () => {
      const staffRes = await api.get('/staff', { params: { limit: 500 } })
      const staffList: StaffFromAPI[] = staffRes.data?.items || staffRes.data || []
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const expiring: CertificationPageRecord[] = []

      for (const s of staffList) {
        try {
          const uid = s.user_id || s.id
          const certRes = await api.get(`/staff/${uid}/certifications`)
          const certs: CertRecordFromAPI[] = certRes.data || []
          for (const c of certs) {
            if (c.expiry_date) {
              const expiryDate = new Date(c.expiry_date)
              if (expiryDate <= thirtyDaysFromNow) {
                expiring.push({
                  id: c.id,
                  employee_id: c.user_id,
                  employee_name: `${s.first_name} ${s.last_name}`,
                  certification_type_id: c.certification_type_id,
                  certification_type_name: c.certification_type_name ?? undefined,
                  issued_date: c.issued_date || '',
                  expiry_date: c.expiry_date,
                  issuing_authority: c.issuing_authority ?? undefined,
                  certificate_number: c.certificate_number ?? undefined,
                  status: expiryDate < now ? 'expired' : 'expiring_soon',
                  document_url: c.document_url ?? undefined,
                  notes: c.notes ?? undefined,
                })
              }
            }
          }
        } catch {
          // Skip staff members that fail
        }
      }
      return expiring
    },
  })
}
