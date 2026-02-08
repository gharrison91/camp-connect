import { Menu, Search, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
}

export function TopBar({ onMenuClick, isSidebarCollapsed }: TopBarProps) {
  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 transition-all duration-300 sm:px-6',
        isSidebarCollapsed ? 'lg:left-16' : 'lg:left-64',
        'left-0'
      )}
    >
      {/* Hamburger menu (mobile) */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search bar */}
      <div className="flex flex-1 justify-center px-2">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search campers, events, staff..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            3
          </span>
        </button>

        {/* User avatar */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white ring-2 ring-white transition-shadow hover:ring-emerald-200"
          aria-label="User menu"
        >
          GH
        </button>
      </div>
    </header>
  );
}
