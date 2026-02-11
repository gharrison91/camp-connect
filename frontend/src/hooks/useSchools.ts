/**
 * Camp Connect - Schools React Query Hooks
 * Autocomplete search + custom school creation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { School } from '../types'

interface SchoolCreate {
  name: string
  city?: string
  state?: string
  zip_code?: string
}

export function useSchoolSearch(query: string) {
  return useQuery<School[]>({
    queryKey: ['schools', 'search', query],
    queryFn: () =>
      api.get('/schools/search', { params: { q: query } }).then((r) => r.data),
    enabled: query.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateSchool() {
  const queryClient = useQueryClient()
  return useMutation<School, Error, SchoolCreate>({
    mutationFn: (data) => api.post('/schools', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
    },
  })
}
