import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface CamperProfile {
  // Basic info
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  age: number | null
  gender: string | null
  school: string | null
  grade: string | null
  city: string | null
  state: string | null
  allergies: string[] | null
  dietary_restrictions: string[] | null
  custom_fields: Record<string, unknown> | null
  reference_photo_url: string | null
  created_at: string

  // Contacts
  contacts: CamperProfileContact[]

  // Family
  family: {
    id: string
    family_name: string
    campers: { id: string; first_name: string; last_name: string; age: number | null }[]
    contacts: { id: string; first_name: string; last_name: string; email: string; phone: string }[]
  } | null

  // Registrations with events
  registrations: CamperRegistration[]

  // Health forms
  health_forms: CamperHealthForm[]

  // Photos
  photos: CamperPhoto[]

  // Communications
  communications: CamperCommunication[]

  // Financial
  financial_summary: {
    total_due: number
    total_paid: number
    balance: number
  }
}

export interface CamperProfileContact {
  contact_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  relationship_type: string
  is_primary: boolean
  is_emergency: boolean
  is_authorized_pickup: boolean
}

export interface CamperRegistration {
  id: string
  status: string
  payment_status: string
  registered_at: string
  special_requests: string | null
  activity_requests: string[] | null
  event: {
    id: string
    name: string
    start_date: string
    end_date: string
    price: number | null
    status: string
  }
}

export interface CamperHealthForm {
  id: string
  template_name: string
  status: string
  due_date: string | null
  submitted_at: string | null
  event_name: string | null
}

export interface CamperPhoto {
  id: string
  url: string
  file_name: string
  caption: string | null
  similarity: number | null
  created_at: string
}

export interface CamperCommunication {
  id: string
  channel: string
  subject: string | null
  status: string
  to_address: string | null
  sent_at: string | null
}

export function useCamperProfile(camperId: string | undefined) {
  return useQuery<CamperProfile>({
    queryKey: ['camper-profile', camperId],
    queryFn: () =>
      api.get(`/campers/${camperId}/profile`).then((r) => r.data),
    enabled: !!camperId,
  })
}
