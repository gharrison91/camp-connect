/**
 * Camp Connect - Branding React Query Hooks
 * Fetch, update, and upload branding / theme settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface BrandingSettings {
  primary_color: string
  secondary_color: string
  logo_url: string | null
  favicon_url: string | null
  login_bg_url: string | null
  sidebar_style: 'dark' | 'light'
  font_family: string
}

export function useBranding() {
  return useQuery<BrandingSettings>({
    queryKey: ['branding'],
    queryFn: () => api.get('/branding').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateBranding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BrandingSettings>) =>
      api.put('/branding', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] })
    },
  })
}

export function useUploadLogo() {
  return useMutation<{ logo_url: string; filename: string }, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/branding/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
  })
}
