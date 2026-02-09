/**
 * Camp Connect - PortalPhotos
 * Photo gallery for parent portal.
 */

import { useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { usePortalPhotos } from '@/hooks/usePortal'

export function PortalPhotos() {
  const { data: photos = [], isLoading } = usePortalPhotos()
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
        <Camera className="h-8 w-8 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-900">No photos yet</p>
        <p className="mt-1 text-sm text-gray-500">Photos of your campers will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Photos</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo: any) => (
          <button
            key={photo.id}
            onClick={() => setLightboxPhoto(photo)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm transition-all hover:shadow-md"
          >
            <img
              src={photo.url || photo.file_path}
              alt={photo.caption || photo.file_name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <p className="text-xs text-white truncate">{photo.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxPhoto.url || lightboxPhoto.file_path}
            alt={lightboxPhoto.caption || lightboxPhoto.file_name}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
