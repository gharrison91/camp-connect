import { useState, useCallback, useRef } from 'react'
import {
  Camera,
  Upload,
  Search,
  Loader2,
  Image as ImageIcon,
  X,
  Trash2,
  ScanFace,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePhotos, useUploadPhoto, useDeletePhoto } from '@/hooks/usePhotos'
import { usePhotoFaceTags, useReprocessPhoto } from '@/hooks/useFaceRecognition'
import { usePermissions } from '@/hooks/usePermissions'
import { FaceTagOverlay } from './components/FaceTagOverlay'
import type { Photo, FaceTag } from '@/types'

const categoryConfig: Record<string, { label: string; color: string }> = {
  camper: { label: 'Camper', color: 'bg-blue-100 text-blue-700' },
  event: { label: 'Event', color: 'bg-emerald-100 text-emerald-700' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-700' },
}

export function PhotosPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const { hasPermission } = usePermissions()

  const { data: photos = [], isLoading, error } = usePhotos({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  })

  const filteredPhotos = searchQuery
    ? photos.filter(
        (p) =>
          p.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.caption?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : photos

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Photos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage camp photos for campers and events
          </p>
        </div>
        {hasPermission('photos.media.upload') && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Upload className="h-4 w-4" />
            Upload Photos
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {['all', 'camper', 'event', 'general'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                categoryFilter === cat
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {cat === 'all' ? 'All' : categoryConfig[cat]?.label || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load photos. Please try again.
        </div>
      )}

      {/* Photo Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
            >
              <div className="relative aspect-square bg-gray-100">
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt={photo.caption || photo.file_name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      categoryConfig[photo.category]?.color || 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {categoryConfig[photo.category]?.label || photo.category}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-gray-900">
                  {photo.caption || photo.file_name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredPhotos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Camera className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No photos yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Upload your first photo to get started
          </p>
          {hasPermission('photos.media.upload') && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Upload className="h-4 w-4" />
              Upload Photo
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <PhotoUploadModal onClose={() => setShowUploadModal(false)} />
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}

// ─── Upload Modal ────────────────────────────────────────────

function PhotoUploadModal({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState('general')
  const [caption, setCaption] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const uploadPhoto = useUploadPhoto()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const imageFiles = Array.from(newFiles).filter((f) =>
      f.type.startsWith('image/')
    )
    setFiles((prev) => [...prev, ...imageFiles])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadPhoto.mutateAsync({
          file: files[i],
          category,
          caption: caption || undefined,
        })
        setUploadProgress(((i + 1) / files.length) * 100)
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    setUploading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Upload Photos</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
              dragOver
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-gray-50'
            )}
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag & drop images here, or{' '}
              <label className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-700">
                browse
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </p>
          </div>

          {/* File previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {files.map((file, i) => (
                <div key={i} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="general">General</option>
              <option value="camper">Camper</option>
              <option value="event">Event</option>
            </select>
          </div>

          {/* Caption */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload {files.length > 0 ? `(${files.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ────────────────────────────────────────────

function PhotoDetailModal({
  photo,
  onClose,
}: {
  photo: Photo
  onClose: () => void
}) {
  const deletePhoto = useDeletePhoto()
  const reprocessPhoto = useReprocessPhoto()
  const { hasPermission } = usePermissions()
  const { data: hookFaceTags = [], isLoading: faceTagsLoading } = usePhotoFaceTags(photo.id)
  const [showFaceTags, setShowFaceTags] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })

  // Map hook FaceTag (lowercase keys) to @/types FaceTag (capitalized keys)
  const faceTags: FaceTag[] = hookFaceTags.map((t) => ({
    id: t.id,
    photo_id: t.photo_id,
    camper_id: t.camper_id,
    camper_name: t.camper_name,
    face_id: null,
    bounding_box: t.bounding_box
      ? { Left: t.bounding_box.left, Top: t.bounding_box.top, Width: t.bounding_box.width, Height: t.bounding_box.height }
      : null,
    confidence: t.confidence,
    similarity: t.similarity,
    created_at: t.created_at,
  }))

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    await deletePhoto.mutateAsync(photo.id)
    onClose()
  }

  const handleDetectFaces = async () => {
    await reprocessPhoto.mutateAsync(photo.id)
    setShowFaceTags(true)
  }

  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgDimensions({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="flex items-center justify-center bg-gray-900 md:w-2/3">
            {photo.url ? (
              showFaceTags && faceTags.length > 0 ? (
                <FaceTagOverlay
                  photoUrl={photo.url}
                  faceTags={faceTags}
                  imageWidth={imgDimensions.width || 500}
                  imageHeight={imgDimensions.height || 375}
                />
              ) : (
                <img
                  ref={imgRef}
                  src={photo.url}
                  alt={photo.caption || photo.file_name}
                  className="max-h-[500px] w-full object-contain"
                  onLoad={handleImageLoad}
                />
              )
            ) : (
              <div className="flex h-64 items-center justify-center">
                <ImageIcon className="h-16 w-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4 p-6 md:w-1/3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {photo.caption || photo.file_name}
              </h3>
              <span
                className={cn(
                  'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                  categoryConfig[photo.category]?.color
                )}
              >
                {categoryConfig[photo.category]?.label}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">File name</span>
                <span className="truncate pl-2 text-gray-900">{photo.file_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Size</span>
                <span className="text-gray-900">{formatFileSize(photo.file_size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Uploaded</span>
                <span className="text-gray-900">
                  {new Date(photo.created_at).toLocaleDateString()}
                </span>
              </div>
              {faceTags.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Faces</span>
                  <span className="text-gray-900">{faceTags.length} detected</span>
                </div>
              )}
            </div>

            {/* Face Detection */}
            <div className="space-y-2">
              <button
                onClick={handleDetectFaces}
                disabled={reprocessPhoto.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                {reprocessPhoto.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanFace className="h-4 w-4" />
                )}
                {reprocessPhoto.isPending ? 'Detecting...' : 'Detect Faces'}
              </button>

              {faceTags.length > 0 && (
                <button
                  onClick={() => setShowFaceTags(!showFaceTags)}
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    showFaceTags
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {showFaceTags ? 'Hide Face Tags' : 'Show Face Tags'}
                </button>
              )}
            </div>

            {hasPermission('photos.media.delete') && (
              <button
                onClick={handleDelete}
                disabled={deletePhoto.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
