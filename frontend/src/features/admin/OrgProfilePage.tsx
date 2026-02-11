/**
 * Organization Profile settings page.
 * Edit org name, logo (URL or upload), brand colors, custom domain.
 */

import { useState, useEffect } from 'react'
import { Loader2, Save, Image as ImageIcon, X, Palette } from 'lucide-react'
import { api } from '@/lib/api'

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
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err) {
      setError('Failed to load organization')
    } finally {
      setLoading(false)
    }
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

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

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Organization Logo
          </label>
          <div className="mt-2 flex items-start gap-4">
            {/* Logo Preview */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="Logo preview"
                  className="h-full w-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData((p) => ({ ...p, logo_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-400">
                Enter a URL to your organization logo. Recommended size: 200×200px or larger.
              </p>
              {formData.logo_url && (
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, logo_url: '' }))}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" /> Remove logo
                </button>
              )}
            </div>
          </div>
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
