/**
 * Reusable glass-morphism card component for the marketing site.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function GlassCard({
  children,
  className,
  hover = true,
  padding = 'md',
}: GlassCardProps) {
  const paddingMap = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10',
        hover && 'transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:shadow-lg hover:shadow-emerald-500/5',
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
