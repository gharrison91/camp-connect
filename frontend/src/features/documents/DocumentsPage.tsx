import { useState } from 'react'
import {
  FileText,
  Download,
  Archive,
  PenTool,
  Trash2,
  X,
  Loader2,
  File,
  Image,
  Sheet,
  MoreHorizontal,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampDocument } from '@/types'


const CATEGORIES = [
  { value: 'policy', label: 'Policy', color: 'bg-blue-100 text-blue-700' },
  { value: 'waiver', label: 'Waiver', color: 'bg-purple-100 text-purple-700' },
  { value: 'medical_form', label: 'Medical Form', color: 'bg-red-100 text-red-700' },
  { value: 'emergency_plan', label: 'Emergency Plan', color: 'bg-orange-100 text-orange-700' },
  { value: 'training', label: 'Training', color: 'bg-teal-100 text-teal-700' },
  { value: 'permit', label: 'Permit', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'insurance', label: 'Insurance', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
] as const

const ROLES = ['admin', 'director', 'counselor', 'nurse', 'parent'] as const

function getCategoryInfo(cat: string) {
  return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[CATEGORIES.length - 1]
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'pdf': return <FileText className="h-8 w-8 text-red-500" />
    case 'doc': return <FileText className="h-8 w-8 text-blue-500" />
    case 'image': return <Image className="h-8 w-8 text-green-500" />
    case 'spreadsheet': return <Sheet className="h-8 w-8 text-emerald-500" />
    default: return <File className="h-8 w-8 text-gray-400" />
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Upload/Edit Modal
export function DocumentModal({
  doc,
  onClose,
  onSave,
  isSaving,
}: {
  doc: CampDocument | null
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  isSaving: boolean
}) {
  const [name, setName] = useState(doc?.name || '')
  const [description, setDescription] = useState(doc?.description || '')
  const [category, setCategory] = useState<string>(doc?.category || 'other')
  const [fileType, setFileType] = useState<string>(doc?.file_type || 'pdf')
  const [fileSize, setFileSize] = useState(doc?.file_size || 0)
  const [tags, setTags] = useState(doc?.tags?.join(', ') || '')
  const [requiresSignature, setRequiresSignature] = useState(doc?.requires_signature || false)
  const [expiryDate, setExpiryDate] = useState(doc?.expiry_date || '')
  const [sharedWith, setSharedWith] = useState<string[]>(doc?.shared_with || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      description: description || undefined,
      category,
      file_type: fileType,
      file_size: fileSize,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      requires_signature: requiresSignature,
      expiry_date: expiryDate || null,
      shared_with: sharedWith,
    })
  }

  const toggleRole = (role: string) => {
    setSharedWith((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          {doc ? 'Edit Document' : 'Upload Document'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Document name" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Brief description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">File Type</label>
              <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="pdf">PDF</option>
                <option value="doc">Document</option>
                <option value="image">Image</option>
                <option value="spreadsheet">Spreadsheet</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">File Size (bytes)</label>
            <input type="number" value={fileSize} onChange={(e) => setFileSize(Number(e.target.value))} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="safety, 2026, required" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Expiry Date</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="requires-sig" checked={requiresSignature} onChange={(e) => setRequiresSignature(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="requires-sig" className="text-sm font-medium text-gray-700">Requires Signature</label>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Share With</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button key={role} type="button" onClick={() => toggleRole(role)} className={cn('rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors', sharedWith.includes(role) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={!name.trim() || isSaving} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {doc ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// New Folder Modal
export function NewFolderModal({
  onClose,
  onSave,
  isSaving,
}: {
  onClose: () => void
  onSave: (name: string) => void
  isSaving: boolean
}) {
  const [name, setName] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">New Folder</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave(name.trim()) }} className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" autoFocus className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={!name.trim() || isSaving} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// Document Card (Grid View)
export function DocumentCard({
  doc,
  onEdit,
  onArchive,
  onDelete,
}: {
  doc: CampDocument
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const catInfo = getCategoryInfo(doc.category)

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="absolute right-3 top-3">
        <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              )}
              <button onClick={() => { onEdit(); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              {doc.status === 'active' && (
                <button onClick={() => { onArchive(); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  <Archive className="h-3.5 w-3.5" /> Archive
                </button>
              )}
              <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-gray-50">
        {getFileIcon(doc.file_type)}
      </div>
      <h3 className="mb-1 truncate text-sm font-semibold text-gray-900">{doc.name}</h3>
      {doc.description && <p className="mb-2 line-clamp-2 text-xs text-gray-500">{doc.description}</p>}
      <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', catInfo.color)}>{catInfo.label}</span>
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
        <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
      </div>
      {doc.requires_signature && (
        <div className="mt-2 flex items-center gap-1">
          <PenTool className="h-3 w-3 text-amber-500" />
          <span className="text-[10px] font-medium text-amber-600">
            {doc.signed_by.length > 0 ? doc.signed_by.length + ' signed' : 'Pending signature'}
          </span>
        </div>
      )}
      {doc.status !== 'active' && (
        <div className={cn('mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', doc.status === 'archived' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600')}>
          {doc.status}
        </div>
      )}
    </div>
  )
}


// Document Row (List View)
export function DocumentRow({
  doc,
  onEdit,
  onArchive,
  onDelete,
}: {
  doc: CampDocument
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const catInfo = getCategoryInfo(doc.category)

  return (
    <div className="group flex items-center gap-4 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
        {getFileIcon(doc.file_type)}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-gray-900">{doc.name}</h3>
        <p className="truncate text-xs text-gray-500">{doc.uploaded_by_name || 'Unknown'} &middot; {formatDate(doc.created_at)}</p>
      </div>
      <span className={cn('hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-block', catInfo.color)}>{catInfo.label}</span>
      <span className="hidden w-16 shrink-0 text-right text-xs text-gray-400 md:block">{formatFileSize(doc.file_size)}</span>
      {doc.requires_signature && <PenTool className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
      {doc.status !== 'active' && (
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', doc.status === 'archived' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600')}>{doc.status}</span>
      )}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {doc.file_url && (
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600" title="Download">
            <Download className="h-3.5 w-3.5" />
          </a>
        )}
        <button onClick={onEdit} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600" title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {doc.status === 'active' && (
          <button onClick={onArchive} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600" title="Archive">
            <Archive className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={onDelete} className="rounded-md p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600" title="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}


export function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Documents</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Document management coming soon</p>
      </div>
    </div>
  )
}
