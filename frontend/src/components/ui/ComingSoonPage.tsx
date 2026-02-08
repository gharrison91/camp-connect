import type { LucideIcon } from 'lucide-react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComingSoonPageProps {
  title: string
  description: string
  icon: LucideIcon
}

export function ComingSoonPage({ title, description, icon: Icon }: ComingSoonPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className={cn(
          'mx-auto w-full max-w-lg rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center'
        )}
      >
        {/* Feature icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
          <Icon className="h-8 w-8 text-emerald-500" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          {description}
        </p>

        {/* Coming soon badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          Coming in a future update
        </div>
      </div>
    </div>
  )
}
