/**
 * General Settings page — tax rate, deposit config, enabled modules.
 */

import { useState, useEffect } from 'react'
import { Loader2, Save } from 'lucide-react'
import { api } from '@/lib/api'

const ALL_MODULES = [
  { key: 'core', label: 'Core Platform', description: 'Registration, events, campers, admin', locked: true },
  { key: 'health', label: 'Health & Safety', description: 'Medical forms, medications, incidents' },
  { key: 'financial', label: 'Financial', description: 'Payments, invoicing, accounting' },
  { key: 'comms', label: 'Communications+', description: 'Workflows, mass email/SMS, templates' },
  { key: 'photos', label: 'Photos & Media', description: 'Photo upload, AI tagging, albums' },
  { key: 'staff', label: 'Staff/HR', description: 'Onboarding, background checks, payroll' },
  { key: 'ai', label: 'AI Assistant', description: 'Natural language reports, drafting' },
  { key: 'analytics', label: 'Analytics', description: 'Dashboards, KPIs, scheduled reports' },
  { key: 'store', label: 'Camp Store', description: 'Gift cards, QR payments, inventory' },
]

export function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [settings, setSettings] = useState({
    tax_rate: 0,
    deposit_type: 'fixed' as 'fixed' | 'percentage',
    deposit_amount: 0,
    deposit_required: false,
  })
  const [enabledModules, setEnabledModules] = useState<string[]>(['core'])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings')
      const data = res.data
      setEnabledModules(data.enabled_modules || ['core'])
      setSettings({
        tax_rate: data.settings?.tax_rate || 0,
        deposit_type: data.settings?.deposit_type || 'fixed',
        deposit_amount: data.settings?.deposit_amount || 0,
        deposit_required: data.settings?.deposit_required || false,
      })
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await api.put('/settings', {
        ...settings,
        enabled_modules: enabledModules,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const toggleModule = (key: string) => {
    if (key === 'core') return // Core is always enabled
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
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
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">
            Settings saved!
          </div>
        )}

        {/* Tax Configuration */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Tax Configuration</h3>
          <p className="mt-1 text-xs text-slate-500">Set your default tax rate for registrations.</p>
          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">Tax rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={settings.tax_rate}
              onChange={(e) => setSettings((p) => ({ ...p, tax_rate: parseFloat(e.target.value) || 0 }))}
              className="mt-1 block w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Deposit Configuration */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Deposit Settings</h3>
          <p className="mt-1 text-xs text-slate-500">Configure deposit requirements for event registration.</p>
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.deposit_required}
                onChange={(e) => setSettings((p) => ({ ...p, deposit_required: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              <span className="text-sm text-slate-700">Require deposits</span>
            </label>

            {settings.deposit_required && (
              <div className="flex items-center gap-3">
                <select
                  value={settings.deposit_type}
                  onChange={(e) => setSettings((p) => ({ ...p, deposit_type: e.target.value as 'fixed' | 'percentage' }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="fixed">Fixed amount ($)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.deposit_amount}
                  onChange={(e) => setSettings((p) => ({ ...p, deposit_amount: parseFloat(e.target.value) || 0 }))}
                  className="block w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Module Enablement */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Enabled Modules</h3>
          <p className="mt-1 text-xs text-slate-500">Choose which platform modules your organization uses.</p>
          <div className="mt-3 space-y-2">
            {ALL_MODULES.map((mod) => (
              <label
                key={mod.key}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  enabledModules.includes(mod.key)
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-white'
                } ${mod.locked ? 'cursor-default opacity-75' : 'hover:bg-slate-50'}`}
              >
                <input
                  type="checkbox"
                  checked={enabledModules.includes(mod.key)}
                  onChange={() => toggleModule(mod.key)}
                  disabled={mod.locked}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900">
                    {mod.label}
                    {mod.locked && (
                      <span className="ml-2 text-[10px] font-semibold uppercase text-slate-400">
                        Always on
                      </span>
                    )}
                  </span>
                  <p className="text-xs text-slate-500">{mod.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
