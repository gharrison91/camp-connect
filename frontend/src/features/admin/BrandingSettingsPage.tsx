/**
 * Branding & Theme Settings Page
 * Color pickers, logo upload, sidebar style, font selector, live preview.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Loader2,
  Save,
  RotateCcw,
  Upload,
  X,
  Palette,
  Type,
  Monitor,
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useBranding, useUpdateBranding, useUploadLogo } from '@/hooks/useBranding'
import type { BrandingSettings } from '@/hooks/useBranding'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024

const FONT_OPTIONS = [
  { value: 'System', label: 'System Default', preview: 'font-sans' },
  { value: 'Inter', label: 'Inter', preview: 'font-sans' },
  { value: 'Poppins', label: 'Poppins', preview: 'font-sans' },
  { value: 'Roboto', label: 'Roboto', preview: 'font-sans' },
] as const

const SIDEBAR_NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Users, label: 'Campers' },
  { icon: Calendar, label: 'Schedule' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Settings, label: 'Settings' },
]

const DEFAULT_BRANDING: BrandingSettings = {
  primary_color: '#10b981',
  secondary_color: '#3b82f6',
  logo_url: null,
  favicon_url: null,
  login_bg_url: null,
  sidebar_style: 'dark',
  font_family: 'System',
}

export function BrandingSettingsPage() {
  const { toast } = useToast()
  const { data: serverBranding, isLoading } = useBranding()
  const updateMutation = useUpdateBranding()
  const uploadMutation = useUploadLogo()

  const [form, setForm] = useState<BrandingSettings>({ ...DEFAULT_BRANDING })
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync server data into form
  useEffect(() => {
    if (serverBranding) {
      setForm({ ...DEFAULT_BRANDING, ...serverBranding })
      setIsDirty(false)
    }
  }, [serverBranding])

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const updateField = <K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  // --- File upload ---
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PNG, JPEG, SVG, or WebP.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 2 MB.'
    }
    return null
  }

  const handleFileUpload = useCallback(
    async (file: File) => {
      const err = validateFile(file)
      if (err) {
        toast({ type: 'error', message: err })
        return
      }

      // Show local preview instantly
      const previewUrl = URL.createObjectURL(file)
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return previewUrl
      })

      uploadMutation.mutate(file, {
        onSuccess: (data) => {
          updateField('logo_url', data.logo_url)
          setLocalPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
          toast({ type: 'success', message: 'Logo uploaded successfully' })
        },
        onError: () => {
          setLocalPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
          toast({ type: 'error', message: 'Failed to upload logo' })
        },
      })
    },
    [toast, uploadMutation],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload],
  )

  const handleRemoveLogo = () => {
    updateField('logo_url', null)
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  // --- Save / Reset ---
  const handleSave = () => {
    updateMutation.mutate(form, {
      onSuccess: () => {
        toast({ type: 'success', message: 'Branding settings saved' })
        setIsDirty(false)
      },
      onError: () => {
        toast({ type: 'error', message: 'Failed to save branding settings' })
      },
    })
  }

  const handleReset = () => {
    if (serverBranding) {
      setForm({ ...DEFAULT_BRANDING, ...serverBranding })
    } else {
      setForm({ ...DEFAULT_BRANDING })
    }
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setIsDirty(false)
  }

  const displayLogo = localPreview || form.logo_url

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* --- Color pickers --- */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Palette className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Brand Colors</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Primary */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => updateField('primary_color', e.target.value)}
                className="h-11 w-11 cursor-pointer rounded-lg border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={(e) => updateField('primary_color', e.target.value)}
                maxLength={7}
                className="block flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Used for buttons, links, and active states
            </p>
          </div>

          {/* Secondary */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.secondary_color}
                onChange={(e) => updateField('secondary_color', e.target.value)}
                className="h-11 w-11 cursor-pointer rounded-lg border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={form.secondary_color}
                onChange={(e) => updateField('secondary_color', e.target.value)}
                maxLength={7}
                className="block flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Used for accents, badges, and secondary actions
            </p>
          </div>
        </div>

        {/* Color swatches preview */}
        <div className="mt-5 flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Preview:</span>
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
            <div className="h-6 w-16 rounded" style={{ backgroundColor: form.primary_color }} />
            <div className="h-6 w-16 rounded" style={{ backgroundColor: form.secondary_color }} />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-900 px-3 py-2">
            <div className="h-6 w-16 rounded" style={{ backgroundColor: form.primary_color }} />
            <div className="h-6 w-16 rounded" style={{ backgroundColor: form.secondary_color }} />
          </div>
        </div>
      </section>

      {/* --- Logo Upload --- */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Upload className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Logo</h2>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
            dragOver
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100',
          )}
        >
          {uploadMutation.isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80">
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
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <p className="text-xs text-slate-400">Click or drag a new image to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Upload className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Drag & drop or click to upload</p>
              <p className="text-xs text-slate-400">PNG, JPG, SVG, or WebP (max 2 MB)</p>
            </div>
          )}
        </div>

        {displayLogo && (
          <button
            type="button"
            onClick={handleRemoveLogo}
            className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
          >
            <X className="h-3 w-3" /> Remove logo
          </button>
        )}
      </section>

      {/* --- Sidebar Style --- */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Sidebar Style</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Dark option */}
          <button
            type="button"
            onClick={() => updateField('sidebar_style', 'dark')}
            className={cn(
              'group relative rounded-xl border-2 p-1 transition-all',
              form.sidebar_style === 'dark'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <div className="flex overflow-hidden rounded-lg">
              {/* Mini sidebar */}
              <div className="flex w-16 shrink-0 flex-col gap-2.5 bg-slate-900 p-3 py-4">
                <div
                  className="mx-auto h-5 w-5 rounded"
                  style={{ backgroundColor: form.primary_color }}
                />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="mx-auto h-1.5 w-8 rounded-full bg-slate-700" />
                ))}
              </div>
              {/* Content area */}
              <div className="flex-1 space-y-2 bg-slate-50 p-3">
                <div className="h-2 w-20 rounded bg-slate-200" />
                <div className="h-2 w-16 rounded bg-slate-200" />
                <div className="h-8 w-full rounded bg-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 pb-1">
              <Moon className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-700">Dark Sidebar</span>
            </div>
          </button>

          {/* Light option */}
          <button
            type="button"
            onClick={() => updateField('sidebar_style', 'light')}
            className={cn(
              'group relative rounded-xl border-2 p-1 transition-all',
              form.sidebar_style === 'light'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <div className="flex overflow-hidden rounded-lg">
              {/* Mini sidebar */}
              <div className="flex w-16 shrink-0 flex-col gap-2.5 border-r border-slate-200 bg-white p-3 py-4">
                <div
                  className="mx-auto h-5 w-5 rounded"
                  style={{ backgroundColor: form.primary_color }}
                />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="mx-auto h-1.5 w-8 rounded-full bg-slate-200" />
                ))}
              </div>
              {/* Content area */}
              <div className="flex-1 space-y-2 bg-slate-50 p-3">
                <div className="h-2 w-20 rounded bg-slate-200" />
                <div className="h-2 w-16 rounded bg-slate-200" />
                <div className="h-8 w-full rounded bg-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 pb-1">
              <Sun className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-700">Light Sidebar</span>
            </div>
          </button>
        </div>
      </section>

      {/* --- Font Family --- */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Type className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Font Family</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              type="button"
              onClick={() => updateField('font_family', font.value)}
              className={cn(
                'rounded-xl border-2 px-4 py-4 text-center transition-all',
                form.font_family === font.value
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <span
                className={cn('block text-2xl font-semibold text-slate-900', font.preview)}
              >
                Aa
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-500">
                {font.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* --- Live Preview --- */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Live Preview</h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <div className="flex h-72">
            {/* Sidebar preview */}
            <div
              className={cn(
                'flex w-52 shrink-0 flex-col',
                form.sidebar_style === 'dark'
                  ? 'bg-slate-900 text-white'
                  : 'border-r border-slate-200 bg-white text-slate-700',
              )}
            >
              {/* Logo area */}
              <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3.5">
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt="Logo"
                    className="h-7 w-7 rounded object-contain"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-white"
                    style={{ backgroundColor: form.primary_color }}
                  >
                    CC
                  </div>
                )}
                <span className="text-sm font-semibold">Camp Connect</span>
              </div>

              {/* Nav items */}
              <nav className="flex-1 space-y-0.5 p-2">
                {SIDEBAR_NAV_ITEMS.map((item, idx) => {
                  const Icon = item.icon
                  const isActive = idx === 0
                  return (
                    <div
                      key={item.label}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? form.sidebar_style === 'dark'
                            ? 'text-white'
                            : 'text-slate-900'
                          : form.sidebar_style === 'dark'
                            ? 'text-slate-400'
                            : 'text-slate-500',
                      )}
                      style={
                        isActive
                          ? {
                              backgroundColor:
                                form.sidebar_style === 'dark'
                                  ? `${form.primary_color}22`
                                  : `${form.primary_color}15`,
                            }
                          : undefined
                      }
                    >
                      <Icon
                        className="h-4 w-4"
                        style={isActive ? { color: form.primary_color } : undefined}
                      />
                      <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>

            {/* Main content preview */}
            <div className="flex-1 bg-slate-50 p-5">
              {/* Topbar */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Dashboard</h3>
                <div
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                  style={{ backgroundColor: form.primary_color }}
                >
                  + New Event
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {['Total Campers', 'Active Events', 'Staff Online'].map((label, i) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {[128, 6, 24][i]}
                    </p>
                    <div
                      className="mt-2 h-1 rounded-full"
                      style={{
                        backgroundColor: i === 1 ? form.secondary_color : form.primary_color,
                        width: `${[75, 45, 60][i]}%`,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Sample button row */}
              <div className="mt-4 flex items-center gap-2">
                <div
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                  style={{ backgroundColor: form.primary_color }}
                >
                  Primary Action
                </div>
                <div
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                  style={{ backgroundColor: form.secondary_color }}
                >
                  Secondary
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                  Outline
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Actions --- */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={!isDirty}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
