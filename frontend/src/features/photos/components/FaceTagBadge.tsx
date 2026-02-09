import { cn } from '@/lib/utils'

interface FaceTagBadgeProps {
  camperName?: string
  confidence: number
  similarity: number
  onClick?: () => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getConfidenceTier(confidence: number) {
  if (confidence > 90) {
    return {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      avatarBg: 'bg-emerald-100 text-emerald-700',
      dot: 'bg-emerald-500',
    }
  }
  if (confidence >= 80) {
    return {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700',
      avatarBg: 'bg-amber-100 text-amber-700',
      dot: 'bg-amber-500',
    }
  }
  return {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-600',
    avatarBg: 'bg-gray-100 text-gray-500',
    dot: 'bg-gray-400',
  }
}

export function FaceTagBadge({
  camperName,
  confidence,
  similarity,
  onClick,
}: FaceTagBadgeProps) {
  const displayName = camperName || 'Unknown'
  const tier = getConfidenceTier(confidence)
  const confidenceLabel = `${Math.round(confidence)}%`

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors',
        tier.bg,
        tier.text,
        onClick
          ? 'cursor-pointer hover:shadow-sm active:scale-[0.97]'
          : 'cursor-default'
      )}
      title={`Confidence: ${confidenceLabel} | Similarity: ${(similarity * 100).toFixed(1)}%`}
    >
      {/* Avatar / Initials */}
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none',
          tier.avatarBg
        )}
      >
        {getInitials(displayName)}
      </span>

      {/* Name */}
      <span className="max-w-[7rem] truncate">{displayName}</span>

      {/* Confidence dot + percentage */}
      <span className="flex items-center gap-1">
        <span className={cn('h-1.5 w-1.5 rounded-full', tier.dot)} />
        <span className="tabular-nums">{confidenceLabel}</span>
      </span>
    </button>
  )
}
