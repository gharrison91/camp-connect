/**
 * Camp Connect - CamperCard
 * Draggable card representing a camper in the bunk assignment board.
 */

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface CamperCardProps {
  id: string
  name: string
  age: number | null
  gender: string | null
  isDragging?: boolean
}

function getGenderColor(gender: string | null): string {
  switch (gender?.toLowerCase()) {
    case 'male':
      return 'bg-blue-100 text-blue-700'
    case 'female':
      return 'bg-pink-100 text-pink-700'
    default:
      return 'bg-purple-100 text-purple-700'
  }
}

function getGenderAvatarBg(gender: string | null): string {
  switch (gender?.toLowerCase()) {
    case 'male':
      return 'bg-blue-500'
    case 'female':
      return 'bg-pink-500'
    default:
      return 'bg-purple-500'
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getGenderLabel(gender: string | null): string {
  switch (gender?.toLowerCase()) {
    case 'male':
      return 'M'
    case 'female':
      return 'F'
    default:
      return gender ? gender.charAt(0).toUpperCase() : '?'
  }
}

export function CamperCard({ id, name, age, gender, isDragging }: CamperCardProps) {
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
          ? 'opacity-50 shadow-lg ring-2 ring-blue-300'
          : 'border-gray-100 hover:border-gray-200 hover:shadow'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
          getGenderAvatarBg(gender)
        )}
      >
        {getInitials(name)}
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <div className="flex items-center gap-1.5">
          {age != null && (
            <span className="text-xs text-gray-500">Age {age}</span>
          )}
          {gender && (
            <span
              className={cn(
                'inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium leading-none',
                getGenderColor(gender)
              )}
            >
              {getGenderLabel(gender)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Overlay version rendered inside DragOverlay (no drag hooks needed).
 */
export function CamperCardOverlay({
  name,
  age,
  gender,
}: Omit<CamperCardProps, 'id' | 'isDragging'>) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-white px-3 py-2 shadow-lg ring-2 ring-blue-300 cursor-grabbing">
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
          getGenderAvatarBg(gender)
        )}
      >
        {getInitials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <div className="flex items-center gap-1.5">
          {age != null && (
            <span className="text-xs text-gray-500">Age {age}</span>
          )}
          {gender && (
            <span
              className={cn(
                'inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium leading-none',
                getGenderColor(gender)
              )}
            >
              {getGenderLabel(gender)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
