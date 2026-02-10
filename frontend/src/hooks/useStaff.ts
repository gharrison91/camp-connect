/**
 * Camp Connect - Staff Directory React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Types ──────────────────────────────────────────────────

export type StaffCategory = 'full_time' | 'counselor' | 'director' | null

export interface StaffMember {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  department?: string | null
  staff_category?: StaffCategory
  job_title?: string | null
  job_title_id?: string | null
  role_name?: string | null
  status: 'active' | 'onboarding' | 'inactive'
  hire_date?: string | null
  created_at: string
}

export interface PaginatedStaff {
  items: StaffMember[]
  total: number
  skip: number
  limit: number
}

export interface FinancialInfo {
  pay_rate?: number | null
  rate_type?: 'hourly' | 'daily' | 'weekly' | 'seasonal' | null
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
}

export interface StaffProfile extends StaffMember {
  hire_date: string | null
  certifications: {
    id: string
    name: string
    issuing_authority: string
    certificate_number?: string | null
    issue_date: string
    expiry_date?: string | null
    document_url?: string | null
    status?: string | null
  }[]
  emergency_contacts: {
    name: string
    phone: string
    relationship: string
  }[]
  onboarding?: {
    id: string
    status: string
    current_step: number
    completed_at: string | null
  } | null
  seasonal_access_start?: string | null
  seasonal_access_end?: string | null
  financial_info?: FinancialInfo | null
}

export interface CertificationType {
  id: string
  name: string
  description?: string | null
  is_required: boolean
  expiry_days?: number | null
  created_at: string
}

export interface StaffCertificationRecord {
  id: string
  user_id: string
  certification_type_id: string
  certification_type_name?: string | null
  status: 'pending' | 'valid' | 'expired' | 'revoked'
  issued_date?: string | null
  expiry_date?: string | null
  document_url?: string | null
  notes?: string | null
  verified_by?: string | null
  created_at: string
}

export interface StaffCertificationCreate {
  certification_type_id: string
  status?: string
  issued_date?: string | null
  expiry_date?: string | null
  document_url?: string | null
  notes?: string | null
}

export interface StaffCertificationUpdate {
  status?: string
  issued_date?: string | null
  expiry_date?: string | null
  document_url?: string | null
  notes?: string | null
  verified_by?: string | null
}

export interface StaffDepartment {
  name: string
  count: number
}

interface StaffFilters {
  search?: string
  department?: string
  staff_category?: string
  skip?: number
  limit?: number
}

// ─── Hooks ──────────────────────────────────────────────────

export function useStaffList(filters?: StaffFilters) {
  return useQuery<PaginatedStaff>({
    queryKey: ['staff', filters],
    queryFn: () =>
      api
        .get('/staff', { params: filters })
        .then((r) => r.data),
  })
}

export function useStaffProfile(userId: string | undefined) {
  return useQuery<StaffProfile>({
    queryKey: ['staff', userId],
    queryFn: () => api.get(`/staff/${userId}`).then((r) => r.data),
    enabled: !!userId,
  })
}

export function useStaffDepartments() {
  return useQuery<StaffDepartment[]>({
    queryKey: ['staff', 'departments'],
    queryFn: () => api.get('/staff/departments').then((r) => r.data),
  })
}

export function useUpdateStaffCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      staffCategory,
    }: {
      userId: string
      staffCategory: StaffCategory
    }) =>
      api
        .put(`/staff/${userId}/category`, {
          staff_category: staffCategory,
        })
        .then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      queryClient.invalidateQueries({ queryKey: ['staff', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['counselors'] })
    },
  })
}

// ─── Certification Type Hooks ────────────────────────────────

export function useCertificationTypes() {
  return useQuery<CertificationType[]>({
    queryKey: ['certification-types'],
    queryFn: () =>
      api.get('/staff/certification-types').then((r) => r.data),
  })
}

// ─── Staff Certification Record Hooks ────────────────────────

export function useStaffCertifications(userId: string | undefined) {
  return useQuery<StaffCertificationRecord[]>({
    queryKey: ['staff', userId, 'certifications'],
    queryFn: () =>
      api.get(`/staff/${userId}/certifications`).then((r) => r.data),
    enabled: !!userId,
  })
}

export function useAddStaffCertification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string
      data: StaffCertificationCreate
    }) =>
      api
        .post(`/staff/${userId}/certifications`, data)
        .then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['staff', variables.userId, 'certifications'],
      })
      queryClient.invalidateQueries({
        queryKey: ['staff-profile', variables.userId],
      })
    },
  })
}

export function useUpdateStaffCertification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      certId,
      data,
    }: {
      certId: string
      userId: string
      data: StaffCertificationUpdate
    }) =>
      api
        .put(`/staff/certifications/${certId}`, data)
        .then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['staff', variables.userId, 'certifications'],
      })
      queryClient.invalidateQueries({
        queryKey: ['staff-profile', variables.userId],
      })
    },
  })
}

export function useDeleteStaffCertification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ certId }: { certId: string; userId: string }) =>
      api.delete(`/staff/certifications/${certId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['staff', variables.userId, 'certifications'],
      })
      queryClient.invalidateQueries({
        queryKey: ['staff-profile', variables.userId],
      })
    },
  })
}

// ─── Staff Financial Hooks ───────────────────────────────────

export function useUpdateStaffFinancial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      financialInfo,
    }: {
      userId: string
      financialInfo: FinancialInfo
    }) =>
      api
        .put(`/staff/${userId}/financial`, {
          financial_info: financialInfo,
        })
        .then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff', variables.userId] })
    },
  })
}

// ─── Job Title Types & Hooks ────────────────────────────────

export interface JobTitle {
  id: string
  name: string
  description?: string | null
  is_system: boolean
  staff_count: number
  created_at: string
}

export interface JobTitleCreate {
  name: string
  description?: string | null
}

export interface JobTitleUpdate {
  name?: string
  description?: string | null
}

export function useJobTitles() {
  return useQuery<JobTitle[]>({
    queryKey: ['job-titles'],
    queryFn: () => api.get('/staff/job-titles').then((r) => r.data),
  })
}

export function useCreateJobTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: JobTitleCreate) =>
      api.post('/staff/job-titles', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-titles'] })
    },
  })
}

export function useUpdateJobTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobTitleUpdate }) =>
      api.put(`/staff/job-titles/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-titles'] })
    },
  })
}

export function useDeleteJobTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff/job-titles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-titles'] })
    },
  })
}

export function useUpdateStaffJobTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      jobTitleId,
    }: {
      userId: string
      jobTitleId: string | null
    }) =>
      api
        .put(`/staff/${userId}/job-title`, { job_title_id: jobTitleId })
        .then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-profile', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}
