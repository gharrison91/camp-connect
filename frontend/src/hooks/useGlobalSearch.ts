import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface SearchResult {
  id: string
  type: 'camper' | 'staff' | 'event' | 'contact' | 'page'
  title: string
  subtitle?: string
  path: string
}

export function useGlobalSearch(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ['global-search', query],
    queryFn: () => api.get('/search', { params: { q: query } }).then(r => r.data),
    enabled: query.length >= 2,
    staleTime: 30000,
  })
}
