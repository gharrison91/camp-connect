/**
 * Camp Connect - CounselorCard
 * Draggable card for a counselor in the bunk assignment board.
 */

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface CounselorCardProps {
  id: string
  name: string
  avatarUrl: string | null
  isDragging?: boolean
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function CounselorCard({
  id,
  name,
  avatarUrl,
  isDragging,
}: CounselorCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 shadow-sm transition-all cursor-grab active:cursor-grabbing',
        isDragging
          ? 'opacity-50 shadow-lg ring-2 ring-indigo-300'
          : 'border-gray-100 hover:border-indigo-200 hover:shadow'
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
          {getInitials(name)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <span className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium leading-none bg-indigo-100 text-indigo-700">
          Counselor
        </span>
      </div>
    </div>
  )
}

export function CounselorCardOverlay({
  name,
  avatarUrl,
}: Omit<CounselorCardProps, 'id' | 'isDragging'>) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 shadow-lg ring-2 ring-indigo-300 cursor-grabbing">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
          {getInitials(name)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <span className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium leading-none bg-indigo-100 text-indigo-700">
          Counselor
        </span>
      </div>
    </div>
  )
}
