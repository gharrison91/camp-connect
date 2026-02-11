/**
 * Camp Connect – Global Command Palette (Cmd+K / Ctrl+K)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  BookUser,
  ClipboardList,
  CreditCard,
  MessageSquare,
  UserCog,
  Camera,
  BarChart3,
  FileBarChart,
  ShoppingBag,
  Settings,
  Tent,
  BedDouble,
  FileText,
  Workflow,
  ListChecks,
  Sparkles,
  MessageCircle,
  Heart,
  Bell,
  Target,
  Shield,
  Briefcase,
  Package,
  Utensils,
  AlertTriangle,
  Award,
  Bus,
  CloudSun,
  Wrench,
  PhoneCall,
  FolderOpen,
  UserPlus,
  HandHeart,
  Hash,
  ClipboardCheck,
  GraduationCap,
  Radar,
  Command,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'

interface PageLink {
  label: string
  path: string
  icon: LucideIcon
  section: string
}

const ALL_PAGES: PageLink[] = [
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, section: 'Main' },
  { label: 'AI Insights', path: '/app/ai-insights', icon: Sparkles, section: 'Main' },
  { label: 'Events', path: '/app/events', icon: Calendar, section: 'Camp Management' },
  { label: 'Campers', path: '/app/campers', icon: Users, section: 'Camp Management' },
  { label: 'Contacts', path: '/app/contacts', icon: BookUser, section: 'Camp Management' },
  { label: 'Registrations', path: '/app/registrations', icon: ClipboardList, section: 'Camp Management' },
  { label: 'Activities', path: '/app/activities', icon: Tent, section: 'Camp Management' },
  { label: 'Attendance', path: '/app/attendance', icon: ClipboardCheck, section: 'Camp Management' },
  { label: 'Skills', path: '/app/skills', icon: GraduationCap, section: 'Camp Management' },
  { label: 'Awards', path: '/app/awards', icon: Award, section: 'Camp Management' },
  { label: 'Bunks', path: '/app/bunks', icon: BedDouble, section: 'Camp Management' },
  { label: 'Meals', path: '/app/meals', icon: Utensils, section: 'Camp Management' },
  { label: 'Weather', path: '/app/weather', icon: CloudSun, section: 'Camp Management' },
  { label: 'Schedule', path: '/app/schedule', icon: CalendarDays, section: 'Operations' },
  { label: 'Staff', path: '/app/staff', icon: UserCog, section: 'Operations' },
  { label: 'Volunteers', path: '/app/volunteers', icon: HandHeart, section: 'Operations' },
  { label: 'Communications', path: '/app/communications', icon: MessageSquare, section: 'Operations' },
  { label: 'Team Chat', path: '/app/team-chat', icon: Hash, section: 'Operations' },
  { label: 'Camper Messages', path: '/app/camper-messages', icon: MessageCircle, section: 'Operations' },
  { label: 'Nurse Schedule', path: '/app/nurse-schedule', icon: Heart, section: 'Operations' },
  { label: 'Photos', path: '/app/photos', icon: Camera, section: 'Operations' },
  { label: 'Job Board', path: '/app/jobs', icon: Briefcase, section: 'Operations' },
  { label: 'Inventory', path: '/app/inventory', icon: Package, section: 'Operations' },
  { label: 'Incidents', path: '/app/incidents', icon: AlertTriangle, section: 'Operations' },
  { label: 'Transportation', path: '/app/transportation', icon: Bus, section: 'Operations' },
  { label: 'Visitors', path: '/app/visitors', icon: UserPlus, section: 'Operations' },
  { label: 'Parent Log', path: '/app/parent-logs', icon: PhoneCall, section: 'Operations' },
  { label: 'Emergency Plans', path: '/app/emergency', icon: Shield, section: 'Operations' },
  { label: 'Maintenance', path: '/app/maintenance', icon: Wrench, section: 'Operations' },
  { label: 'Analytics', path: '/app/analytics', icon: BarChart3, section: 'Data & Reporting' },
  { label: 'Reports', path: '/app/reports', icon: FileBarChart, section: 'Data & Reporting' },
  { label: 'Lists', path: '/app/lists', icon: ListChecks, section: 'Data & Reporting' },
  { label: 'Alerts', path: '/app/alerts', icon: Bell, section: 'Data & Reporting' },
  { label: 'Payments', path: '/app/payments', icon: CreditCard, section: 'Tools' },
  { label: 'Store', path: '/app/store', icon: ShoppingBag, section: 'Tools' },
  { label: 'Forms', path: '/app/forms', icon: FileText, section: 'Tools' },
  { label: 'Workflows', path: '/app/workflows', icon: Workflow, section: 'Tools' },
  { label: 'Documents', path: '/app/documents', icon: FolderOpen, section: 'Tools' },
  { label: 'Deals', path: '/app/deals', icon: Target, section: 'Tools' },
  { label: 'Lead Gen', path: '/app/leads', icon: Radar, section: 'Tools' },
  { label: 'Settings', path: '/app/settings', icon: Settings, section: 'Tools' },
]

const RECENT_KEY = 'cc_recent_searches'
function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5)
  } catch {
    return []
  }
}
function addRecent(q: string) {
  const list = getRecent().filter((r) => r !== q)
  list.unshift(q)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)))
}

const TYPE_ICON: Record<string, LucideIcon> = {
  camper: Users,
  staff: UserCog,
  event: Calendar,
  contact: BookUser,
  page: LayoutDashboard,
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Debounce API search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: apiResults } = useGlobalSearch(debouncedQuery)

  // Filter pages by query
  const filteredPages = query.length > 0
    ? ALL_PAGES.filter(
        (p) =>
          p.label.toLowerCase().includes(query.toLowerCase()) ||
          p.section.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  // Combine results
  const allResults: { id: string; label: string; subtitle?: string; path: string; icon: LucideIcon; group: string }[] = []

  if (filteredPages.length > 0) {
    filteredPages.forEach((p) =>
      allResults.push({ id: `page-${p.path}`, label: p.label, subtitle: p.section, path: p.path, icon: p.icon, group: 'Pages' })
    )
  }

  if (apiResults && apiResults.length > 0) {
    apiResults.forEach((r) =>
      allResults.push({
        id: `${r.type}-${r.id}`,
        label: r.title,
        subtitle: r.subtitle,
        path: r.path,
        icon: TYPE_ICON[r.type] || LayoutDashboard,
        group: r.type === 'camper' ? 'Campers' : r.type === 'staff' ? 'Staff' : r.type === 'event' ? 'Events' : 'Contacts',
      })
    )
  }

  // Recent searches (shown when no query)
  const recents = getRecent()

  // Reset index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, apiResults])

  // Keyboard shortcut to open
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setDebouncedQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleSelect = useCallback(
    (path: string) => {
      if (query) addRecent(query)
      setOpen(false)
      navigate(path)
    },
    [navigate, query]
  )

  // Keyboard nav
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = allResults.length
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % Math.max(count, 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + Math.max(count, 1)) % Math.max(count, 1))
      } else if (e.key === 'Enter' && count > 0) {
        e.preventDefault()
        handleSelect(allResults[selectedIndex]?.path || '/app/dashboard')
      }
    },
    [allResults, selectedIndex, handleSelect]
  )

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-700/60 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, campers, staff, events..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-600 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            <Command className="h-3 w-3" />K
          </kbd>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {query.length === 0 && recents.length > 0 && (
            <div className="px-3 pb-2">
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Recent Searches
              </p>
              {recents.map((r) => (
                <button
                  key={r}
                  onClick={() => setQuery(r)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  {r}
                </button>
              ))}
            </div>
          )}

          {query.length > 0 && allResults.length === 0 && (
            <div className="py-8 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-2 text-sm text-slate-400">No results found</p>
              <p className="text-xs text-slate-500">Try a different search term</p>
            </div>
          )}

          {allResults.length > 0 && (
            <>
              {(() => {
                let lastGroup = ''
                return allResults.map((item, idx) => {
                  const showGroup = item.group !== lastGroup
                  lastGroup = item.group
                  const Icon = item.icon
                  return (
                    <div key={item.id}>
                      {showGroup && (
                        <p className="mt-2 mb-1 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          {item.group}
                        </p>
                      )}
                      <button
                        data-index={idx}
                        onClick={() => handleSelect(item.path)}
                        className={cn(
                          'flex w-full items-center gap-3 px-5 py-2 text-sm transition-colors',
                          idx === selectedIndex
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'text-slate-300 hover:bg-slate-800'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {item.subtitle && (
                          <span className="text-xs text-slate-500">{item.subtitle}</span>
                        )}
                        {idx === selectedIndex && (
                          <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </button>
                    </div>
                  )
                })
              })()}
            </>
          )}

          {query.length === 0 && recents.length === 0 && (
            <div className="py-8 text-center">
              <Command className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-2 text-sm text-slate-400">Start typing to search</p>
              <p className="text-xs text-slate-500">
                Navigate pages, find campers, staff & more
              </p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-slate-700/60 px-4 py-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-600 px-1">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-600 px-1">↵</kbd> select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-600 px-1">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
