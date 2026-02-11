/**
 * Camp Connect - Awards & Achievements Page
 * Gamification system with leaderboard, badges, activity feed, and award granting.
 */

import { useState, useEffect } from 'react'
import {
  Award,
  Trophy,
  Star,
  Crown,
  Sparkles,
  Target,
  Plus,
  Search,
  X,
  Loader2,
  Clock,
  Users,
  Gift,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useBadges,
  useCreateBadge,
  useUpdateBadge,
  useDeleteBadge,
  useGrantAward,
  useLeaderboard,
  useRecentAwards,
  useAwardStats,
  useBadgeRecipients,
} from '@/hooks/useAwards'
import { useCampers } from '@/hooks/useCampers'
import type { AwardBadge } from '@/types'

type TabId = 'leaderboard' | 'badges' | 'recent' | 'give'
type BadgeCategory = 'skill' | 'behavior' | 'achievement' | 'milestone' | 'special'

const CATEGORIES: { value: BadgeCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'skill', label: 'Skill' },
  { value: 'behavior', label: 'Behavior' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'special', label: 'Special' },
]

const EMOJI_OPTIONS = [
  '⭐', '🏆', '🎖️', '🥇', '🥈', '🥉', '🎯', '🔥', '💎', '👑',
  '🌟', '✨', '💪', '🎨', '🎭', '🏅', '🎪', '🏕️', '🌈', '🦅',
  '🐻', '🌲', '⛺', '🛶', '🏊', '🎣', '🧗', '🏹', '🎤', '🎵',
  '📚', '🔬', '🧩', '♟️', '🎲', '🤝', '❤️', '🌻', '🦋', '🐝',
]

const COLOR_OPTIONS = [
  '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#D97706',
  '#059669', '#2563EB', '#7C3AED', '#DB2777', '#EA580C',
]

const categoryColors: Record<string, string> = {
  skill: 'bg-blue-50 text-blue-700 border-blue-200',
  behavior: 'bg-green-50 text-green-700 border-green-200',
  achievement: 'bg-amber-50 text-amber-700 border-amber-200',
  milestone: 'bg-purple-50 text-purple-700 border-purple-200',
  special: 'bg-rose-50 text-rose-700 border-rose-200',
}

// ---- Animated Counter ----
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const duration = 800
    const steps = 30
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(Math.round(increment * step), value)
      setDisplay(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span className={className}>{display.toLocaleString()}</span>
}

// ---- Badge Form Modal ----
function BadgeFormModal({
  badge,
  onClose,
  onSave,
  isSaving,
}: {
  badge?: AwardBadge | null
  onClose: () => void
  onSave: (data: Partial<AwardBadge>) => void
  isSaving: boolean
}) {
  const [name, setName] = useState(badge?.name || '')
  const [description, setDescription] = useState(badge?.description || '')
  const [icon, setIcon] = useState(badge?.icon || '⭐')
  const [color, setColor] = useState(badge?.color || '#F59E0B')
  const [category, setCategory] = useState<BadgeCategory>(badge?.category || 'achievement')
  const [points, setPoints] = useState(badge?.points?.toString() || '10')
  const [criteria, setCriteria] = useState(badge?.criteria || '')
  const [maxAwards, setMaxAwards] = useState(badge?.max_awards_per_session?.toString() || '')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      description: description || undefined,
      icon,
      color,
      category,
      points: parseInt(points) || 10,
      criteria: criteria || undefined,
      max_awards_per_session: maxAwards ? parseInt(maxAwards) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{badge ? 'Edit Badge' : 'Create Badge'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center rounded-lg bg-gray-50 p-4">
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                style={{ backgroundColor: color + '20', border: `2px solid ${color}` }}
              >
                {icon}
              </div>
              <span className="text-sm font-medium text-gray-700">{name || 'Badge Name'}</span>
              <span className="text-xs text-gray-500">{points || 0} pts</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="e.g., Swimming Star"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="What is this badge for?"
            />
          </div>

          {/* Icon + Color row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Icon</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="text-xl">{icon}</span>
                  <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute left-0 top-full z-10 mt-1 grid w-64 grid-cols-8 gap-1 rounded-lg border bg-white p-2 shadow-lg">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => { setIcon(emoji); setShowEmojiPicker(false) }}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-gray-100',
                          icon === emoji && 'bg-amber-100 ring-1 ring-amber-400'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                      color === c ? 'border-gray-800 scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Category + Points row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BadgeCategory)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="skill">Skill</option>
                <option value="behavior">Behavior</option>
                <option value="achievement">Achievement</option>
                <option value="milestone">Milestone</option>
                <option value="special">Special</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Points</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Criteria */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Criteria</label>
            <textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="How can campers earn this badge?"
            />
          </div>

          {/* Max awards */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Max awards per session <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              value={maxAwards}
              onChange={(e) => setMaxAwards(e.target.value)}
              min="1"
              placeholder="Unlimited"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {badge ? 'Update Badge' : 'Create Badge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Recipients Modal ----
function RecipientsModal({
  badge,
  onClose,
}: {
  badge: AwardBadge
  onClose: () => void
}) {
  const { data: recipients = [], isLoading } = useBadgeRecipients(badge.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{badge.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{badge.name}</h2>
              <p className="text-sm text-gray-500">{recipients.length} recipients</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
        ) : recipients.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No one has earned this badge yet.</p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {recipients.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.camper_name}</p>
                  {r.reason && <p className="text-xs text-gray-500">{r.reason}</p>}
                </div>
                <p className="text-xs text-gray-400">{new Date(r.granted_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


// ============================================================
// Main Awards Page
// ============================================================

export function AwardsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabId>('leaderboard')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [editingBadge, setEditingBadge] = useState<AwardBadge | null>(null)
  const [selectedBadge, setSelectedBadge] = useState<AwardBadge | null>(null)

  // Give Award tab state
  const [camperSearch, setCamperSearch] = useState('')
  const [selectedCamperId, setSelectedCamperId] = useState<string>('')
  const [selectedCamperName, setSelectedCamperName] = useState('')
  const [selectedBadgeForGrant, setSelectedBadgeForGrant] = useState<AwardBadge | null>(null)
  const [grantReason, setGrantReason] = useState('')
  const [showCamperDropdown, setShowCamperDropdown] = useState(false)

  // Data hooks
  const { data: stats } = useAwardStats()
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useLeaderboard(
    50,
    categoryFilter !== 'all' ? categoryFilter : undefined,
  )
  const { data: badges = [], isLoading: loadingBadges } = useBadges(
    categoryFilter !== 'all' ? categoryFilter : undefined,
  )
  const { data: recentAwards = [], isLoading: loadingRecent } = useRecentAwards(50)
  const { data: allBadgesForGrant = [] } = useBadges()
  const { data: camperData } = useCampers({ search: camperSearch, limit: 10 })
  const camperResults = camperData?.items || []

  // Mutations
  const createBadge = useCreateBadge()
  const updateBadge = useUpdateBadge()
  const deleteBadge = useDeleteBadge()
  const grantAward = useGrantAward()

  const handleSaveBadge = (data: Partial<AwardBadge>) => {
    if (editingBadge) {
      updateBadge.mutate(
        { id: editingBadge.id, data },
        {
          onSuccess: () => {
            toast({ message: 'Badge updated', type: 'success' })
            setShowBadgeModal(false)
            setEditingBadge(null)
          },
          onError: () => toast({ message: 'Failed to update badge', type: 'error' }),
        },
      )
    } else {
      createBadge.mutate(data, {
        onSuccess: () => {
          toast({ message: 'Badge created!', type: 'success' })
          setShowBadgeModal(false)
        },
        onError: () => toast({ message: 'Failed to create badge', type: 'error' }),
      })
    }
  }

  const handleDeleteBadge = (badge: AwardBadge) => {
    if (!confirm(`Delete "${badge.name}"? This will remove all associated awards.`)) return
    deleteBadge.mutate(badge.id, {
      onSuccess: () => toast({ message: 'Badge deleted', type: 'success' }),
      onError: () => toast({ message: 'Failed to delete badge', type: 'error' }),
    })
  }

  const handleGrantAward = () => {
    if (!selectedCamperId || !selectedBadgeForGrant) return
    grantAward.mutate(
      {
        badge_id: selectedBadgeForGrant.id,
        camper_id: selectedCamperId,
        reason: grantReason || undefined,
      },
      {
        onSuccess: () => {
          toast({ message: `Awarded "${selectedBadgeForGrant.name}" to ${selectedCamperName}!`, type: 'success' })
          setSelectedCamperId('')
          setSelectedCamperName('')
          setSelectedBadgeForGrant(null)
          setGrantReason('')
          setCamperSearch('')
        },
        onError: () => toast({ message: 'Failed to grant award', type: 'error' }),
      },
    )
  }

  const tabs: { id: TabId; label: string; icon: typeof Trophy }[] = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'recent', label: 'Recent Activity', icon: Clock },
    { id: 'give', label: 'Give Award', icon: Gift },
  ]

  // Podium entries (top 3)
  const podium = leaderboard.slice(0, 3)
  const restOfLeaderboard = leaderboard.slice(3)
  const maxPoints = leaderboard.length > 0 ? leaderboard[0].total_points : 1

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Awards & Achievements</h1>
            <p className="text-sm text-gray-500">Recognize campers with badges, track progress, and celebrate achievements</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <Award className="h-4 w-4" />
              <span>Total Awarded</span>
            </div>
            <AnimatedNumber value={stats.total_awards_given} className="mt-1 block text-2xl font-bold text-amber-900" />
          </div>
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Star className="h-4 w-4" />
              <span>Active Badges</span>
            </div>
            <AnimatedNumber value={stats.active_badges} className="mt-1 block text-2xl font-bold text-blue-900" />
          </div>
          <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4">
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Sparkles className="h-4 w-4" />
              <span>Top Badge</span>
            </div>
            <p className="mt-1 truncate text-lg font-bold text-purple-900">{stats.most_popular_badge || 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <Crown className="h-4 w-4" />
              <span>Top Earner</span>
            </div>
            <p className="mt-1 truncate text-lg font-bold text-emerald-900">{stats.top_earner_name || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Category Filter (shared by leaderboard and badges tabs) */}
      {(activeTab === 'leaderboard' || activeTab === 'badges') && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                categoryFilter === cat.value
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ============ LEADERBOARD TAB ============ */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {loadingLeaderboard ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
              <Trophy className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No awards given yet. Start by creating badges and granting awards!</p>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div className="flex items-end justify-center gap-4 py-4">
                {/* 2nd place */}
                {podium[1] && (
                  <div className="flex flex-col items-center">
                    <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-2xl font-bold text-slate-600 shadow-lg">
                      2
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{podium[1].camper_name}</p>
                    <p className="text-xs text-gray-500">{podium[1].total_points} pts</p>
                    <p className="text-xs text-gray-400">{podium[1].badge_count} badges</p>
                    <div className="mt-2 h-20 w-24 rounded-t-lg bg-gradient-to-t from-slate-200 to-slate-100" />
                  </div>
                )}
                {/* 1st place */}
                {podium[0] && (
                  <div className="flex flex-col items-center">
                    <Crown className="mb-1 h-6 w-6 text-amber-500" />
                    <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-200 text-3xl font-bold text-amber-700 shadow-xl">
                      1
                    </div>
                    <p className="text-base font-bold text-gray-900">{podium[0].camper_name}</p>
                    <p className="text-sm font-semibold text-amber-600">{podium[0].total_points} pts</p>
                    <p className="text-xs text-gray-400">{podium[0].badge_count} badges</p>
                    <div className="mt-2 h-28 w-28 rounded-t-lg bg-gradient-to-t from-amber-300 to-amber-100" />
                  </div>
                )}
                {/* 3rd place */}
                {podium[2] && (
                  <div className="flex flex-col items-center">
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-amber-600 bg-gradient-to-br from-amber-100 to-orange-200 text-xl font-bold text-amber-800 shadow-lg">
                      3
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{podium[2].camper_name}</p>
                    <p className="text-xs text-gray-500">{podium[2].total_points} pts</p>
                    <p className="text-xs text-gray-400">{podium[2].badge_count} badges</p>
                    <div className="mt-2 h-14 w-20 rounded-t-lg bg-gradient-to-t from-amber-200 to-orange-100" />
                  </div>
                )}
              </div>

              {/* Rest of leaderboard */}
              {restOfLeaderboard.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white">
                  <div className="divide-y divide-gray-100">
                    {restOfLeaderboard.map((entry) => (
                      <div key={entry.camper_id} className="flex items-center gap-4 px-4 py-3">
                        <span className="w-8 text-center text-sm font-bold text-gray-400">#{entry.rank}</span>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                          {entry.camper_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{entry.camper_name}</p>
                          <p className="text-xs text-gray-500">{entry.badge_count} badges</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden w-32 sm:block">
                            <div className="h-2 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                                style={{ width: `${Math.max((entry.total_points / maxPoints) * 100, 5)}%` }}
                              />
                            </div>
                          </div>
                          <span className="min-w-[60px] text-right text-sm font-semibold text-amber-600">
                            {entry.total_points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============ BADGES TAB ============ */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{badges.length} badge{badges.length !== 1 ? 's' : ''}</p>
            <button
              onClick={() => { setEditingBadge(null); setShowBadgeModal(true) }}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />
              Create Badge
            </button>
          </div>

          {loadingBadges ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : badges.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
              <Award className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No badges created yet. Create your first badge to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-amber-200 hover:shadow-md"
                  onClick={() => setSelectedBadge(badge)}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl"
                      style={{ backgroundColor: badge.color + '20' }}
                    >
                      {badge.icon}
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingBadge(badge); setShowBadgeModal(true) }}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit"
                      >
                        <Target className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBadge(badge) }}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold text-gray-900">{badge.name}</h3>
                  {badge.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{badge.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase', categoryColors[badge.category] || 'bg-gray-50 text-gray-600')}>
                      {badge.category}
                    </span>
                    <span className="text-xs font-medium text-amber-600">{badge.points} pts</span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                      <Users className="h-3 w-3" />
                      {badge.times_awarded || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ RECENT ACTIVITY TAB ============ */}
      {activeTab === 'recent' && (
        <div className="space-y-4">
          {loadingRecent ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : recentAwards.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No awards granted yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="divide-y divide-gray-100">
                {recentAwards.map((award) => (
                  <div key={award.id} className="flex items-start gap-3 px-4 py-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
                      style={{ backgroundColor: award.badge_color + '20' }}
                    >
                      {award.badge_icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{award.granted_by_name}</span>
                        {' awarded '}
                        <span className="font-semibold" style={{ color: award.badge_color }}>{award.badge_name}</span>
                        {' to '}
                        <span className="font-medium">{award.camper_name}</span>
                      </p>
                      {award.reason && (
                        <p className="mt-0.5 text-xs text-gray-500 italic">&ldquo;{award.reason}&rdquo;</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {new Date(award.granted_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ GIVE AWARD TAB ============ */}
      {activeTab === 'give' && (
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Step 1: Select Camper */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">1</span>
              Select Camper
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={selectedCamperName || camperSearch}
                onChange={(e) => {
                  setCamperSearch(e.target.value)
                  setSelectedCamperId('')
                  setSelectedCamperName('')
                  setShowCamperDropdown(true)
                }}
                onFocus={() => setShowCamperDropdown(true)}
                placeholder="Search for a camper..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {selectedCamperId && (
                <button
                  onClick={() => { setSelectedCamperId(''); setSelectedCamperName(''); setCamperSearch('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {showCamperDropdown && camperSearch && !selectedCamperId && camperResults.length > 0 && (
                <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border bg-white py-1 shadow-lg">
                  {camperResults.map((c: { id: string; first_name: string; last_name: string }) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCamperId(c.id)
                        setSelectedCamperName(`${c.first_name} ${c.last_name}`)
                        setCamperSearch('')
                        setShowCamperDropdown(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-amber-50"
                    >
                      {c.first_name} {c.last_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Badge */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">2</span>
              Select Badge
            </h3>
            {allBadgesForGrant.length === 0 ? (
              <p className="text-sm text-gray-500">No badges available. Create some first!</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {allBadgesForGrant.map((badge) => (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setSelectedBadgeForGrant(badge)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 text-left transition-all',
                      selectedBadgeForGrant?.id === badge.id
                        ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{badge.name}</p>
                      <p className="text-xs text-amber-600">{badge.points} pts</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Reason */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">3</span>
              Add a Reason <span className="text-gray-400 font-normal">(optional)</span>
            </h3>
            <textarea
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
              rows={3}
              placeholder="Why are they receiving this award?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Preview & Confirm */}
          {selectedCamperId && selectedBadgeForGrant && (
            <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <h3 className="mb-4 text-sm font-semibold text-amber-800">Award Preview</h3>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                  style={{ backgroundColor: selectedBadgeForGrant.color + '30', border: `3px solid ${selectedBadgeForGrant.color}` }}
                >
                  {selectedBadgeForGrant.icon}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{selectedBadgeForGrant.name}</p>
                  <p className="text-sm text-gray-600">
                    Awarding to <span className="font-semibold">{selectedCamperName}</span>
                  </p>
                  <p className="text-sm font-medium text-amber-600">+{selectedBadgeForGrant.points} points</p>
                </div>
              </div>
              <button
                onClick={handleGrantAward}
                disabled={grantAward.isPending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
              >
                {grantAward.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Award className="h-4 w-4" />
                )}
                Grant Award
              </button>
            </div>
          )}
        </div>
      )}

      {/* Badge Form Modal */}
      {showBadgeModal && (
        <BadgeFormModal
          badge={editingBadge}
          onClose={() => { setShowBadgeModal(false); setEditingBadge(null) }}
          onSave={handleSaveBadge}
          isSaving={createBadge.isPending || updateBadge.isPending}
        />
      )}

      {/* Recipients Modal */}
      {selectedBadge && (
        <RecipientsModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  )
}
