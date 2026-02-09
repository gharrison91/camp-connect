import { useState } from 'react'
import { Camera, ExternalLink, X } from 'lucide-react'
import { useCamperPhotos } from '@/hooks/useFaceRecognition'
import { FaceTagBadge } from './FaceTagBadge'
import type { CamperPhoto } from '@/hooks/useFaceRecognition'

interface CamperPhotoGalleryProps {
  camperId: string
  camperName: string
}

// ─── Skeleton Card ──────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="aspect-square bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
  )
}

// ─── Photo Lightbox Modal ───────────────────────────────────

function PhotoLightbox({
  photo,
  camperName,
  onClose,
}: {
  photo: CamperPhoto
  camperName: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <div className="flex items-center justify-center overflow-hidden rounded-t-xl bg-gray-900">
          <img
            src={photo.photo_url}
            alt={photo.caption || `Photo of ${camperName}`}
            className="max-h-[70vh] w-full object-contain"
          />
        </div>

        {/* Details footer */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0 flex-1">
            {photo.caption && (
              <p className="truncate text-sm font-medium text-gray-900">
                {photo.caption}
              </p>
            )}
            <p className="mt-0.5 text-xs text-gray-500">
              {new Date(photo.taken_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <FaceTagBadge
            camperName={camperName}
            confidence={photo.confidence}
            similarity={photo.similarity}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Gallery Component ──────────────────────────────────────

export function CamperPhotoGallery({
  camperId,
  camperName,
}: CamperPhotoGalleryProps) {
  const { data: photos, isLoading, error } = useCamperPhotos(camperId)
  const [selectedPhoto, setSelectedPhoto] = useState<CamperPhoto | null>(null)

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Photos of {camperName}
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Photos of {camperName}
        </h3>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load photos. Please try again.
        </div>
      </div>
    )
  }

  // Empty state
  if (!photos || photos.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Photos of {camperName}
        </h3>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Camera className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No photos found for this camper
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Photos will appear here once {camperName} is detected in uploaded images.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Photos of {camperName}
        </h3>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </span>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.photo_id}
            onClick={() => setSelectedPhoto(photo)}
            className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
          >
            {/* Thumbnail */}
            <div className="relative aspect-square bg-gray-100">
              <img
                src={photo.thumbnail_url || photo.photo_url}
                alt={photo.caption || `Photo of ${camperName}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Hover overlay with open-external icon */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                <ExternalLink className="h-6 w-6 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 p-3">
              {/* Date */}
              <p className="text-xs text-gray-500">
                {new Date(photo.taken_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              {/* Confidence badge */}
              <FaceTagBadge
                camperName={camperName}
                confidence={photo.confidence}
                similarity={photo.similarity}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          camperName={camperName}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}
