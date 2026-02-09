/**
 * Camp Connect - Staff Directory React Query Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Types ──────────────────────────────────────────────────

export interface StaffMember {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  department?: string | null
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

export interface StaffProfile extends StaffMember {
  certifications: {
    id: string
    name: string
    issuing_authority: string
    certificate_number?: string | null
    issue_date: string
    expiry_date?: string | null
  }[]
  emergency_contacts: {
    name: string
    phone: string
    relationship: string
  }[]
}

export interface StaffDepartment {
  name: string
  count: number
}

interface StaffFilters {
  search?: string
  department?: string
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
