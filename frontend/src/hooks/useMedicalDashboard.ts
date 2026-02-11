import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MedicalDashboardStats {
  total_campers: number
  health_forms_completed: number
  health_forms_pending: number
  recent_incidents: number
  active_medications: number
  compliance_rate: number
}

export interface CamperHealthEntry {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  photo_url: string | null
  allergies: string | null
  medications: string | null
  medical_notes: string | null
  form_count: number
}

export function useMedicalDashboard() {
  return useQuery<MedicalDashboardStats>({
    queryKey: ['medical-dashboard'],
    queryFn: () => api.get('/medical-dashboard').then(r => r.data),
  })
}

export function useCamperHealthList(params: {
  page: number
  per_page: number
  search: string
  status: string
}) {
  return useQuery<{ items: CamperHealthEntry[]; total: number; page: number; per_page: number }>({
    queryKey: ['medical-dashboard', 'campers', params],
    queryFn: () => api.get('/medical-dashboard/campers', { params }).then(r => r.data),
  })
}
