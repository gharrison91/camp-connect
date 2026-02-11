/**
 * Camp Connect – Document Management System
 * Two-panel: folder tree + document grid/list
 */

import { useState } from 'react'
import {
  FileText,
  File,
  Image,
  Sheet,
  Plus,
  FolderPlus,
  Search,
  Grid3X3,
  List,
  AlertTriangle,
  Clock,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
  Upload,
  Archive,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import type { CampDocument, DocumentFolder } from '@/types'
import {
  useDocuments,
  useCreateDocument,
  useDeleteDocument,
  useArchiveDocument,
  useDocumentFolders,
  useCreateFolder,
  useExpiringDocuments,
  useDocumentStats,
} from '@/hooks/useDocuments'

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

function getCategoryInfo(cat: string) {
  return CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1]
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

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// ─── Upload Document Modal ─────────────────────────────────────
function UploadModal({ folderId, onClose }: { folderId: string | null; onClose: () => void }) {
  const { toast } = useToast()
  const createDoc = useCreateDocument()
  const [form, setForm] = useState({
    name: '', description: '', file_url: '', file_type: 'pdf' as CampDocument['file_type'],
    file_size: 0, category: 'other' as CampDocument['category'],
    tags: [] as string[], requires_signature: false, expiry_date: '',
    shared_with: [] as string[], folder_id: folderId,
  })
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }

  const submit = () => {
    if (!form.name.trim()) return
    createDoc.mutate(form as any, {
      onSuccess: () => { toast({ message: 'Document uploaded', type: 'success' }); onClose() },
      onError: () => toast({ message: 'Failed to upload', type: 'error' }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Document name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select className="rounded-lg border px-3 py-2 text-sm" value={form.file_type} onChange={e => setForm(f => ({ ...f, file_type: e.target.value as any }))}>
              <option value="pdf">PDF</option>
              <option value="doc">Document</option>
              <option value="image">Image</option>
              <option value="spreadsheet">Spreadsheet</option>
              <option value="other">Other</option>
            </select>
            <select className="rounded-lg border px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Upload className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">File upload coming soon</p>
            <p className="text-xs text-slate-400">Enter metadata below for now</p>
          </div>
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="File URL (placeholder)" value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} />
          <div>
            <label className="mb-1 block text-xs text-slate-500">Tags</label>
            <div className="flex gap-2">
              <input className="flex-1 rounded-lg border px-3 py-1.5 text-sm" placeholder="Add tag…" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
              <button onClick={addTag} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Add</button>
            </div>
            {form.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {t}
                    <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.requires_signature} onChange={e => setForm(f => ({ ...f, requires_signature: e.target.checked }))} className="rounded" />
              Requires signature
            </label>
            <input type="date" className="rounded-lg border px-3 py-1.5 text-sm" placeholder="Expiry date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={createDoc.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {createDoc.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Folder Modal ───────────────────────────────────────
function CreateFolderModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const createFolder = useCreateFolder()
  const [name, setName] = useState('')

  const submit = () => {
    if (!name.trim()) return
    createFolder.mutate({ name } as any, {
      onSuccess: () => { toast({ message: 'Folder created', type: 'success' }); onClose() },
      onError: () => toast({ message: 'Failed to create folder', type: 'error' }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">New Folder</h2>
        <input className="mb-4 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Folder name" value={name} onChange={e => setName(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={createFolder.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">Create</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────
export function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const { data: documents = [], isLoading } = useDocuments({ category: categoryFilter || undefined, search: search || undefined, folder_id: selectedFolder || undefined, status: statusFilter || undefined })
  const { data: folders = [] } = useDocumentFolders()
  const { data: expiring = [] } = useExpiringDocuments(30)
  const { data: stats } = useDocumentStats()
  const deleteDoc = useDeleteDocument()
  const archiveDoc = useArchiveDocument()
  const { toast } = useToast()

  const handleDelete = (doc: CampDocument) => {
    if (!confirm(`Delete "${doc.name}"?`)) return
    deleteDoc.mutate(doc.id, {
      onSuccess: () => toast({ message: 'Document deleted', type: 'success' }),
      onError: () => toast({ message: 'Failed to delete', type: 'error' }),
    })
  }

  const handleArchive = (doc: CampDocument) => {
    archiveDoc.mutate(doc.id, {
      onSuccess: () => toast({ message: 'Document archived', type: 'success' }),
      onError: () => toast({ message: 'Failed to archive', type: 'error' }),
    })
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">Manage policies, waivers, forms, and more</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFolderModal(true)} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">
            <FolderPlus className="h-4 w-4" /> New Folder
          </button>
          <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* Expiring Alert */}
      {expiring.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span className="text-sm text-amber-800">{expiring.length} document{expiring.length > 1 ? 's' : ''} expiring within 30 days</span>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: stats?.total_documents ?? 0, icon: FileText, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Pending Signatures', value: stats?.pending_signatures ?? 0, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
          { label: 'Expiring Soon', value: stats?.expiring_soon ?? 0, icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-600' },
          { label: 'Folders', value: folders.length, icon: FolderOpen, bg: 'bg-purple-50', color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Folder Sidebar */}
        <div className="w-56 shrink-0">
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <button onClick={() => setSelectedFolder(null)} className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${!selectedFolder ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              All Documents
            </button>
            {folders.map((f: DocumentFolder) => (
              <div key={f.id}>
                <button
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${selectedFolder === f.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  onClick={() => { setSelectedFolder(f.id); toggleFolder(f.id) }}
                >
                  {expandedFolders.has(f.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <FolderOpen className="h-4 w-4" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-slate-400">{f.document_count}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Filter Bar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg border px-3 py-2 text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select className="rounded-lg border px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="expired">Expired</option>
            </select>
            <div className="flex rounded-lg border">
              <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-slate-100' : ''}`}><Grid3X3 className="h-4 w-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-slate-100' : ''}`}><List className="h-4 w-4" /></button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : documents.length === 0 ? (
            <div className="rounded-xl border bg-white p-12 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">No documents found</p>
              <button onClick={() => setShowUploadModal(true)} className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700">+ Upload Document</button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {documents.map((doc: CampDocument) => {
                const cat = getCategoryInfo(doc.category)
                return (
                  <div key={doc.id} className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition">
                    <div className="mb-3 flex items-start justify-between">
                      {getFileIcon(doc.file_type)}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.color}`}>{cat.label}</span>
                    </div>
                    <p className="mb-1 font-medium text-sm truncate">{doc.name}</p>
                    <p className="mb-2 text-xs text-slate-500 line-clamp-2">{doc.description || 'No description'}</p>
                    <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>·</span>
                      <span>v{doc.version}</span>
                      {doc.requires_signature && <span className="text-amber-500">✍ Signature required</span>}
                    </div>
                    {doc.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map(t => (
                          <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1 border-t pt-3">
                      <button onClick={() => handleArchive(doc)} className="flex-1 rounded-lg border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                        <Archive className="mr-1 inline h-3 w-3" /> Archive
                      </button>
                      <button onClick={() => handleDelete(doc)} className="rounded-lg border px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border bg-white shadow-sm divide-y">
              {documents.map((doc: CampDocument) => {
                const cat = getCategoryInfo(doc.category)
                return (
                  <div key={doc.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="shrink-0">{getFileIcon(doc.file_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(doc.file_size)} · v{doc.version} · {doc.uploaded_by_name}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.color}`}>{cat.label}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${doc.status === 'active' ? 'bg-green-100 text-green-700' : doc.status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-700'}`}>{doc.status}</span>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleArchive(doc)} className="rounded p-1 text-slate-400 hover:text-slate-600"><Archive className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(doc)} className="rounded p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showUploadModal && <UploadModal folderId={selectedFolder} onClose={() => setShowUploadModal(false)} />}
      {showFolderModal && <CreateFolderModal onClose={() => setShowFolderModal(false)} />}
    </div>
  )
}
