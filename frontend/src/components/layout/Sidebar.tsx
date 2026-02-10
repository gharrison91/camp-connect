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
  Heart,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard', permission: null },
  { label: 'Events', icon: Calendar, path: '/app/events', permission: 'core.events.read' },
  { label: 'Campers', icon: Users, path: '/app/campers', permission: 'core.campers.read' },
  { label: 'Contacts', icon: BookUser, path: '/app/contacts', permission: 'core.contacts.read' },
  { label: 'Registrations', icon: ClipboardList, path: '/app/registrations', permission: 'core.registrations.read' },
  { label: 'Families', icon: UsersRound, path: '/app/families', permission: 'core.families.read' },
  { label: 'Activities', icon: Tent, path: '/app/activities', permission: 'core.activities.read' },
  { label: 'Bunks', icon: BedDouble, path: '/app/bunks', permission: 'core.bunks.read' },
  { label: 'Communications', icon: MessageSquare, path: '/app/communications', permission: 'comms.messages.read' },
  { label: 'Health & Safety', icon: Heart, path: '/app/health-safety', permission: 'health.forms.read' },
  { label: 'Staff', icon: UserCog, path: '/app/staff', permission: 'staff.employees.read' },
  { label: 'Photos', icon: Camera, path: '/app/photos', permission: 'photos.media.view' },
  { label: 'Schedule', icon: CalendarDays, path: '/app/schedule', permission: 'scheduling.sessions.read' },
  { label: 'Payments', icon: CreditCard, path: '/app/payments', permission: 'payments.invoices.read' },
  { label: 'Analytics', icon: BarChart3, path: '/app/analytics', permission: 'analytics.dashboards.read' },
  { label: 'Reports', icon: FileBarChart, path: '/app/reports', permission: 'reports.export.read' },
  { label: 'Store', icon: ShoppingBag, path: '/app/store', permission: 'store.manage.manage' },
  { label: 'Forms', icon: FileText, path: '/app/forms', permission: null },
  { label: 'Workflows', icon: Workflow, path: '/app/workflows', permission: null },
  { label: 'Settings', icon: Settings, path: '/app/settings', permission: null },
] as const;

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { hasPermission } = usePermissions();

  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );

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
          <ul className="flex flex-col gap-1" role="list">
            {visibleNavItems.map((item) => {
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
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
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
