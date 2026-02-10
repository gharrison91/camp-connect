import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface OrgLocation {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  phone: string | null
  is_primary: boolean
  created_at: string
}

export function useLocations() {
  return useQuery<OrgLocation[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await api.get('/locations')
      return res.data
    },
  })
}
