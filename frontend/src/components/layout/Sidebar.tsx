import { Link, useLocation } from 'react-router-dom';
import {
  Tent,
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Heart,
  UserCog,
  Camera,
  BarChart3,
  ShoppingBag,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'Campers', icon: Users, path: '/campers' },
  { label: 'Communications', icon: MessageSquare, path: '/communications' },
  { label: 'Health & Safety', icon: Heart, path: '/health-safety' },
  { label: 'Staff', icon: UserCog, path: '/staff' },
  { label: 'Photos', icon: Camera, path: '/photos' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Store', icon: ShoppingBag, path: '/store' },
  { label: 'Settings', icon: Settings, path: '/settings' },
] as const;

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

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
          // Mobile: slide in/out
          'max-lg:-translate-x-full max-lg:w-64',
          isOpen && 'max-lg:translate-x-0',
          // Desktop: collapse/expand
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

          {/* Mobile close button */}
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
            {navItems.map((item) => {
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

                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 h-6 w-[3px] rounded-r-full bg-emerald-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: collapse toggle + version */}
        <div className="shrink-0 border-t border-white/[0.08] px-3 py-3">
          {/* Collapse toggle (desktop only) */}
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

          {/* Version tag */}
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
