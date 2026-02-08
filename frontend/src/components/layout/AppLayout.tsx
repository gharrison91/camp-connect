import { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function AppLayout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Mobile: sidebar open/closed (hidden by default)
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop: sidebar collapsed/expanded
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false);
    }
  }, [isDesktop]);

  const handleMobileToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const handleCollapseToggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        isOpen={mobileOpen}
        isCollapsed={collapsed}
        onClose={handleMobileClose}
        onToggleCollapse={handleCollapseToggle}
      />

      <TopBar
        onMenuClick={handleMobileToggle}
        isSidebarCollapsed={collapsed}
      />

      {/* Main content area */}
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
