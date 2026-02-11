/**
 * Camp Connect - FinancingTab
 * Affirm-style BNPL financing management for camp registrations.
 */

import { useState } from 'react'
import {
  DollarSign, Settings, Calculator, ClipboardList, Loader2,
  Copy, Check, Star, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useFinancingSettings, useUpdateFinancingSettings, useFinancingEstimate,
} from '@/hooks/usePayments'
import { useToast } from '@/components/ui/Toast'

const PROVIDERS = [
  { value: 'affirm', label: 'Affirm', color: 'bg-blue-600' },
  { value: 'klarna', label: 'Klarna', color: 'bg-pink-500' },
  { value: 'afterpay', label: 'Afterpay', color: 'bg-teal-500' },
] as const

const TERM_OPTIONS = [3, 6, 12, 18, 24] as const

type ApplicationStatus = 'pending' | 'approved' | 'denied' | 'active' | 'completed'

interface FinancingApplication {
  id: string
  parent_name: string
  amount: number
  term_months: number
  status: ApplicationStatus
  monthly_payment: number
  date: string
}

const MOCK_APPLICATIONS: FinancingApplication[] = []

function getAppStatusBadge(status: ApplicationStatus) {
  const styles: Record<ApplicationStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    denied: 'bg-red-50 text-red-700 ring-red-600/20',
    active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    completed: 'bg-gray-50 text-gray-500 ring-gray-400/20',
  }
  return styles[status]
}

export function FinancingTab() {
  const { data: settings, isLoading: settingsLoading } = useFinancingSettings()
  const updateSettings = useUpdateFinancingSettings()
  const estimateMutation = useFinancingEstimate()
  const { toast } = useToast()

  const [provider, setProvider] = useState('affirm')
  const [isEnabled, setIsEnabled] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [minAmount, setMinAmount] = useState(100)
  const [maxAmount, setMaxAmount] = useState(10000)
  const [selectedTerms, setSelectedTerms] = useState<number[]>([3, 6, 12])
  const [settingsInit, setSettingsInit] = useState(false)
  const [calcAmount, setCalcAmount] = useState(2500)
  const [copied, setCopied] = useState(false)

  if (settings && !settingsInit) {
    setProvider(settings.provider || 'affirm')
    setIsEnabled(settings.is_enabled || false)
    setApiKey(settings.public_api_key || '')
    setMinAmount(settings.min_amount || 100)
    setMaxAmount(settings.max_amount || 10000)
    setSelectedTerms(settings.terms || [3, 6, 12])
    setSettingsInit(true)
  }

  function toggleTerm(term: number) {
    setSelectedTerms((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term].sort((a, b) => a - b)
    )
  }

  async function handleSaveSettings() {
    try {
      await updateSettings.mutateAsync({
        provider, is_enabled: isEnabled, public_api_key: apiKey,
        min_amount: minAmount, max_amount: maxAmount, terms: selectedTerms,
      })
      toast({ type: 'success', message: 'Financing settings saved' })
    } catch {
      toast({ type: 'error', message: 'Failed to save settings' })
    }
  }

  function handleCalculate() {
    estimateMutation.mutate({
      amount: calcAmount,
      terms: selectedTerms.length > 0 ? selectedTerms : [3, 6, 12],
    })
  }

  async function handleShareEstimate() {
    if (!estimateMutation.data) return
    const lines = estimateMutation.data.estimates.map(
      (e) =>
        `${e.term_months} months: $${e.monthly_payment}/mo (Total: $${e.total_cost}, APR: ${e.apr})`
    )
    const text = `Payment Financing Options for $${estimateMutation.data.amount}:\n${lines.join('\n')}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ type: 'success', message: 'Estimate copied to clipboard' })
  }

  if (settingsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Settings Section */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <Settings className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">Financing Provider Settings</h2>
        </div>
        <div className="space-y-6 p-6">
          {/* Provider Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700">Provider</label>
            <div className="mt-2 flex gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all',
                    provider === p.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  <span className={cn('h-3 w-3 rounded-full', p.color)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable Financing</p>
              <p className="text-xs text-gray-500">Allow parents to pay via installment financing</p>
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className="text-emerald-600 transition-colors hover:text-emerald-700"
            >
              {isEnabled ? (
                <ToggleRight className="h-8 w-8" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-gray-400" />
              )}
            </button>
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm font-medium text-gray-700">Public API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="pk_live_..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-gray-400">Your provider's public/publishable API key</p>
          </div>

          {/* Min / Max Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Minimum Amount ($)</label>
              <input type="number" value={minAmount} onChange={(e) => setMinAmount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Maximum Amount ($)</label>
              <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Term Checkboxes */}
          <div>
            <label className="text-sm font-medium text-gray-700">Available Terms</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {TERM_OPTIONS.map((term) => (
                <label
                  key={term}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                    selectedTerms.includes(term)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  )}
                >
                  <input type="checkbox" checked={selectedTerms.includes(term)} onChange={() => toggleTerm(term)} className="sr-only" />
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border text-[10px]',
                      selectedTerms.includes(term)
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-gray-300'
                    )}
                  >
                    {selectedTerms.includes(term) && '\u2713'}
                  </span>
                  {term} months
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={updateSettings.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {updateSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Calculator Section */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <Calculator className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">Payment Estimator</h2>
        </div>
        <div className="p-6">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="number" value={calcAmount} onChange={(e) => setCalcAmount(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Enter amount" />
              </div>
            </div>
            <button onClick={handleCalculate} disabled={estimateMutation.isPending || calcAmount <= 0} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
              {estimateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Calculate
            </button>
          </div>

          {estimateMutation.data && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {estimateMutation.data.estimates.map((est, idx) => {
                  const isPopular = idx === Math.floor(estimateMutation.data!.estimates.length / 2)
                  return (
                    <div key={est.term_months} className={cn(
                      'relative rounded-xl border p-4 transition-all',
                      isPopular ? 'border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200' : 'border-gray-100 bg-white hover:border-gray-200'
                    )}>
                      {isPopular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                            <Star className="h-2.5 w-2.5" />
                            Most Popular
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{est.term_months} Months</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">${est.monthly_payment}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs"><span className="text-gray-500">Total Cost</span><span className="font-medium text-gray-900">${est.total_cost}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-gray-500">APR</span><span className="font-medium text-gray-900">{est.apr}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-gray-500">Finance Charge</span><span className="font-medium text-gray-900">${est.finance_charge}</span></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-end">
                <button onClick={handleShareEstimate} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Share Estimate'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications Section */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <ClipboardList className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Financing Applications</h2>
        </div>
        <div className="p-6">
          {MOCK_APPLICATIONS.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
              <DollarSign className="h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">No financing applications yet</p>
              <p className="mt-1 text-sm text-gray-500">Applications will appear here when parents apply for financing.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Parent Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Term</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Monthly</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_APPLICATIONS.map((app) => (
                    <tr key={app.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{app.parent_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">${app.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{app.term_months} months</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${app.monthly_payment.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', getAppStatusBadge(app.status))}>{app.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{app.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
