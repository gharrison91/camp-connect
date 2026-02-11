/**
 * Organization Profile settings page.
 * Edit org name, logo (URL or upload), brand colors, custom domain.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Save, X, Palette, Upload } from 'lucide-react'
import { api } from '@/lib/api'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

interface OrgData {
  id: string
  name: string
  slug: string
  logo_url: string | null
  brand_colors: Record<string, string> | null
  domain: string | null
}

export function OrgProfilePage() {
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    domain: '',
    primary_color: '#10b981',
    secondary_color: '#3b82f6',
  })

  useEffect(() => {
    loadOrg()
  }, [])

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  const loadOrg = async () => {
    try {
      const res = await api.get('/organizations/me')
      const data = res.data
      setOrg(data)
      setFormData({
        name: data.name || '',
        logo_url: data.logo_url || '',
        domain: data.domain || '',
        primary_color: data.brand_colors?.primary || '#10b981',
        secondary_color: data.brand_colors?.secondary || '#3b82f6',
      })
    } catch {
      setError('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PNG, JPEG, SVG, or WebP.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 2MB.'
    }
    return null
  }

  const handleFileUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }

    setUploadError(null)
    setUploading(true)

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file)
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return previewUrl
    })

    try {
      const formPayload = new FormData()
      formPayload.append('file', file)

      const res = await api.post('/organizations/me/logo', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Update the logo_url from the server response
      const newLogoUrl = res.data.logo_url
      setFormData((p) => ({ ...p, logo_url: newLogoUrl }))

      // Clear local preview since we now have the real URL
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setUploadError(axiosErr?.response?.data?.detail || 'Failed to upload logo')
      // Revert local preview on error
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    } finally {
      setUploading(false)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handleRemoveLogo = () => {
    setFormData((p) => ({ ...p, logo_url: '' }))
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setUploadError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      await api.put('/organizations/me', {
        name: formData.name,
        logo_url: formData.logo_url || null,
        domain: formData.domain || null,
        brand_colors: {
          primary: formData.primary_color,
          secondary: formData.secondary_color,
        },
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr?.response?.data?.detail || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  // Determine which image to show: local preview takes priority, then logo_url
  const displayLogo = localPreview || formData.logo_url

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">
            Organization updated successfully!
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Organization name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            required
            className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Slug
          </label>
          <p className="text-xs text-slate-400 mt-0.5">campconnect.com/{org?.slug}</p>
        </div>

        {/* Logo Upload Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Organization Logo
          </label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drag & Drop / Click Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
              dragOver
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            )}

            {displayLogo ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <img
                    src={displayLogo}
                    alt="Logo preview"
                    className="h-full w-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Click or drag a new image to replace
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Upload className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600">
                    Drag & drop or click to upload
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    PNG, JPG, SVG, or WebP (max 2MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload error */}
          {uploadError && (
            <p className="mt-2 text-xs text-red-500">{uploadError}</p>
          )}

          {/* Remove logo button */}
          {displayLogo && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X className="h-3 w-3" /> Remove logo
            </button>
          )}

          {/* Fallback: paste URL */}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600">
              Or paste a URL
            </summary>
            <div className="mt-2 space-y-1">
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, logo_url: e.target.value }))
                  setLocalPreview((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return null
                  })
                }}
                placeholder="https://example.com/logo.png"
                className="block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-400">
                Enter a direct URL to your logo image. Recommended size: 200x200px or larger.
              </p>
            </div>
          </details>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Custom domain
          </label>
          <input
            type="text"
            value={formData.domain}
            onChange={(e) => setFormData((p) => ({ ...p, domain: e.target.value }))}
            placeholder="register.mycampname.com"
            className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-slate-500" />
            <label className="block text-sm font-semibold text-slate-700">
              Brand Colors
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Primary color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData((p) => ({ ...p, primary_color: e.target.value }))}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData((p) => ({ ...p, primary_color: e.target.value }))}
                  className="block flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Secondary color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData((p) => ({ ...p, secondary_color: e.target.value }))}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData((p) => ({ ...p, secondary_color: e.target.value }))}
                  className="block flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
          {/* Color preview */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-slate-400">Preview:</span>
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
              <div
                className="h-6 w-16 rounded"
                style={{ backgroundColor: formData.primary_color }}
              />
              <div
                className="h-6 w-16 rounded"
                style={{ backgroundColor: formData.secondary_color }}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-900 px-3 py-2">
              <div
                className="h-6 w-16 rounded"
                style={{ backgroundColor: formData.primary_color }}
              />
              <div
                className="h-6 w-16 rounded"
                style={{ backgroundColor: formData.secondary_color }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
