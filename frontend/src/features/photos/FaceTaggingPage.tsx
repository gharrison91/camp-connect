/**
 * Camp Connect - Face Tagging Management Page
 * Staff can review auto-detected faces and tag them with camper identities.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Camera,
  User,
  UserCheck,
  UserX,
  Search,
  Check,
  X,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useUntaggedFaces,
  useFaceSuggestions,
  useFaceTagStats,
  useTagFace,
  useDismissFace,
  useBatchAutoTag,
} from '@/hooks/useFaceTagging'
import { useCampers } from '@/hooks/useCampers'
import type { DetectedFace, FaceSuggestion } from '@/types'

// ─── Filter Type ────────────────────────────────────────────

type FilterStatus = 'all' | 'untagged' | 'tagged' | 'dismissed'

// ─── Skeleton Loader ────────────────────────────────────────

function FaceCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 aspect-square rounded-lg bg-gray-200" />
      <div className="mb-2 h-4 w-2/3 rounded bg-gray-200" />
      <div className="mb-3 h-3 w-1/2 rounded bg-gray-200" />
      <div className="flex gap-2">
        <div className="h-7 w-20 rounded-full bg-gray-200" />
        <div className="h-7 w-20 rounded-full bg-gray-200" />
      </div>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: typeof BarChart3
  color: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-50 text-gray-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorMap[color] || colorMap.gray}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

// ─── Camper Search Modal ────────────────────────────────────

function CamperSearchModal({
  onSelect,
  onClose,
}: {
  onSelect: (camperId: string, camperName: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: camperData } = useCampers({
    search: search || undefined,
    limit: 20,
  })

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const campers = camperData?.items ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Camper</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search campers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Camper list */}
        <div className="max-h-72 overflow-y-auto px-2 py-2">
          {campers.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              {search ? 'No campers found' : 'Type to search campers'}
            </p>
          ) : (
            campers.map((camper) => (
                <button
                  key={camper.id}
                  onClick={() =>
                    onSelect(
                      camper.id,
                      `${camper.first_name} ${camper.last_name}`
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-emerald-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    {camper.reference_photo_url ? (
                      <img
                        src={camper.reference_photo_url}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {camper.first_name} {camper.last_name}
                  </span>
                </button>
              ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Face Card ──────────────────────────────────────────────

function FaceCard({
  face,
  onTag,
  onDismiss,
  onManualTag,
  onViewPhoto,
}: {
  face: DetectedFace
  onTag: (faceId: string, camperId: string, camperName: string) => void
  onDismiss: (faceId: string) => void
  onManualTag: (faceId: string) => void
  onViewPhoto: (face: DetectedFace) => void
}) {
  const { data: suggestions } = useFaceSuggestions(
    face.status === 'untagged' ? face.id : null
  )

  const statusBorderColor =
    face.status === 'tagged'
      ? 'border-emerald-400'
      : face.status === 'dismissed'
        ? 'border-gray-300'
        : 'border-amber-400'

  const statusBadge =
    face.status === 'tagged' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <UserCheck className="h-3 w-3" /> Tagged
      </span>
    ) : face.status === 'dismissed' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        <UserX className="h-3 w-3" /> Dismissed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        <User className="h-3 w-3" /> Untagged
      </span>
    )

  const confidenceColor =
    face.confidence >= 0.9
      ? 'text-emerald-600'
      : face.confidence >= 0.6
        ? 'text-amber-600'
        : 'text-red-500'

  return (
    <div className="group rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Photo with bounding box */}
      <div className="relative overflow-hidden rounded-t-xl">
        <div className="aspect-square bg-gray-100">
          {face.photo_url ? (
            <div className="relative h-full w-full">
              <img
                src={face.photo_url}
                alt="Detected face"
                className="h-full w-full object-cover"
              />
              {/* Bounding box overlay */}
              <div
                className={`absolute border-2 ${statusBorderColor} rounded`}
                style={{
                  left: `${face.face_bbox.x * 100}%`,
                  top: `${face.face_bbox.y * 100}%`,
                  width: `${face.face_bbox.width * 100}%`,
                  height: `${face.face_bbox.height * 100}%`,
                }}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Camera className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* View photo button overlay */}
        <button
          onClick={() => onViewPhoto(face)}
          className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Status + confidence */}
        <div className="mb-3 flex items-center justify-between">
          {statusBadge}
          <span className={`text-xs font-semibold ${confidenceColor}`}>
            {Math.round(face.confidence * 100)}% conf.
          </span>
        </div>

        {/* Tagged camper name */}
        {face.status === 'tagged' && face.camper_name && (
          <p className="mb-3 text-sm font-medium text-gray-900">
            {face.camper_name}
          </p>
        )}

        {/* Date */}
        <p className="mb-3 text-xs text-gray-400">
          {new Date(face.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>

        {/* Suggestions (only for untagged) */}
        {face.status === 'untagged' && suggestions && suggestions.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-gray-500">
              Suggested matches:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s: FaceSuggestion) => (
                <button
                  key={s.camper_id}
                  onClick={() => onTag(face.id, s.camper_id, s.camper_name)}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <Check className="h-3 w-3" />
                  {s.camper_name}
                  <span className="text-emerald-500">
                    {Math.round(s.confidence * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {face.status === 'untagged' && (
          <div className="flex gap-2">
            <button
              onClick={() => onManualTag(face.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Search className="h-3.5 w-3.5" />
              Tag as...
            </button>
            <button
              onClick={() => onDismiss(face.id)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <UserX className="h-3.5 w-3.5" />
              Not a camper
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Photo Lightbox ─────────────────────────────────────────

function PhotoLightbox({
  face,
  onClose,
}: {
  face: DetectedFace
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>
      <div className="relative max-h-[85vh] max-w-[85vw]">
        <img
          src={face.photo_url}
          alt="Full photo"
          className="max-h-[85vh] rounded-lg object-contain"
        />
        {/* Bounding box */}
        <div
          className="absolute rounded border-2 border-emerald-400"
          style={{
            left: `${face.face_bbox.x * 100}%`,
            top: `${face.face_bbox.y * 100}%`,
            width: `${face.face_bbox.width * 100}%`,
            height: `${face.face_bbox.height * 100}%`,
          }}
        />
        {face.camper_name && (
          <div
            className="absolute rounded bg-emerald-500 px-2 py-1 text-xs font-medium text-white"
            style={{
              left: `${face.face_bbox.x * 100}%`,
              top: `${(face.face_bbox.y + face.face_bbox.height) * 100}%`,
            }}
          >
            {face.camper_name}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────

export function FaceTaggingPage() {
  const { toast } = useToast()

  // State
  const [filter, setFilter] = useState<FilterStatus>('untagged')
  const [page, setPage] = useState(1)
  const [manualTagFaceId, setManualTagFaceId] = useState<string | null>(null)
  const [lightboxFace, setLightboxFace] = useState<DetectedFace | null>(null)
  const perPage = 12

  // Queries
  const { data: facesData, isLoading: facesLoading } = useUntaggedFaces(page, perPage)
  const { data: stats, isLoading: statsLoading } = useFaceTagStats()

  // Mutations
  const tagFace = useTagFace()
  const dismissFace = useDismissFace()
  const batchAutoTag = useBatchAutoTag()

  // Derived data
  const faces = facesData?.faces ?? []
  const totalFaces = facesData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalFaces / perPage))

  // Filter faces locally based on status filter
  const filteredFaces = useMemo(() => {
    if (filter === 'all') return faces
    return faces.filter((f) => f.status === filter)
  }, [faces, filter])

  // Progress percentage
  const progressPercent = stats
    ? stats.total_faces > 0
      ? Math.round((stats.tagged / stats.total_faces) * 100)
      : 0
    : 0

  // Handlers
  const handleTag = useCallback(
    (faceId: string, camperId: string, camperName: string) => {
      tagFace.mutate(
        { faceId, camperId },
        {
          onSuccess: () => {
            toast({
              type: 'success',
              message: `Tagged face as ${camperName}`,
            })
          },
          onError: () => {
            toast({ type: 'error', message: 'Failed to tag face' })
          },
        }
      )
    },
    [tagFace, toast]
  )

  const handleDismiss = useCallback(
    (faceId: string) => {
      dismissFace.mutate(faceId, {
        onSuccess: () => {
          toast({ type: 'success', message: 'Face dismissed' })
        },
        onError: () => {
          toast({ type: 'error', message: 'Failed to dismiss face' })
        },
      })
    },
    [dismissFace, toast]
  )

  const handleManualTagSelect = useCallback(
    (camperId: string, camperName: string) => {
      if (!manualTagFaceId) return
      handleTag(manualTagFaceId, camperId, camperName)
      setManualTagFaceId(null)
    },
    [manualTagFaceId, handleTag]
  )

  const handleBatchAutoTag = useCallback(() => {
    batchAutoTag.mutate(
      { minConfidence: 0.9, action: 'tag' },
      {
        onSuccess: (data) => {
          toast({
            type: 'success',
            message: `Auto-tagged ${data.tagged} high-confidence faces`,
          })
        },
        onError: () => {
          toast({ type: 'error', message: 'Batch auto-tag failed' })
        },
      }
    )
  }, [batchAutoTag, toast])

  const handleBatchDismiss = useCallback(() => {
    batchAutoTag.mutate(
      { minConfidence: 0.3, action: 'dismiss' },
      {
        onSuccess: (data) => {
          toast({
            type: 'success',
            message: `Dismissed ${data.dismissed} low-confidence faces`,
          })
        },
        onError: () => {
          toast({ type: 'error', message: 'Batch dismiss failed' })
        },
      }
    )
  }, [batchAutoTag, toast])

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Face Tagging</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and tag detected faces in camp photos
          </p>
        </div>

        {/* Batch actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleBatchAutoTag}
            disabled={batchAutoTag.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            {batchAutoTag.isPending ? 'Processing...' : 'Auto-tag High Confidence'}
          </button>
          <button
            onClick={handleBatchDismiss}
            disabled={batchAutoTag.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <UserX className="h-4 w-4" />
            Dismiss Low Confidence
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Tagging Progress
          </span>
          <span className="text-sm font-semibold text-emerald-600">
            {progressPercent}% complete
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {stats && (
          <p className="mt-2 text-xs text-gray-400">
            {stats.tagged} of {stats.total_faces} faces tagged
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-white shadow-sm"
            />
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Total Detected"
              value={stats.total_faces}
              icon={Camera}
              color="blue"
            />
            <StatCard
              label="Tagged"
              value={stats.tagged}
              icon={UserCheck}
              color="emerald"
            />
            <StatCard
              label="Untagged"
              value={stats.untagged}
              icon={User}
              color="amber"
            />
            <StatCard
              label="Dismissed"
              value={stats.dismissed}
              icon={UserX}
              color="gray"
            />
            <StatCard
              label="Accuracy Rate"
              value={`${Math.round(stats.accuracy_rate * 100)}%`}
              icon={Sparkles}
              color="purple"
            />
          </>
        ) : null}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'untagged', label: 'Untagged' },
            { key: 'tagged', label: 'Tagged' },
            { key: 'dismissed', label: 'Dismissed' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key)
              setPage(1)
            }}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Face cards grid */}
      {facesLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <FaceCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredFaces.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-20 shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <UserCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">
            {filter === 'untagged'
              ? 'All faces have been tagged!'
              : 'No faces found'}
          </h3>
          <p className="text-sm text-gray-500">
            {filter === 'untagged'
              ? 'Great job! All detected faces have been reviewed.'
              : `No ${filter} faces to display. Try a different filter.`}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all faces
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFaces.map((face) => (
            <FaceCard
              key={face.id}
              face={face}
              onTag={handleTag}
              onDismiss={handleDismiss}
              onManualTag={setManualTagFaceId}
              onViewPhoto={setLightboxFace}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Manual tag modal */}
      {manualTagFaceId && (
        <CamperSearchModal
          onSelect={handleManualTagSelect}
          onClose={() => setManualTagFaceId(null)}
        />
      )}

      {/* Photo lightbox */}
      {lightboxFace && (
        <PhotoLightbox
          face={lightboxFace}
          onClose={() => setLightboxFace(null)}
        />
      )}
    </div>
  )
}
