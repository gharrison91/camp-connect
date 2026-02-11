import { useState, useMemo } from 'react'
import {
  Award,
  AlertTriangle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Download,
  FileCheck,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  Shield,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  useCertificationTypesForPage,
  useStaffCertificationsForPage,
  useCreateCertification,
  useUpdateCertification,
  useDeleteCertification,
  useExpiringCertifications,
  useCreateCertificationTypeMutation,
  useDeleteCertificationTypeMutation,
} from '@/hooks/useStaffCertifications'
import type { CertificationPageRecord } from '@/types'

// ─── Status Badge Config ─────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  active: {
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  expiring_soon: {
    label: 'Expiring Soon',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
  pending: {
    label: 'Pending',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: Clock,
  },
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

// ─── Staff Member Type ───────────────────────────────────────

interface StaffMemberOption {
  id: string
  user_id: string
  first_name: string
  last_name: string
}

// ─── Add/Edit Certification Modal ────────────────────────────

interface CertFormData {
  employee_id: string
  certification_type_id: string
  issued_date: string
  expiry_date: string
  issuing_authority: string
  certificate_number: string
  notes: string
  document_url: string
  status: string
}

function CertModal({
  isOpen,
  onClose,
  certification,
  staffMembers,
  certTypes,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean
  onClose: () => void
  certification: CertificationPageRecord | null
  staffMembers: StaffMemberOption[]
  certTypes: { id: string; name: string }[]
  onSubmit: (data: CertFormData) => void
  isSubmitting: boolean
}) {
  const [form, setForm] = useState<CertFormData>(() => ({
    employee_id: certification?.employee_id || '',
    certification_type_id: certification?.certification_type_id || '',
    issued_date: certification?.issued_date || '',
    expiry_date: certification?.expiry_date || '',
    issuing_authority: certification?.issuing_authority || '',
    certificate_number: certification?.certificate_number || '',
    notes: certification?.notes || '',
    document_url: certification?.document_url || '',
    status: certification?.status || 'active',
  }))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {certification ? 'Edit Certification' : 'Add Certification'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Staff Member */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Staff Member
            </label>
            <select
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              disabled={!!certification}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50"
            >
              <option value="">Select staff member...</option>
              {staffMembers.map((s) => (
                <option key={s.user_id || s.id} value={s.user_id || s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Certification Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Certification Type
            </label>
            <select
              value={form.certification_type_id}
              onChange={(e) =>
                setForm({ ...form, certification_type_id: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select type...</option>
              {certTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Issue Date
              </label>
              <input
                type="date"
                value={form.issued_date}
                onChange={(e) =>
                  setForm({ ...form, issued_date: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) =>
                  setForm({ ...form, expiry_date: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Authority & Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Issuing Authority
              </label>
              <input
                type="text"
                value={form.issuing_authority}
                onChange={(e) =>
                  setForm({ ...form, issuing_authority: e.target.value })
                }
                placeholder="e.g. American Red Cross"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Certificate #
              </label>
              <input
                type="text"
                value={form.certificate_number}
                onChange={(e) =>
                  setForm({ ...form, certificate_number: e.target.value })
                }
                placeholder="Certificate number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Document URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Document URL
            </label>
            <input
              type="url"
              value={form.document_url}
              onChange={(e) =>
                setForm({ ...form, document_url: e.target.value })
              }
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Optional notes..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={
              isSubmitting ||
              !form.employee_id ||
              !form.certification_type_id
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {certification ? 'Save Changes' : 'Add Certification'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Certification Type Modal ────────────────────────────

function AddTypeModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string; is_required: boolean }) => void
  isSubmitting: boolean
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isRequired, setIsRequired] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Add Certification Type
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CPR Certification"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-700">Required for all staff</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ name, description, is_required: isRequired })}
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Type
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CSV Export Helper ───────────────────────────────────────

function exportToCSV(certifications: CertificationPageRecord[]) {
  const headers = [
    'Staff Name',
    'Certification Type',
    'Issue Date',
    'Expiry Date',
    'Status',
    'Issuing Authority',
    'Certificate #',
    'Notes',
  ]
  const rows = certifications.map((c) => [
    c.employee_name || '',
    c.certification_type_name || '',
    c.issued_date || '',
    c.expiry_date || '',
    c.status,
    c.issuing_authority || '',
    c.certificate_number || '',
    c.notes || '',
  ])
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `certifications-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ─── Main Page Component ─────────────────────────────────────

export function CertificationsPage() {
  const { toast } = useToast()

  // State
  const [showModal, setShowModal] = useState(false)
  const [editingCert, setEditingCert] = useState<CertificationPageRecord | null>(null)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [typesExpanded, setTypesExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Data fetching
  const { data: certifications = [], isLoading } = useStaffCertificationsForPage()
  const { data: expiringCerts = [] } = useExpiringCertifications()
  const { data: certTypes = [] } = useCertificationTypesForPage()

  // Staff list for dropdown
  const { data: staffData } = useQuery<{ items: StaffMemberOption[] }>({
    queryKey: ['staff-list-for-certs'],
    queryFn: () => api.get('/staff', { params: { limit: 500 } }).then((r) => r.data),
  })
  const staffMembers: StaffMemberOption[] = staffData?.items || []

  // Mutations
  const createCert = useCreateCertification()
  const updateCert = useUpdateCertification()
  const deleteCert = useDeleteCertification()
  const createType = useCreateCertificationTypeMutation()
  const deleteType = useDeleteCertificationTypeMutation()

  // Computed stats
  const stats = useMemo(() => {
    const active = certifications.filter((c) => c.status === 'active').length
    const expiringSoon = certifications.filter(
      (c) => c.status === 'expiring_soon'
    ).length
    const expired = certifications.filter((c) => c.status === 'expired').length
    const total = certifications.length
    const complianceRate = total > 0 ? Math.round(((active) / total) * 100) : 0
    return { active, expiringSoon, expired, total, complianceRate }
  }, [certifications])

  // Alerts count
  const alertCount = useMemo(() => {
    const expiredCount = expiringCerts.filter(
      (c) => c.status === 'expired'
    ).length
    const expiringCount = expiringCerts.filter(
      (c) => c.status === 'expiring_soon'
    ).length
    return { expiredCount, expiringCount }
  }, [expiringCerts])

  // Filtered certifications
  const filtered = useMemo(() => {
    let result = certifications
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          (c.employee_name || '').toLowerCase().includes(q) ||
          (c.certification_type_name || '').toLowerCase().includes(q) ||
          (c.certificate_number || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter)
    }
    if (typeFilter !== 'all') {
      result = result.filter((c) => c.certification_type_id === typeFilter)
    }
    return result
  }, [certifications, searchQuery, statusFilter, typeFilter])

  // Handlers
  const handleSubmitCert = (data: CertFormData) => {
    if (editingCert) {
      updateCert.mutate(
        {
          certId: editingCert.id,
          data: {
            status: data.status,
            issued_date: data.issued_date || null,
            expiry_date: data.expiry_date || null,
            document_url: data.document_url || null,
            notes: data.notes || null,
          },
        },
        {
          onSuccess: () => {
            toast({ type: 'success', message: 'Certification updated' })
            setShowModal(false)
            setEditingCert(null)
          },
          onError: () => {
            toast({ type: 'error', message: 'Failed to update certification' })
          },
        }
      )
    } else {
      createCert.mutate(
        {
          userId: data.employee_id,
          data: {
            certification_type_id: data.certification_type_id,
            status: data.status,
            issued_date: data.issued_date || null,
            expiry_date: data.expiry_date || null,
            document_url: data.document_url || null,
            notes: data.notes || null,
          },
        },
        {
          onSuccess: () => {
            toast({ type: 'success', message: 'Certification added' })
            setShowModal(false)
          },
          onError: () => {
            toast({ type: 'error', message: 'Failed to add certification' })
          },
        }
      )
    }
  }

  const handleDeleteCert = (certId: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return
    deleteCert.mutate(certId, {
      onSuccess: () => toast({ type: 'success', message: 'Certification deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete certification' }),
    })
  }

  const handleAddType = (data: {
    name: string
    description: string
    is_required: boolean
  }) => {
    createType.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        is_required: data.is_required,
      },
      {
        onSuccess: () => {
          toast({ type: 'success', message: 'Certification type added' })
          setShowTypeModal(false)
        },
        onError: () => {
          toast({ type: 'error', message: 'Failed to add certification type' })
        },
      }
    )
  }

  const handleDeleteType = (typeId: string) => {
    if (!confirm('Delete this certification type?')) return
    deleteType.mutate(typeId, {
      onSuccess: () => toast({ type: 'success', message: 'Type deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete type' }),
    })
  }

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '--'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Staff Certifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage staff CPR, first aid, lifeguard, and other
            certifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(filtered)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingCert(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Certification
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {(alertCount.expiredCount > 0 || alertCount.expiringCount > 0) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">
                Certification Alerts
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {alertCount.expiredCount > 0 && (
                  <span className="font-medium">
                    {alertCount.expiredCount} expired
                  </span>
                )}
                {alertCount.expiredCount > 0 && alertCount.expiringCount > 0 && ' and '}
                {alertCount.expiringCount > 0 && (
                  <span className="font-medium">
                    {alertCount.expiringCount} expiring within 30 days
                  </span>
                )}
                {' '}-- immediate attention required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-xs font-medium text-slate-500">Total Active</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.expiringSoon}
              </p>
              <p className="text-xs font-medium text-slate-500">
                Expiring Soon
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.expired}
              </p>
              <p className="text-xs font-medium text-slate-500">Expired</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.complianceRate}%
              </p>
              <p className="text-xs font-medium text-slate-500">
                Compliance Rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, type, or certificate number..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(statusFilter !== 'all' || typeFilter !== 'all') && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                {(statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Certification Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Types</option>
                {certTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setTypeFilter('all')
                  setSearchQuery('')
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FileCheck className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No certifications found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {certifications.length === 0
                ? 'Get started by adding your first staff certification.'
                : 'Try adjusting your search or filters.'}
            </p>
            {certifications.length === 0 && (
              <button
                onClick={() => {
                  setEditingCert(null)
                  setShowModal(true)
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Add Certification
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Staff Name
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" />
                      Certification
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Issue Date
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Expiry Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Authority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cert #
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cert) => (
                  <tr
                    key={cert.id}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-900">
                        {cert.employee_name || '--'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700">
                        {cert.certification_type_name || '--'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(cert.issued_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(cert.expiry_date)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={cert.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {cert.issuing_authority || '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {cert.certificate_number || '--'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingCert(cert)
                            setShowModal(true)
                          }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCert(cert.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count */}
        {filtered.length > 0 && (
          <div className="border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
              Showing {filtered.length} of {certifications.length} certifications
            </p>
          </div>
        )}
      </div>

      {/* Certification Types Management (Collapsible) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setTypesExpanded(!typesExpanded)}
          className="flex w-full items-center justify-between px-6 py-4"
        >
          <div className="flex items-center gap-3">
            <Award className="h-5 w-5 text-emerald-600" />
            <div className="text-left">
              <h2 className="text-sm font-semibold text-slate-900">
                Certification Types
              </h2>
              <p className="text-xs text-slate-500">
                Manage the types of certifications tracked for staff
              </p>
            </div>
          </div>
          {typesExpanded ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {typesExpanded && (
          <div className="border-t border-slate-200 px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {certTypes.length} certification type
                {certTypes.length !== 1 ? 's' : ''} configured
              </p>
              <button
                onClick={() => setShowTypeModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Type
              </button>
            </div>

            {certTypes.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No certification types configured yet.
              </p>
            ) : (
              <div className="space-y-2">
                {certTypes.map((ct) => (
                  <div
                    key={ct.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-4 w-4 text-emerald-500" />
                      <div>
                        <span className="text-sm font-medium text-slate-900">
                          {ct.name}
                        </span>
                        {ct.is_required && (
                          <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Required
                          </span>
                        )}
                        {ct.description && (
                          <p className="text-xs text-slate-500">
                            {ct.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteType(ct.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete type"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CertModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingCert(null)
        }}
        certification={editingCert}
        staffMembers={staffMembers}
        certTypes={certTypes.map((t) => ({ id: t.id, name: t.name }))}
        onSubmit={handleSubmitCert}
        isSubmitting={createCert.isPending || updateCert.isPending}
      />

      <AddTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSubmit={handleAddType}
        isSubmitting={createType.isPending}
      />
    </div>
  )
}
