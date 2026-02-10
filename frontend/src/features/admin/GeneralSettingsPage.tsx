/**
 * General Settings page — tax rate, deposit config, form categories, enabled modules.
 * Modules not purchased are grayed out with a lock icon.
 */

import { useState, useEffect } from 'react'
import { Loader2, Save, Lock, Plus, X, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

// Default all modules to purchased since there is no SaaS admin portal yet.
const DEFAULT_PURCHASED: string[] = [
  'core', 'health', 'financial', 'comms', 'photos', 'staff', 'ai', 'analytics', 'store',
]

interface ModuleDef {
  key: string
  label: string
  description: string
  locked?: boolean
}

const ALL_MODULES: ModuleDef[] = [
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

const DEFAULT_FORM_CATEGORIES = [
  { key: 'registration', label: 'Registration' },
  { key: 'health', label: 'Health & Safety' },
  { key: 'consent', label: 'Consent' },
  { key: 'hr', label: 'HR' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'application', label: 'Application' },
  { key: 'other', label: 'Other' },
]

export function GeneralSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    tax_rate: 0,
    deposit_type: 'fixed' as 'fixed' | 'percentage',
    deposit_amount: 0,
    deposit_required: false,
  })
  const [enabledModules, setEnabledModules] = useState<string[]>(['core'])
  const [purchasedModules, setPurchasedModules] = useState<string[]>(DEFAULT_PURCHASED)

  // Form categories state
  const [formCategories, setFormCategories] = useState<{ key: string; label: string }[]>(DEFAULT_FORM_CATEGORIES)
  const [newCategoryKey, setNewCategoryKey] = useState('')
  const [newCategoryLabel, setNewCategoryLabel] = useState('')

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
      if (data.settings?.purchased_modules) {
        setPurchasedModules(data.settings.purchased_modules)
      }
      if (data.settings?.form_categories?.length) {
        setFormCategories(data.settings.form_categories)
      }
    } catch {
      toast({ type: 'error', message: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.put('/settings', {
        ...settings,
        enabled_modules: enabledModules,
        form_categories: formCategories,
      })
      toast({ type: 'success', message: 'Settings saved!' })
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', message: apiErr.response?.data?.detail || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const toggleModule = (key: string) => {
    if (key === 'core') return
    if (!purchasedModules.includes(key)) return
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  const addCategory = () => {
    const key = newCategoryKey.trim().toLowerCase().replace(/\s+/g, '_')
    const label = newCategoryLabel.trim()
    if (!key || !label) return
    if (formCategories.some((c) => c.key === key)) {
      toast({ type: 'error', message: 'Category key already exists' })
      return
    }
    setFormCategories((prev) => [...prev, { key, label }])
    setNewCategoryKey('')
    setNewCategoryLabel('')
  }

  const removeCategory = (key: string) => {
    setFormCategories((prev) => prev.filter((c) => c.key !== key))
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

        {/* Form Categories */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Form Categories</h3>
          <p className="mt-1 text-xs text-slate-500">
            Customize the categories available when creating forms. These appear as tabs on the Forms page.
          </p>
          <div className="mt-3 space-y-2">
            {formCategories.map((cat) => (
              <div
                key={cat.key}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900">{cat.label}</span>
                  <span className="ml-2 text-xs text-slate-400">({cat.key})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCategory(cat.key)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Add new category */}
            <div className="flex items-end gap-2 pt-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600">Label</label>
                <input
                  type="text"
                  value={newCategoryLabel}
                  onChange={(e) => {
                    setNewCategoryLabel(e.target.value)
                    // Auto-generate key from label
                    const autoKey = e.target.value.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                    if (!newCategoryKey || newCategoryKey === newCategoryLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')) {
                      setNewCategoryKey(autoKey)
                    }
                  }}
                  placeholder="e.g. Safety Drills"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-slate-600">Key</label>
                <input
                  type="text"
                  value={newCategoryKey}
                  onChange={(e) => setNewCategoryKey(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                  placeholder="safety_drills"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={addCategory}
                disabled={!newCategoryKey.trim() || !newCategoryLabel.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Module Enablement */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Enabled Modules</h3>
          <p className="mt-1 text-xs text-slate-500">Choose which platform modules your organization uses.</p>
          <div className="mt-3 space-y-2">
            {ALL_MODULES.map((mod) => {
              const isPurchased = purchasedModules.includes(mod.key)
              const isEnabled = enabledModules.includes(mod.key)
              const isLocked = mod.locked === true

              return (
                <label
                  key={mod.key}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
                    !isPurchased
                      ? 'cursor-default border-slate-100 bg-slate-50 opacity-60'
                      : isEnabled
                        ? 'cursor-pointer border-emerald-200 bg-emerald-50/50'
                        : 'cursor-pointer border-slate-200 bg-white hover:bg-slate-50',
                    isLocked && 'cursor-default'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleModule(mod.key)}
                    disabled={isLocked || !isPurchased}
                    className={cn(
                      'mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600',
                      !isPurchased && 'opacity-40'
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-medium',
                        isPurchased ? 'text-slate-900' : 'text-slate-400'
                      )}>
                        {mod.label}
                      </span>
                      {isLocked && (
                        <span className="text-[10px] font-semibold uppercase text-slate-400">
                          Always on
                        </span>
                      )}
                      {!isPurchased && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                          <Lock className="h-3 w-3" />
                          Upgrade to unlock
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      'text-xs',
                      isPurchased ? 'text-slate-500' : 'text-slate-400'
                    )}>
                      {mod.description}
                    </p>
                    {!isPurchased && (
                      <a
                        href="mailto:sales@campconnect.com"
                        className="mt-1 inline-block text-xs font-medium text-emerald-600 hover:text-emerald-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Contact sales
                      </a>
                    )}
                  </div>
                </label>
              )
            })}
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
