/**
 * Camp Connect - PortalDocuments
 * Document list for parent portal with download, search, and camper filtering.
 */

import { useState } from 'react'
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Search,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePortalDocuments, usePortalCampers } from '@/hooks/usePortal'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import type { PortalDocumentItem } from '@/hooks/usePortal'

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />
    case 'doc':
      return <FileText className="h-5 w-5 text-blue-500" />
    case 'spreadsheet':
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
    case 'image':
      return <FileImage className="h-5 w-5 text-purple-500" />
    default:
      return <File className="h-5 w-5 text-gray-400" />
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function getTypeBadge(type: string) {
  const styles: Record<string, string> = {
    pdf: 'bg-red-50 text-red-700 ring-red-600/20',
    doc: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    spreadsheet: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    image: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    other: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  }
  return styles[type] || styles.other
}

export function PortalDocuments() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCamperId, setSelectedCamperId] = useState('')
  const { toast } = useToast()

  const { data: campers = [] } = usePortalCampers()
  const { data: docData, isLoading } = usePortalDocuments({
    camper_id: selectedCamperId || undefined,
    search: searchQuery || undefined,
  })

  const documents = docData?.items ?? []

  async function handleDownload(doc: PortalDocumentItem) {
    try {
      const response = await api.get(doc.download_url || `/portal/documents/${doc.id}/download`)
      toast({ type: 'success', message: `Downloading ${doc.name}...` })
      // In production this would open a signed URL or trigger a file download
      // For now we log the response
      console.log('Document download response:', response.data)
    } catch {
      toast({ type: 'error', message: 'Failed to download document. Please try again.' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={selectedCamperId}
          onChange={(e) => setSelectedCamperId(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"
        >
          <option value="">All Campers</option>
          {campers.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <FolderOpen className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No documents yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Documents shared by your camp will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={`${doc.id}-${doc.camper_name}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                  {getFileIcon(doc.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ring-1 ring-inset',
                        getTypeBadge(doc.type)
                      )}
                    >
                      {doc.type}
                    </span>
                    <span>{formatFileSize(doc.size_bytes)}</span>
                    {doc.camper_name && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span>{doc.camper_name}</span>
                      </>
                    )}
                    <span className="text-gray-300">|</span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDownload(doc)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
