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
  Filter,
  CheckSquare,
  Square,
  Download,
  FolderOpen,
  Plus,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePhotos, useUploadPhoto, useDeletePhoto } from '@/hooks/usePhotos'
import { useEvents } from '@/hooks/useEvents'
import { useActivities } from '@/hooks/useActivities'
import { useCampers } from '@/hooks/useCampers'
import { usePhotoFaceTags, useReprocessPhoto, useBulkReprocessPhotos } from '@/hooks/useFaceRecognition'
import { useToast } from '@/components/ui/Toast'
import { usePermissions } from '@/hooks/usePermissions'
import { FaceTagOverlay } from './components/FaceTagOverlay'
import {
  usePhotoAlbums,
  useCreatePhotoAlbum,
  useDeletePhotoAlbum,
  useAddPhotosToAlbum,
} from '@/hooks/usePhotoAlbums'
import type { PhotoAlbum } from '@/hooks/usePhotoAlbums'
import type { Photo, FaceTag } from '@/types'

const categoryConfig: Record<string, { label: string; color: string }> = {
  camper: { label: 'Camper', color: 'bg-blue-100 text-blue-700' },
  event: { label: 'Event', color: 'bg-emerald-100 text-emerald-700' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-700' },
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const YEARS = [2024, 2025, 2026]

type ViewTab = 'photos' | 'albums'

export function PhotosPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ViewTab>('photos')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const { hasPermission } = usePermissions()
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const bulkReprocess = useBulkReprocessPhotos()
  const [bulkProgress, setBulkProgress] = useState<{ show: boolean; result?: { total: number; processed: number; matches_found: number; errors: number } }>({ show: false })

  // Album state
  const [albumSearch, setAlbumSearch] = useState('')
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false)
  const [showAddToAlbumModal, setShowAddToAlbumModal] = useState(false)
  const [expandedAlbum, setExpandedAlbum] = useState<PhotoAlbum | null>(null)

  // Album hooks
  const { data: albums = [], isLoading: albumsLoading } = usePhotoAlbums(
    albumSearch ? { search: albumSearch } : undefined
  )
  const deleteAlbum = useDeletePhotoAlbum()
  const addPhotosToAlbum = useAddPhotosToAlbum()

  // Album photos - fetch photos filtered by album's event when viewing an album
  const { data: albumPhotos = [], isLoading: albumPhotosLoading } = usePhotos(
    expandedAlbum ? { event_id: expandedAlbum.event_id || undefined } : { event_id: '__none__' }
  )

  const { data: events = [] } = useEvents()
  const { data: activities = [] } = useActivities()

  const toggleSelect = (photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredPhotos.map((p) => p.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleBulkAnalyze = async (photoIds: string[] | null) => {
    setBulkProgress({ show: true })
    try {
      const result = await bulkReprocess.mutateAsync(photoIds)
      setBulkProgress({ show: true, result })
      toast({ type: 'success', message: `Analyzed ${result.processed} photos, found ${result.matches_found} face matches` })
    } catch {
      toast({ type: 'error', message: 'Bulk analysis failed' })
      setBulkProgress({ show: false })
    }
  }

  const [downloading, setDownloading] = useState(false)

  const handleBulkDownload = async (photoIds?: string[]) => {
    const photosToDownload = photoIds
      ? filteredPhotos.filter((p) => photoIds.includes(p.id))
      : filteredPhotos
    if (photosToDownload.length === 0) return
    setDownloading(true)
    let downloaded = 0
    for (const photo of photosToDownload) {
      try {
        const response = await fetch(photo.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = photo.file_name || `photo-${photo.id}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        downloaded++
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch {
        // Skip failed downloads
      }
    }
    setDownloading(false)
    toast({ type: 'success', message: `Downloaded ${downloaded} photo${downloaded !== 1 ? 's' : ''}` })
  }

  const [eventFilter, setEventFilter] = useState<string>('')
  const [activityFilter, setActivityFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<number | undefined>(undefined)
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined)
  const [camperSearch, setCamperSearch] = useState('')
  const [camperFilter, setCamperFilter] = useState<string>('')
  const [camperFilterName, setCamperFilterName] = useState('')
  const [showCamperDropdown, setShowCamperDropdown] = useState(false)

  const { data: campersData } = useCampers(camperSearch ? { search: camperSearch, limit: 10 } : undefined)
  const camperResults = campersData?.items ?? []

  const { data: photos = [], isLoading, error } = usePhotos({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    event_id: eventFilter || undefined,
    activity_id: activityFilter || undefined,
    month: monthFilter,
    year: yearFilter,
    camper_id: camperFilter || undefined,
  })

  const filteredPhotos = searchQuery
    ? photos.filter((p) => p.file_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.caption?.toLowerCase().includes(searchQuery.toLowerCase()))
    : photos

  const activeFilters: { key: string; label: string }[] = []
  if (eventFilter) { const ev = events.find((e) => e.id === eventFilter); activeFilters.push({ key: 'event', label: `Event: ${ev?.name || 'Unknown'}` }) }
  if (activityFilter) { const act = activities.find((a) => a.id === activityFilter); activeFilters.push({ key: 'activity', label: `Activity: ${act?.name || 'Unknown'}` }) }
  if (monthFilter) { const monthName = MONTHS.find((m) => m.value === monthFilter)?.label; activeFilters.push({ key: 'month', label: `Month: ${monthName}` }) }
  if (yearFilter) { activeFilters.push({ key: 'year', label: `Year: ${yearFilter}` }) }
  if (camperFilter) { activeFilters.push({ key: 'camper', label: `Camper: ${camperFilterName}` }) }

  const clearFilter = (key: string) => {
    switch (key) {
      case 'event': setEventFilter(''); break
      case 'activity': setActivityFilter(''); break
      case 'month': setMonthFilter(undefined); break
      case 'year': setYearFilter(undefined); break
      case 'camper': setCamperFilter(''); setCamperFilterName(''); setCamperSearch(''); break
    }
  }

  const handleAddToAlbum = async (albumId: string) => {
    if (selectedIds.size === 0) return
    try {
      await addPhotosToAlbum.mutateAsync({ albumId, photoIds: Array.from(selectedIds) })
      toast({ type: 'success', message: `Added ${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''} to album` })
      setShowAddToAlbumModal(false)
      setSelectMode(false)
      setSelectedIds(new Set())
    } catch {
      toast({ type: 'error', message: 'Failed to add photos to album' })
    }
  }

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('Are you sure you want to delete this album? Photos will not be deleted.')) return
    try {
      await deleteAlbum.mutateAsync(albumId)
      toast({ type: 'success', message: 'Album deleted' })
      if (expandedAlbum?.id === albumId) setExpandedAlbum(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete album' })
    }
  }

  const filteredAlbums = albumSearch
    ? albums.filter((a) => a.name.toLowerCase().includes(albumSearch.toLowerCase()))
    : albums

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Photos</h1>
          <p className="mt-1 text-sm text-gray-500">Upload and manage camp photos for campers and events</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'photos' && (
            <>
              <button
                onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()) }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                  selectMode
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                {selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {selectMode ? 'Cancel Select' : 'Multi-Select'}
              </button>
              <button
                onClick={() => handleBulkDownload()}
                disabled={downloading || filteredPhotos.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download All ({filteredPhotos.length})
              </button>
              <button
                onClick={() => handleBulkAnalyze(null)}
                disabled={bulkReprocess.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
              >
                {bulkReprocess.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
                Analyze All
              </button>
              {hasPermission('photos.media.upload') && (
                <button onClick={() => setShowUploadModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700">
                  <Upload className="h-4 w-4" />Upload Photos
                </button>
              )}
            </>
          )}
          {activeTab === 'albums' && !expandedAlbum && (
            <button
              onClick={() => setShowCreateAlbumModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />Create Album
            </button>
          )}
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        <button
          onClick={() => { setActiveTab('photos'); setExpandedAlbum(null) }}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'photos'
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <ImageIcon className="h-4 w-4" />
          All Photos
        </button>
        <button
          onClick={() => { setActiveTab('albums'); setSelectMode(false); setSelectedIds(new Set()) }}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'albums'
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <FolderOpen className="h-4 w-4" />
          Albums
        </button>
      </div>

      {/* ===================== ALL PHOTOS TAB ===================== */}
      {activeTab === 'photos' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search photos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
              {['all', 'camper', 'event', 'general'].map((cat) => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', categoryFilter === cat ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700')}>
                  {cat === 'all' ? 'All' : categoryConfig[cat]?.label || cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500"><Filter className="h-4 w-4" />Filters</div>
            <select value={monthFilter ?? ''} onChange={(e) => setMonthFilter(e.target.value ? Number(e.target.value) : undefined)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">All Months</option>
              {MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
            </select>
            <select value={yearFilter ?? ''} onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : undefined)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">All Years</option>
              {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
            <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">All Events</option>
              {events.map((ev) => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
            </select>
            <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">All Activities</option>
              {activities.map((act) => (<option key={act.id} value={act.id}>{act.name}</option>))}
            </select>
            <div className="relative">
              <input type="text" placeholder="Search camper..." value={camperFilter ? camperFilterName : camperSearch} onChange={(e) => { if (camperFilter) { setCamperFilter(''); setCamperFilterName('') } setCamperSearch(e.target.value); setShowCamperDropdown(true) }} onFocus={() => { if (camperSearch && !camperFilter) setShowCamperDropdown(true) }} onBlur={() => { setTimeout(() => setShowCamperDropdown(false), 200) }} className="w-44 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              {showCamperDropdown && camperSearch && camperResults.length > 0 && !camperFilter && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-56 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {camperResults.map((c) => (
                    <button key={c.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setCamperFilter(c.id); setCamperFilterName(`${c.first_name} ${c.last_name}`); setCamperSearch(''); setShowCamperDropdown(false) }} className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">{c.first_name} {c.last_name}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <span key={f.key} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  {f.label}<button onClick={() => clearFilter(f.key)} className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-100"><X className="h-3 w-3" /></button>
                </span>
              ))}
              <button onClick={() => { setEventFilter(''); setActivityFilter(''); setMonthFilter(undefined); setYearFilter(undefined); setCamperFilter(''); setCamperFilterName(''); setCamperSearch('') }} className="text-xs font-medium text-gray-500 hover:text-gray-700">Clear all</button>
            </div>
          )}

          {isLoading && (<div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>)}
          {error && (<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Failed to load photos. Please try again.</div>)}

          {!isLoading && !error && (
            <>
              {/* Select mode action bar */}
              {selectMode && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
                  <span className="text-sm font-medium text-blue-700">
                    {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''} selected
                  </span>
                  <button onClick={selectAll} className="text-xs font-medium text-blue-600 hover:text-blue-800">Select All</button>
                  <button onClick={deselectAll} className="text-xs font-medium text-blue-600 hover:text-blue-800">Deselect All</button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setShowAddToAlbumModal(true)}
                    disabled={selectedIds.size === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Add to Album ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => handleBulkDownload(Array.from(selectedIds))}
                    disabled={selectedIds.size === 0 || downloading}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download Selected ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => handleBulkAnalyze(Array.from(selectedIds))}
                    disabled={selectedIds.size === 0 || bulkReprocess.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {bulkReprocess.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
                    Analyze Selected ({selectedIds.size})
                  </button>
                </div>
              )}

              {/* Bulk progress result */}
              {bulkProgress.show && bulkProgress.result && (
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="text-sm text-emerald-700">
                    <strong>{bulkProgress.result.processed}</strong> photos analyzed,{' '}
                    <strong>{bulkProgress.result.matches_found}</strong> face matches found
                    {bulkProgress.result.errors > 0 && (
                      <span className="ml-2 text-amber-600">({bulkProgress.result.errors} errors)</span>
                    )}
                  </div>
                  <button onClick={() => setBulkProgress({ show: false })} className="rounded p-1 text-emerald-600 hover:bg-emerald-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredPhotos.map((photo) => {
                  const isSelected = selectedIds.has(photo.id)
                  return (
                    <div
                      key={photo.id}
                      onClick={() => selectMode ? toggleSelect(photo.id) : setSelectedPhoto(photo)}
                      className={cn(
                        'group cursor-pointer overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md',
                        selectMode && isSelected
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <div className="relative aspect-square bg-gray-100">
                        {photo.url ? (<img src={photo.url} alt={photo.caption || photo.file_name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />) : (<div className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-gray-300" /></div>)}
                        <div className="absolute right-2 top-2"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', categoryConfig[photo.category]?.color || 'bg-gray-100 text-gray-700')}>{categoryConfig[photo.category]?.label || photo.category}</span></div>
                        {selectMode && (
                          <div className="absolute left-2 top-2">
                            <div className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors',
                              isSelected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-white/80 bg-black/20 text-transparent'
                            )}>
                              {isSelected && <CheckSquare className="h-4 w-4" />}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3"><p className="truncate text-sm font-medium text-gray-900">{photo.caption || photo.file_name}</p><p className="mt-0.5 text-xs text-gray-500">{new Date(photo.created_at).toLocaleDateString()}</p></div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {!isLoading && !error && filteredPhotos.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
              <Camera className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">No photos yet</p>
              <p className="mt-1 text-sm text-gray-500">Upload your first photo to get started</p>
              {hasPermission('photos.media.upload') && (<button onClick={() => setShowUploadModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"><Upload className="h-4 w-4" />Upload Photo</button>)}
            </div>
          )}
        </>
      )}

      {/* ===================== ALBUMS TAB ===================== */}
      {activeTab === 'albums' && !expandedAlbum && (
        <>
          {/* Album search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search albums..."
              value={albumSearch}
              onChange={(e) => setAlbumSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {albumsLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          )}

          {!albumsLoading && filteredAlbums.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
              <FolderOpen className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">No albums yet</p>
              <p className="mt-1 text-sm text-gray-500">Create your first album to organize photos</p>
              <button
                onClick={() => setShowCreateAlbumModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />Create Album
              </button>
            </div>
          )}

          {!albumsLoading && filteredAlbums.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAlbums.map((album) => {
                const linkedEvent = album.event_id
                  ? events.find((e) => e.id === album.event_id)
                  : null
                return (
                  <div
                    key={album.id}
                    className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-300"
                    onClick={() => setExpandedAlbum(album)}
                  >
                    {/* Cover image */}
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {album.cover_photo_url ? (
                        <img
                          src={album.cover_photo_url}
                          alt={album.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2">
                          <FolderOpen className="h-10 w-10 text-gray-300" />
                          <span className="text-xs text-gray-400">No cover photo</span>
                        </div>
                      )}
                      {/* Photo count badge */}
                      <div className="absolute bottom-2 right-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                          <ImageIcon className="h-3 w-3" />
                          {album.photo_count}
                        </span>
                      </div>
                      {album.is_auto_generated && (
                        <div className="absolute left-2 top-2">
                          <span className="rounded-full bg-emerald-500/80 px-2 py-0.5 text-xs font-medium text-white">
                            Auto
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="truncate text-sm font-semibold text-gray-900">{album.name}</h3>
                      {album.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{album.description}</p>
                      )}
                      {linkedEvent && (
                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            {linkedEvent.name}
                          </span>
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(album.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id) }}
                          className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                          title="Delete album"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ===================== EXPANDED ALBUM VIEW ===================== */}
      {activeTab === 'albums' && expandedAlbum && (
        <>
          {/* Back navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandedAlbum(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Albums
            </button>
            <div className="flex-1" />
            <button
              onClick={() => handleDeleteAlbum(expandedAlbum.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Album
            </button>
          </div>

          {/* Album header */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {expandedAlbum.cover_photo_url ? (
                  <img
                    src={expandedAlbum.cover_photo_url}
                    alt={expandedAlbum.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FolderOpen className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{expandedAlbum.name}</h2>
                {expandedAlbum.description && (
                  <p className="mt-1 text-sm text-gray-500">{expandedAlbum.description}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                  <span>{expandedAlbum.photo_count} photo{expandedAlbum.photo_count !== 1 ? 's' : ''}</span>
                  <span>Created {new Date(expandedAlbum.created_at).toLocaleDateString()}</span>
                  {expandedAlbum.event_id && (() => {
                    const ev = events.find((e) => e.id === expandedAlbum.event_id)
                    return ev ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        {ev.name}
                      </span>
                    ) : null
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Album photos grid */}
          {albumPhotosLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          )}

          {!albumPhotosLoading && albumPhotos.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
              <Camera className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">No photos in this album</p>
              <p className="mt-1 text-sm text-gray-500">Add photos from the All Photos tab using multi-select</p>
            </div>
          )}

          {!albumPhotosLoading && albumPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {albumPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-200"
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
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', categoryConfig[photo.category]?.color || 'bg-gray-100 text-gray-700')}>
                        {categoryConfig[photo.category]?.label || photo.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-gray-900">{photo.caption || photo.file_name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{new Date(photo.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showUploadModal && <PhotoUploadModal onClose={() => setShowUploadModal(false)} />}
      {selectedPhoto && <PhotoDetailModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      {showCreateAlbumModal && (
        <CreateAlbumModal
          events={events}
          activities={activities}
          onClose={() => setShowCreateAlbumModal(false)}
        />
      )}
      {showAddToAlbumModal && (
        <AddToAlbumModal
          albums={albums}
          onSelect={handleAddToAlbum}
          isPending={addPhotosToAlbum.isPending}
          onClose={() => setShowAddToAlbumModal(false)}
        />
      )}
    </div>
  )
}

/* ===================== CREATE ALBUM MODAL ===================== */

function CreateAlbumModal({
  events,
  activities,
  onClose,
}: {
  events: { id: string; name: string }[]
  activities: { id: string; name: string }[]
  onClose: () => void
}) {
  const { toast } = useToast()
  const createAlbum = useCreatePhotoAlbum()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eventId, setEventId] = useState('')
  const [activityId, setActivityId] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      await createAlbum.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        event_id: eventId || undefined,
        activity_id: activityId || undefined,
      })
      toast({ type: 'success', message: 'Album created successfully' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to create album' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Album</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Album Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Camp 2026 Highlights"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this album..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Link to Event (optional)</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">No event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Link to Activity (optional)</label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">No activity</option>
              {activities.map((act) => (
                <option key={act.id} value={act.id}>{act.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || createAlbum.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {createAlbum.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Album
          </button>
        </div>
      </div>
    </div>
  )
}

/* ===================== ADD TO ALBUM MODAL ===================== */

function AddToAlbumModal({
  albums,
  onSelect,
  isPending,
  onClose,
}: {
  albums: PhotoAlbum[]
  onSelect: (albumId: string) => void
  isPending: boolean
  onClose: () => void
}) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? albums.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : albums

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add to Album</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search albums..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <FolderOpen className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No albums found</p>
            </div>
          ) : (
            <div className="max-h-64 space-y-1 overflow-auto">
              {filtered.map((album) => (
                <button
                  key={album.id}
                  onClick={() => onSelect(album.id)}
                  disabled={isPending}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {album.cover_photo_url ? (
                      <img src={album.cover_photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FolderOpen className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{album.name}</p>
                    <p className="text-xs text-gray-500">{album.photo_count} photo{album.photo_count !== 1 ? 's' : ''}</p>
                  </div>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ===================== PHOTO UPLOAD MODAL ===================== */

function PhotoUploadModal({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState('general')
  const [caption, setCaption] = useState('')
  const [eventId, setEventId] = useState('')
  const [activityId, setActivityId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const uploadPhoto = useUploadPhoto()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const { data: events = [] } = useEvents()
  const { data: activities = [] } = useActivities()

  const handleFiles = (newFiles: FileList | null) => { if (!newFiles) return; const imageFiles = Array.from(newFiles).filter((f) => f.type.startsWith('image/')); setFiles((prev) => [...prev, ...imageFiles]) }
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }, [])
  const removeFile = (index: number) => { setFiles((prev) => prev.filter((_, i) => i !== index)) }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      try { await uploadPhoto.mutateAsync({ file: files[i], category, caption: caption || undefined, event_id: eventId || undefined, activity_id: activityId || undefined }); setUploadProgress(((i + 1) / files.length) * 100) } catch (err) { console.error('Upload failed:', err) }
    }
    setUploading(false); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Upload Photos</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="space-y-4 p-6">
          <div onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className={cn('flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors', dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50')}>
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Drag & drop images here, or{' '}<label className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-700">browse<input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} /></label></p>
          </div>
          {files.length > 0 && (<div className="grid grid-cols-4 gap-2">{files.map((file, i) => (<div key={i} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"><img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" /><button onClick={() => removeFile(i)} className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"><X className="h-3 w-3 text-white" /></button></div>))}</div>)}
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"><option value="general">General</option><option value="camper">Camper</option><option value="event">Event</option></select></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Event (optional)</label><select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"><option value="">No event</option>{events.map((ev) => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}</select></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Activity (optional)</label><select value={activityId} onChange={(e) => setActivityId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"><option value="">No activity</option>{activities.map((act) => (<option key={act.id} value={act.id}>{act.name}</option>))}</select></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Caption (optional)</label><input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></div>
          {uploading && (<div className="space-y-1"><div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${uploadProgress}%` }} /></div><p className="text-xs text-gray-500">Uploading... {Math.round(uploadProgress)}%</p></div>)}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleUpload} disabled={files.length === 0 || uploading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{uploading ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Upload className="h-4 w-4" />)}Upload {files.length > 0 ? `(${files.length})` : ''}</button>
        </div>
      </div>
    </div>
  )
}

/* ===================== PHOTO DETAIL MODAL ===================== */

function PhotoDetailModal({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const deletePhoto = useDeletePhoto()
  const reprocessPhoto = useReprocessPhoto()
  const { hasPermission } = usePermissions()
  const { data: hookFaceTags = [] } = usePhotoFaceTags(photo.id)
  const [showFaceTags, setShowFaceTags] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })

  const faceTags: FaceTag[] = hookFaceTags.map((t) => ({ id: t.id, photo_id: t.photo_id, camper_id: t.camper_id, camper_name: t.camper_name, face_id: null, bounding_box: t.bounding_box ? { Left: t.bounding_box.left, Top: t.bounding_box.top, Width: t.bounding_box.width, Height: t.bounding_box.height } : null, confidence: t.confidence, similarity: t.similarity, created_at: t.created_at }))

  const handleDelete = async () => { if (!confirm('Are you sure you want to delete this photo?')) return; await deletePhoto.mutateAsync(photo.id); onClose() }
  const handleDetectFaces = async () => { await reprocessPhoto.mutateAsync(photo.id); setShowFaceTags(true) }
  const handleImageLoad = () => { if (imgRef.current) { setImgDimensions({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight }) } }
  const formatFileSize = (bytes: number) => { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB` }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"><X className="h-5 w-5" /></button>
        <div className="flex flex-col md:flex-row">
          <div className="flex items-center justify-center bg-gray-900 md:w-2/3">
            {photo.url ? (showFaceTags && faceTags.length > 0 ? (<FaceTagOverlay photoUrl={photo.url} faceTags={faceTags} imageWidth={imgDimensions.width || 500} imageHeight={imgDimensions.height || 375} />) : (<img ref={imgRef} src={photo.url} alt={photo.caption || photo.file_name} className="max-h-[500px] w-full object-contain" onLoad={handleImageLoad} />)) : (<div className="flex h-64 items-center justify-center"><ImageIcon className="h-16 w-16 text-gray-600" /></div>)}
          </div>
          <div className="space-y-4 p-6 md:w-1/3">
            <div><h3 className="text-lg font-semibold text-gray-900">{photo.caption || photo.file_name}</h3><span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium', categoryConfig[photo.category]?.color)}>{categoryConfig[photo.category]?.label}</span></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">File name</span><span className="truncate pl-2 text-gray-900">{photo.file_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Size</span><span className="text-gray-900">{formatFileSize(photo.file_size)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Uploaded</span><span className="text-gray-900">{new Date(photo.created_at).toLocaleDateString()}</span></div>
              {faceTags.length > 0 && (<div className="flex justify-between"><span className="text-gray-500">Faces</span><span className="text-gray-900">{faceTags.length} detected</span></div>)}
            </div>
            <div className="space-y-2">
              <button onClick={handleDetectFaces} disabled={reprocessPhoto.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">{reprocessPhoto.isPending ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<ScanFace className="h-4 w-4" />)}{reprocessPhoto.isPending ? 'Detecting...' : 'Detect Faces'}</button>
              {faceTags.length > 0 && (<button onClick={() => setShowFaceTags(!showFaceTags)} className={cn('inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors', showFaceTags ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>{showFaceTags ? 'Hide Face Tags' : 'Show Face Tags'}</button>)}
            </div>
            {hasPermission('photos.media.delete') && (<button onClick={handleDelete} disabled={deletePhoto.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Delete Photo</button>)}
          </div>
        </div>
      </div>
    </div>
  )
}
