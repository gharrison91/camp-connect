/**
 * Developer Reference Page
 * Shows all internal IDs, API references, and quick endpoint docs for org admins.
 */

import { useState, useCallback } from 'react'
import {
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Terminal,
  Hash,
  Calendar,
  MapPin,
  Users,
  FileText,
  Tent,
  Shield,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useDeveloperReference } from '@/hooks/useOrganization'
import type { DeveloperReferenceEntity } from '@/hooks/useOrganization'

// ── Copy-to-clipboard button ────────────────────────────────────────────────

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [text])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
        copied
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
      } ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ── Collapsible entity section ──────────────────────────────────────────────

const ENTITY_CONFIG: Record<string, { label: string; icon: typeof Code2; singular: string }> = {
  events: { label: 'Events', icon: Calendar, singular: 'event' },
  activities: { label: 'Activities', icon: Tent, singular: 'activity' },
  bunks: { label: 'Bunks', icon: Hash, singular: 'bunk' },
  locations: { label: 'Locations', icon: MapPin, singular: 'location' },
  roles: { label: 'Roles', icon: Shield, singular: 'role' },
  form_templates: { label: 'Form Templates', icon: FileText, singular: 'form template' },
}

function EntitySection({
  entityKey,
  items,
  searchQuery,
}: {
  entityKey: string
  items: DeveloperReferenceEntity[]
  searchQuery: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const config = ENTITY_CONFIG[entityKey]
  if (!config) return null

  const Icon = config.icon

  // Filter items by search
  const filteredItems = searchQuery
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items

  // Auto-expand if search matches items in this section
  const shouldShow = !searchQuery || filteredItems.length > 0
  const isExpanded = isOpen || (searchQuery.length > 0 && filteredItems.length > 0)

  if (!shouldShow) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <Icon className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900">{config.label}</span>
            <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {filteredItems.length}{searchQuery && filteredItems.length !== items.length ? ` / ${items.length}` : ''}
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              No {config.label.toLowerCase()} found
              {searchQuery && ' matching your search'}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-400 bg-slate-50">
                <div className="col-span-4">Name</div>
                <div className="col-span-5">ID</div>
                <div className="col-span-3">Created</div>
              </div>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-slate-50/50 transition-colors"
                >
                  <div className="col-span-4 text-sm font-medium text-slate-800 truncate" title={item.name}>
                    {item.name || '(unnamed)'}
                  </div>
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <code className="text-xs text-slate-500 font-mono truncate bg-slate-50 px-1.5 py-0.5 rounded" title={item.id}>
                      {item.id}
                    </code>
                    <CopyButton text={item.id} />
                  </div>
                  <div className="col-span-3 text-xs text-slate-400">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '--'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Quick Reference Card ────────────────────────────────────────────────────

const QUICK_ENDPOINTS = [
  { method: 'GET', path: '/events', description: 'List all events' },
  { method: 'POST', path: '/events', description: 'Create an event' },
  { method: 'GET', path: '/events/{id}', description: 'Get event details' },
  { method: 'GET', path: '/campers', description: 'List all campers' },
  { method: 'POST', path: '/campers', description: 'Create a camper' },
  { method: 'GET', path: '/campers/{id}', description: 'Get camper details' },
  { method: 'GET', path: '/contacts', description: 'List all contacts' },
  { method: 'POST', path: '/contacts', description: 'Create a contact' },
  { method: 'GET', path: '/registrations', description: 'List registrations' },
  { method: 'POST', path: '/registrations', description: 'Create registration' },
  { method: 'GET', path: '/activities', description: 'List activities' },
  { method: 'GET', path: '/bunks', description: 'List bunks' },
  { method: 'GET', path: '/locations', description: 'List locations' },
  { method: 'GET', path: '/staff', description: 'List staff members' },
  { method: 'GET', path: '/forms', description: 'List form templates' },
  { method: 'GET', path: '/settings', description: 'Get org settings' },
  { method: 'PUT', path: '/settings', description: 'Update org settings' },
]

function methodColor(method: string) {
  switch (method) {
    case 'GET':
      return 'bg-blue-100 text-blue-700'
    case 'POST':
      return 'bg-emerald-100 text-emerald-700'
    case 'PUT':
      return 'bg-amber-100 text-amber-700'
    case 'DELETE':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function QuickReferenceCard({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
            <Terminal className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900">Quick API Reference</span>
            <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {QUICK_ENDPOINTS.length} endpoints
            </span>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-slate-100">
          <div className="p-3 bg-slate-50 border-b border-slate-100">
            <p className="text-xs text-slate-500">
              All endpoints are relative to the API base URL. Include your JWT token in the
              <code className="mx-1 rounded bg-slate-200 px-1 py-0.5 text-[11px] font-mono">Authorization: Bearer &lt;token&gt;</code>
              header.
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {QUICK_ENDPOINTS.map((ep) => (
              <div
                key={`${ep.method}-${ep.path}`}
                className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50/50 transition-colors"
              >
                <span
                  className={`inline-flex w-14 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColor(
                    ep.method
                  )}`}
                >
                  {ep.method}
                </span>
                <code className="text-xs font-mono text-slate-600 flex-1">{ep.path}</code>
                <span className="text-xs text-slate-400 hidden sm:block">{ep.description}</span>
                <CopyButton text={`${apiBaseUrl}${ep.path}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export function DeveloperReferencePage() {
  const { data, isLoading, error } = useDeveloperReference()
  const [searchQuery, setSearchQuery] = useState('')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-sm text-slate-500">Loading developer reference...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm font-medium text-red-800">Failed to load developer reference</p>
        <p className="mt-1 text-xs text-red-600">
          {error instanceof Error ? error.message : 'Please try again later.'}
        </p>
      </div>
    )
  }

  const totalEntities = Object.values(data.entities).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <Code2 className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Developer Reference</h2>
          <p className="text-sm text-slate-500">
            Internal IDs, API endpoints, and entity references for your organization.
          </p>
        </div>
      </div>

      {/* Org ID + API Base URL cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Organization ID</span>
            </div>
            <CopyButton text={data.organization_id} />
          </div>
          <code className="mt-2 block truncate text-sm font-mono text-slate-700" title={data.organization_id}>
            {data.organization_id}
          </code>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">API Base URL</span>
            </div>
            <CopyButton text={data.api_base_url} />
          </div>
          <code className="mt-2 block truncate text-sm font-mono text-slate-700" title={data.api_base_url}>
            {data.api_base_url}
          </code>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search across ${totalEntities} entities by name or ID...`}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Entity sections */}
      <div className="space-y-3">
        {Object.entries(data.entities).map(([key, items]) => (
          <EntitySection key={key} entityKey={key} items={items} searchQuery={searchQuery} />
        ))}
      </div>

      {/* Quick Reference */}
      <QuickReferenceCard apiBaseUrl={data.api_base_url} />
    </div>
  )
}
