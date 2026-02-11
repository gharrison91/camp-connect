import { Link, useLocation } from 'react-router-dom';
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
  ChevronsLeft,
  ChevronsRight,
  X,
  UsersRound,
  BedDouble,
  FileText,
  Workflow,
  ListChecks,
  Sparkles,
  MessageCircle,
  Heart,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  permission: string | null;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard', permission: null },
      { label: 'AI Insights', icon: Sparkles, path: '/app/ai-insights', permission: 'analytics.insights.read' },
    ],
  },
  {
    title: 'Camp Management',
    items: [
      { label: 'Events', icon: Calendar, path: '/app/events', permission: 'core.events.read' },
      { label: 'Campers', icon: Users, path: '/app/campers', permission: 'core.campers.read' },
      { label: 'Contacts', icon: BookUser, path: '/app/contacts', permission: 'core.contacts.read' },
      { label: 'Registrations', icon: ClipboardList, path: '/app/registrations', permission: 'core.registrations.read' },
      { label: 'Families', icon: UsersRound, path: '/app/families', permission: 'core.families.read' },
      { label: 'Activities', icon: Tent, path: '/app/activities', permission: 'core.activities.read' },
      { label: 'Bunks', icon: BedDouble, path: '/app/bunks', permission: 'core.bunks.read' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Schedule', icon: CalendarDays, path: '/app/schedule', permission: 'scheduling.sessions.read' },
      { label: 'Staff', icon: UserCog, path: '/app/staff', permission: 'staff.employees.read' },
      { label: 'Communications', icon: MessageSquare, path: '/app/communications', permission: 'comms.messages.read' },
      { label: 'Camper Messages', icon: MessageCircle, path: '/app/camper-messages', permission: null },
      { label: 'Nurse Schedule', icon: Heart, path: '/app/nurse-schedule', permission: null },
      { label: 'Photos', icon: Camera, path: '/app/photos', permission: 'photos.media.view' },
    ],
  },
  {
    title: 'Data & Reporting',
    items: [
      { label: 'Analytics', icon: BarChart3, path: '/app/analytics', permission: 'analytics.dashboards.read' },
      { label: 'Reports', icon: FileBarChart, path: '/app/reports', permission: 'reports.export.read' },
      { label: 'Lists', icon: ListChecks, path: '/app/lists', permission: null },
      { label: 'Alerts', icon: Bell, path: '/app/alerts', permission: null },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Payments', icon: CreditCard, path: '/app/payments', permission: 'payments.invoices.read' },
      { label: 'Store', icon: ShoppingBag, path: '/app/store', permission: 'store.manage.manage' },
      { label: 'Forms', icon: FileText, path: '/app/forms', permission: null },
      { label: 'Workflows', icon: Workflow, path: '/app/workflows', permission: null },
      { label: 'Settings', icon: Settings, path: '/app/settings', permission: null },
    ],
  },
];

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { hasPermission } = usePermissions();

  // Filter nav sections based on user permissions
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.permission === null || hasPermission(item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0f172a] transition-all duration-300 ease-in-out',
          'max-lg:-translate-x-full max-lg:w-64',
          isOpen && 'max-lg:translate-x-0',
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.08] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <Tent className="h-5 w-5 text-emerald-400" />
          </div>
          <span
            className={cn(
              'text-lg font-semibold tracking-tight text-white transition-opacity duration-200',
              isCollapsed ? 'lg:hidden' : 'lg:opacity-100'
            )}
          >
            Camp Connect
          </span>

          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-6">
            {visibleSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.title && !isCollapsed && (
                  <div className="mb-2 px-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {section.title}
                    </p>
                  </div>
                )}
                {section.title && isCollapsed && (
                  <div className="mx-auto mb-2 h-px w-6 bg-white/[0.08]" />
                )}
                <ul className="flex flex-col gap-0.5" role="list">
                  {section.items.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      location.pathname.startsWith(item.path + '/');
                    const Icon = item.icon;

                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={onClose}
                          className={cn(
                            'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                          )}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <Icon
                            className={cn(
                              'h-[18px] w-[18px] shrink-0 transition-colors',
                              isActive
                                ? 'text-emerald-400'
                                : 'text-slate-500 group-hover:text-slate-300'
                            )}
                          />
                          <span
                            className={cn(
                              'truncate transition-opacity duration-200',
                              isCollapsed && 'lg:sr-only'
                            )}
                          >
                            {item.label}
                          </span>

                          {isActive && (
                            <span className="absolute left-0 h-6 w-[3px] rounded-r-full bg-emerald-400" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.08] px-3 py-3">
          <button
            onClick={onToggleCollapse}
            className="hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300 lg:flex"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Collapse</span>
              </>
            )}
          </button>

          <div
            className={cn(
              'mt-2 text-center text-[11px] font-medium tracking-wide text-slate-600',
              isCollapsed && 'lg:text-[10px]'
            )}
          >
            v0.1.0
          </div>
        </div>
      </aside>
    </>
  );
}
