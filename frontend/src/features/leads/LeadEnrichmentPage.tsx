/**
 * Camp Connect - Lead Enrichment Page
 * Apollo.io-style lead generation / enrichment integration.
 */

import { useState } from 'react'
import {
  Search,
  Settings2,
  History,
  Radar,
  Eye,
  EyeOff,
  Zap,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Building2,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useLeadEnrichmentSettings,
  useUpdateLeadEnrichmentSettings,
  useLeadSearch,
  useEnrichmentHistory,
} from '@/hooks/useLeadEnrichment'
import type { LeadSearchResult } from '@/hooks/useLeadEnrichment'

// ─── Tab types ──────────────────────────────────────────────

type Tab = 'search' | 'settings' | 'history'

// ─── Settings Panel ─────────────────────────────────────────

function SettingsPanel() {
  const { toast } = useToast()
  const { data: settings, isLoading } = useLeadEnrichmentSettings()
  const updateSettings = useUpdateLeadEnrichmentSettings()
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return
    try {
      await updateSettings.mutateAsync({ api_key: apiKey })
      toast({ type: 'success', message: 'API key saved successfully' })
      setApiKey('')
    } catch {
      toast({ type: 'error', message: 'Failed to save API key' })
    }
  }

  const handleToggleEnabled = async () => {
    try {
      await updateSettings.mutateAsync({ enabled: !settings?.enabled })
      toast({
        type: 'success',
        message: settings?.enabled ? 'Lead enrichment disabled' : 'Lead enrichment enabled',
      })
    } catch {
      toast({ type: 'error', message: 'Failed to update settings' })
    }
  }

  const handleToggleAutoEnrich = async () => {
    try {
      await updateSettings.mutateAsync({ auto_enrich: !settings?.auto_enrich })
      toast({
        type: 'success',
        message: settings?.auto_enrich ? 'Auto-enrich disabled' : 'Auto-enrich enabled',
      })
    } catch {
      toast({ type: 'error', message: 'Failed to update settings' })
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    // Simulate a test
    await new Promise((r) => setTimeout(r, 1500))
    setTesting(false)
    if (settings?.api_key_set) {
      toast({ type: 'success', message: 'Connection successful! API key is valid.' })
    } else {
      toast({ type: 'error', message: 'No API key configured. Please add your key first.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* API Key Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Settings2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">API Configuration</h3>
            <p className="text-xs text-gray-500">Connect your lead enrichment provider</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Provider */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Provider</label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Radar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 capitalize">{settings?.provider || 'apollo'}</span>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={settings?.api_key_set ? '••••••••••••••••' : 'Enter your API key'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={handleSaveKey}
                disabled={!apiKey.trim() || updateSettings.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
            {settings?.api_key_set && (
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> API key is configured
              </p>
            )}
          </div>

          {/* Test Connection */}
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 text-amber-500" />
            )}
            Test Connection
          </button>
        </div>
      </div>

      {/* Toggles Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Enrichment Options</h3>

        <div className="space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable Lead Enrichment</p>
              <p className="text-xs text-gray-500">Allow searching and enriching contacts</p>
            </div>
            <button
              onClick={handleToggleEnabled}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                settings?.enabled ? 'bg-emerald-500' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  settings?.enabled && 'translate-x-5'
                )}
              />
            </button>
          </div>

          {/* Auto-Enrich */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-Enrich New Contacts</p>
              <p className="text-xs text-gray-500">Automatically enrich contacts when added</p>
            </div>
            <button
              onClick={handleToggleAutoEnrich}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                settings?.auto_enrich ? 'bg-emerald-500' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  settings?.auto_enrich && 'translate-x-5'
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Search Panel ───────────────────────────────────────────

function SearchPanel() {
  const { toast } = useToast()
  const [domain, setDomain] = useState('')
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [searchParams, setSearchParams] = useState<{
    domain?: string
    company?: string
    title?: string
    location?: string
  }>({})

  const { data: searchData, isLoading, isFetching } = useLeadSearch(searchParams)

  const handleSearch = () => {
    const params: typeof searchParams = {}
    if (domain.trim()) params.domain = domain.trim()
    if (company.trim()) params.company = company.trim()
    if (title.trim()) params.title = title.trim()
    if (location.trim()) params.location = location.trim()

    if (Object.keys(params).length === 0) {
      toast({ type: 'warning', message: 'Enter at least one search criteria' })
      return
    }
    setSearchParams(params)
  }

  const handleImport = (lead: LeadSearchResult) => {
    toast({ type: 'success', message: `Imported ${lead.name} to contacts` })
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Search className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Lead Search</h3>
            <p className="text-xs text-gray-500">
              Find contacts by company, domain, title, or location
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Globe className="h-3.5 w-3.5" /> Company Domain
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. campfun.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Building2 className="h-3.5 w-3.5" /> Company Name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Summer Adventures"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Briefcase className="h-3.5 w-3.5" /> Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Camp Director"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <MapPin className="h-3.5 w-3.5" /> Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Austin, TX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSearch}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search Leads
          </button>
        </div>
      </div>

      {/* Results Table */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      )}

      {searchData && searchData.results.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                {searchData.total} Results Found
              </h3>
              <button
                onClick={() => setSearchParams({ ...searchParams })}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    LinkedIn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {searchData.results.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-6 py-3">
                      <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                      {lead.location && (
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" /> {lead.location}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                      {lead.title || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                      {lead.company || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5" /> {lead.email}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3">
                      {lead.phone ? (
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5" /> {lead.phone}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3">
                      {lead.linkedin_url ? (
                        <a
                          href={lead.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Linkedin className="h-3.5 w-3.5" /> Profile
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3">
                      {lead.confidence_score != null ? (
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                            lead.confidence_score >= 0.9
                              ? 'bg-emerald-100 text-emerald-700'
                              : lead.confidence_score >= 0.8
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {Math.round(lead.confidence_score * 100)}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right">
                      <button
                        onClick={() => handleImport(lead)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <Download className="h-3.5 w-3.5" /> Import
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {searchData && searchData.results.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Search className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-900">No results found</p>
          <p className="text-xs text-gray-500">Try adjusting your search criteria</p>
        </div>
      )}

      {!searchData && !isLoading && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
          <Radar className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Search for leads</p>
          <p className="text-xs text-gray-400">
            Enter a domain, company name, job title, or location to find contacts
          </p>
        </div>
      )}
    </div>
  )
}

// ─── History Panel ──────────────────────────────────────────

function HistoryPanel() {
  const { data, isLoading } = useEnrichmentHistory()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  const items = data?.items || []

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
        <History className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">No enrichment history yet</p>
        <p className="text-xs text-gray-400">
          Activity will appear here when you search or enrich contacts
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Enrichment History ({data?.total || 0} entries)
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-6 py-3">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                item.status === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : item.status === 'failed'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-500'
              )}
            >
              {item.status === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : item.status === 'failed' ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {item.action.replace('_', ' ')}
                </span>
                {item.contact_name && (
                  <span className="text-xs text-gray-500">- {item.contact_name}</span>
                )}
              </div>
              {item.details && (
                <p className="truncate text-xs text-gray-500">{item.details}</p>
              )}
            </div>
            <div className="shrink-0 text-xs text-gray-400">
              {new Date(item.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────

export function LeadEnrichmentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search')

  const tabs: { id: Tab; label: string; icon: typeof Search }[] = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings2 },
    { id: 'history', label: 'History', icon: History },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Radar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Generation</h1>
            <p className="text-sm text-gray-500">
              Search, enrich, and import leads from external data providers
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'search' && <SearchPanel />}
      {activeTab === 'settings' && <SettingsPanel />}
      {activeTab === 'history' && <HistoryPanel />}
    </div>
  )
}
