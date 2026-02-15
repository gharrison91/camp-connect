/**
 * Navigation Settings Page
 * Allows admins to toggle which pages appear in the sidebar navigation.
 */

import { useState, useEffect } from 'react'
import {
  Tent,
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
  UsersRound,
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
  ShieldCheck,
  Briefcase,
  Radar,
  Package,
  PackageCheck,
  Utensils,
  AlertTriangle,
  Megaphone,
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
  ScanFace,
  ListOrdered,
  Activity,
  Wallet,
  Stethoscope,
  CalendarRange,
  FileSignature,
  DollarSign,
  Building2,
  PackageOpen,
  Users2,
  Car,
  Search,
  Pill,
  StickyNote,
  LogIn,
  Apple,
  ClipboardPenLine,
  Share2,
  MessageSquareWarning,
  CalendarClock,
  MessageSquareText,
  DoorOpen,
  Loader2,
  Save,
  Eye,
  EyeOff,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigationSettings, useUpdateNavigationSettings } from '@/hooks/useNavigationSettings'

type NavItem = {
  label: string
  icon: LucideIcon
  path: string
}

type NavSection = {
  title: string
  items: NavItem[]
}

// All navigation sections (matching Sidebar.tsx)
const allNavSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
      { label: 'AI Insights', icon: Sparkles, path: '/app/ai-insights' },
    ],
  },
  {
    title: 'Camp Management',
    items: [
      { label: 'Events', icon: Calendar, path: '/app/events' },
      { label: 'Campers', icon: Users, path: '/app/campers' },
      { label: 'Contacts', icon: BookUser, path: '/app/contacts' },
      { label: 'Registrations', icon: ClipboardList, path: '/app/registrations' },
      { label: 'Families', icon: UsersRound, path: '/app/families' },
      { label: 'Activities', icon: Tent, path: '/app/activities' },
      { label: 'Attendance', icon: ClipboardCheck, path: '/app/attendance' },
      { label: 'Skills', icon: GraduationCap, path: '/app/skills' },
      { label: 'Awards', icon: Award, path: '/app/awards' },
      { label: 'Bunks', icon: BedDouble, path: '/app/bunks' },
      { label: 'Meals', icon: Utensils, path: '/app/meals' },
      { label: 'Weather', icon: CloudSun, path: '/app/weather' },
      { label: 'Waitlist', icon: ListOrdered, path: '/app/waitlist' },
      { label: 'Packing Lists', icon: PackageCheck, path: '/app/packing-lists' },
      { label: 'Sessions', icon: CalendarRange, path: '/app/sessions' },
      { label: 'Permission Slips', icon: FileSignature, path: '/app/permission-slips' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Schedule', icon: CalendarDays, path: '/app/schedule' },
      { label: 'Staff', icon: UserCog, path: '/app/staff' },
      { label: 'Volunteers', icon: HandHeart, path: '/app/volunteers' },
      { label: 'Background Checks', icon: ShieldCheck, path: '/app/background-checks' },
      { label: 'Certifications', icon: Award, path: '/app/certifications' },
      { label: 'Communications', icon: MessageSquare, path: '/app/communications' },
      { label: 'Team Chat', icon: Hash, path: '/app/team-chat' },
      { label: 'Camper Messages', icon: MessageCircle, path: '/app/camper-messages' },
      { label: 'Nurse Schedule', icon: Heart, path: '/app/nurse-schedule' },
      { label: 'Medical Dashboard', icon: Activity, path: '/app/medical-dashboard' },
      { label: 'Medical Log', icon: Stethoscope, path: '/app/medical-log' },
      { label: 'Photos', icon: Camera, path: '/app/photos' },
      { label: 'Face Tagging', icon: ScanFace, path: '/app/face-tagging' },
      { label: 'Job Board', icon: Briefcase, path: '/app/jobs' },
      { label: 'Inventory', icon: Package, path: '/app/inventory' },
      { label: 'Incidents', icon: AlertTriangle, path: '/app/incidents' },
      { label: 'Transportation', icon: Bus, path: '/app/transportation' },
      { label: 'Visitors', icon: UserPlus, path: '/app/visitors' },
      { label: 'Parent Log', icon: PhoneCall, path: '/app/parent-logs' },
      { label: 'Emergency Plans', icon: Shield, path: '/app/emergency' },
      { label: 'Maintenance', icon: Wrench, path: '/app/maintenance' },
      { label: 'Tasks', icon: ClipboardList, path: '/app/tasks' },
      { label: 'Resources', icon: Building2, path: '/app/resource-booking' },
      { label: 'Room Booking', icon: DoorOpen, path: '/app/room-booking' },
      { label: 'Supply Requests', icon: PackageOpen, path: '/app/supply-requests' },
      { label: 'Alumni', icon: Users2, path: '/app/alumni' },
      { label: 'Carpools', icon: Car, path: '/app/carpools' },
      { label: 'Lost & Found', icon: Search, path: '/app/lost-found' },
      { label: 'Allergy Matrix', icon: Pill, path: '/app/allergy-matrix' },
      { label: 'Group Notes', icon: StickyNote, path: '/app/group-notes' },
      { label: 'Check-In/Out', icon: LogIn, path: '/app/check-in' },
      { label: 'Dietary', icon: Apple, path: '/app/dietary' },
      { label: 'Behavior', icon: MessageSquareWarning, path: '/app/behavior' },
      { label: 'Staff Schedule', icon: CalendarClock, path: '/app/staff-schedule' },
      { label: 'Referrals', icon: Share2, path: '/app/referrals' },
    ],
  },
  {
    title: 'Data & Reporting',
    items: [
      { label: 'Analytics', icon: BarChart3, path: '/app/analytics' },
      { label: 'Reports', icon: FileBarChart, path: '/app/reports' },
      { label: 'Lists', icon: ListChecks, path: '/app/lists' },
      { label: 'Alerts', icon: Bell, path: '/app/alerts' },
      { label: 'Announcements', icon: Megaphone, path: '/app/announcements' },
      { label: 'Audit Log', icon: Shield, path: '/app/audit-log' },
      { label: 'Surveys', icon: ClipboardList, path: '/app/surveys' },
      { label: 'Feedback', icon: MessageSquareText, path: '/app/feedback' },
      { label: 'Program Eval', icon: ClipboardPenLine, path: '/app/program-eval' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Payments', icon: CreditCard, path: '/app/payments' },
      { label: 'Store', icon: ShoppingBag, path: '/app/store' },
      { label: 'Spending', icon: Wallet, path: '/app/spending-accounts' },
      { label: 'Forms', icon: FileText, path: '/app/forms' },
      { label: 'Workflows', icon: Workflow, path: '/app/workflows' },
      { label: 'Documents', icon: FolderOpen, path: '/app/documents' },
      { label: 'Deals', icon: Target, path: '/app/deals' },
      { label: 'Lead Gen', icon: Radar, path: '/app/leads' },
      { label: 'Budget', icon: DollarSign, path: '/app/budget' },
      // Settings is always visible - not toggleable
    ],
  },
]

// Items that cannot be hidden
const protectedPaths = ['/app/settings', '/app/dashboard']

export function NavigationSettingsPage() {
  const { data: navSettings, isLoading } = useNavigationSettings()
  const updateSettings = useUpdateNavigationSettings()
  const [hiddenItems, setHiddenItems] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (navSettings) {
      setHiddenItems(navSettings.hidden_nav_items)
    }
  }, [navSettings])

  const toggleItem = (path: string) => {
    if (protectedPaths.includes(path)) return
    
    setHiddenItems((prev) => {
      const newItems = prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path]
      setHasChanges(true)
      return newItems
    })
  }

  const toggleSection = (section: NavSection, hide: boolean) => {
    const sectionPaths = section.items
      .filter((item) => !protectedPaths.includes(item.path))
      .map((item) => item.path)

    setHiddenItems((prev) => {
      let newItems: string[]
      if (hide) {
        // Add all section paths to hidden
        newItems = [...new Set([...prev, ...sectionPaths])]
      } else {
        // Remove all section paths from hidden
        newItems = prev.filter((p) => !sectionPaths.includes(p))
      }
      setHasChanges(true)
      return newItems
    })
  }

  const handleSave = () => {
    updateSettings.mutate(hiddenItems, {
      onSuccess: () => {
        setHasChanges(false)
      },
    })
  }

  const getSectionVisibleCount = (section: NavSection) => {
    const toggleableItems = section.items.filter(
      (item) => !protectedPaths.includes(item.path)
    )
    const visibleCount = toggleableItems.filter(
      (item) => !hiddenItems.includes(item.path)
    ).length
    return { visible: visibleCount, total: toggleableItems.length }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Navigation Settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose which pages appear in your sidebar navigation. Hidden pages will not be accessible from the menu.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            hasChanges
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {allNavSections.map((section) => {
          const counts = getSectionVisibleCount(section)
          const allHidden = counts.visible === 0
          const allVisible = counts.visible === counts.total

          return (
            <div
              key={section.title}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {section.title}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {counts.visible} of {counts.total} visible
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSection(section, false)}
                    disabled={allVisible}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      allVisible
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    )}
                  >
                    <Eye className="h-3 w-3" />
                    Show All
                  </button>
                  <button
                    onClick={() => toggleSection(section, true)}
                    disabled={allHidden}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      allHidden
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    <EyeOff className="h-3 w-3" />
                    Hide All
                  </button>
                </div>
              </div>

              {/* Section Items */}
              <div className="divide-y divide-slate-100">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isHidden = hiddenItems.includes(item.path)
                  const isProtected = protectedPaths.includes(item.path)

                  return (
                    <div
                      key={item.path}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 transition-colors',
                        isHidden && !isProtected ? 'bg-slate-50' : 'bg-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                            isHidden && !isProtected
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-emerald-50 text-emerald-600'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isHidden && !isProtected
                                ? 'text-slate-400'
                                : 'text-slate-700'
                            )}
                          >
                            {item.label}
                          </p>
                          {isProtected && (
                            <p className="text-xs text-slate-400">
                              Cannot be hidden
                            </p>
                          )}
                        </div>
                      </div>

                      {!isProtected && (
                        <button
                          onClick={() => toggleItem(item.path)}
                          className={cn(
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                            isHidden ? 'bg-slate-200' : 'bg-emerald-500'
                          )}
                          role="switch"
                          aria-checked={!isHidden}
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                              isHidden ? 'translate-x-0' : 'translate-x-5'
                            )}
                          />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {hasChanges && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">
            You have unsaved changes. Click "Save Changes" to apply your navigation settings.
          </p>
        </div>
      )}
    </div>
  )
}
