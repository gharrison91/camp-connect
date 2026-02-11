import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface PortalCamper {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  photo_url: string | null
  bunk_name: string | null
}

interface PortalEvent {
  id: string
  name: string
  start_date: string
  end_date: string | null
  location: string | null
}

interface PortalAnnouncement {
  id: string
  subject: string
  body: string
  created_at: string
}

export interface PortalDashboardData {
  campers: PortalCamper[]
  upcoming_events: PortalEvent[]
  recent_photos_count: number
  unread_messages_count: number
  announcements: PortalAnnouncement[]
  parent_first_name: string
  parent_last_name: string
}

export function usePortalDashboard() {
  return useQuery<PortalDashboardData>({
    queryKey: ['portal-dashboard'],
    queryFn: () => api.get('/portal/dashboard').then(r => r.data),
  })
}
