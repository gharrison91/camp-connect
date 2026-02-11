import { useState } from 'react'
import {
  Briefcase,
  Plus,
  Search,
  X,
  Trash2,
  Eye,
  EyeOff,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
  Send,
} from 'lucide-react'
import {
  useJobListings,
  useCreateJobListing,
  useUpdateJobListing,
  useDeleteJobListing,
  usePublishJobListing,
  useCloseJobListing,
  useJobApplications,
  useUpdateApplicationStatus,
} from '@/hooks/useJobs'
import type { JobListing, JobListingCreate, JobApplication } from '@/types'

// ─── Constants ────────────────────────────────────────────────

const LISTING_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-600',
  filled: 'bg-blue-100 text-blue-700',
}

const APP_STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  interview: 'bg-purple-100 text-purple-700',
  offered: 'bg-emerald-100 text-emerald-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const EMPLOYMENT_TYPES = [
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'volunteer', label: 'Volunteer' },
]

const PAY_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'stipend', label: 'Stipend' },
]

const APP_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'interview', label: 'Interview' },
  { value: 'offered', label: 'Offered' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
]

const EMPTY_FORM: JobListingCreate = {
  title: '',
  description: '',
  department: '',
  location: '',
  employment_type: 'seasonal',
  pay_rate: undefined,
  pay_type: 'hourly',
  start_date: '',
  end_date: '',
  requirements: [],
  certifications_required: [],
  min_age: undefined,
  positions_available: 1,
  is_featured: false,
  application_deadline: '',
}

// ─── Main Page ───────────────────────────────────────────────

export function JobsPage() {
  const [tab, setTab] = useState<'listings' | 'applications'>('listings')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingListing, setEditingListing] = useState<JobListing | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Board</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage job listings and review applications
          </p>
        </div>
        {tab === 'listings' && (
          <button
            onClick={() => {
              setEditingListing(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Listing
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setTab('listings')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              tab === 'listings'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Listings
            </span>
          </button>
          <button
            onClick={() => setTab('applications')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              tab === 'applications'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Applications
            </span>
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={tab === 'listings' ? 'Search listings...' : 'Search applications...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Content */}
      {tab === 'listings' ? (
        <ListingsTab
          search={search}
          onEdit={(listing) => {
            setEditingListing(listing)
            setShowModal(true)
          }}
        />
      ) : (
        <ApplicationsTab search={search} />
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <ListingModal
          listing={editingListing}
          onClose={() => {
            setShowModal(false)
            setEditingListing(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Listings Tab ────────────────────────────────────────────

function ListingsTab({
  search,
  onEdit,
}: {
  search: string
  onEdit: (listing: JobListing) => void
}) {
  const { data: listings, isLoading } = useJobListings()
  const deleteMutation = useDeleteJobListing()
  const publishMutation = usePublishJobListing()
  const closeMutation = useCloseJobListing()

  const filtered = (listings || []).filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    (l.department || '').toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
        <Briefcase className="h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-medium text-slate-900">No job listings</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create your first listing to start recruiting
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((listing) => (
        <div
          key={listing.id}
          className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Featured badge */}
          {listing.is_featured && (
            <div className="absolute -top-2 right-3">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Featured
              </span>
            </div>
          )}

          {/* Status badge */}
          <div className="mb-3 flex items-center justify-between">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                LISTING_STATUS_STYLES[listing.status] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEdit(listing)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Edit"
              >
                <Briefcase className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this listing?')) {
                    deleteMutation.mutate(listing.id)
                  }
                }}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Title & department */}
          <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
            {listing.title}
          </h3>
          {listing.department && (
            <p className="mt-0.5 text-xs text-slate-500">{listing.department}</p>
          )}

          {/* Details */}
          <div className="mt-3 flex flex-col gap-1.5 text-xs text-slate-600">
            {listing.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {listing.location}
              </div>
            )}
            {listing.pay_rate != null && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                ${listing.pay_rate.toFixed(2)} / {listing.pay_type}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {listing.positions_filled}/{listing.positions_available} positions filled
            </div>
            {listing.application_deadline && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Deadline: {new Date(listing.application_deadline).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Application count + employment type */}
          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {EMPLOYMENT_TYPES.find((t) => t.value === listing.employment_type)?.label || listing.employment_type}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {listing.application_count ?? 0} application{(listing.application_count ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
            {listing.status === 'draft' && (
              <button
                onClick={() => publishMutation.mutate(listing.id)}
                disabled={publishMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                Publish
              </button>
            )}
            {listing.status === 'published' && (
              <button
                onClick={() => closeMutation.mutate(listing.id)}
                disabled={closeMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Close
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Applications Tab ────────────────────────────────────────

function ApplicationsTab({ search }: { search: string }) {
  const { data: applications, isLoading } = useJobApplications()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = (applications || []).filter((a) =>
    a.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.listing_title || '').toLowerCase().includes(search.toLowerCase()) ||
    a.applicant_email.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
        <Send className="h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-medium text-slate-900">No applications</h3>
        <p className="mt-1 text-sm text-slate-500">
          Applications will appear here once candidates apply
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Applicant
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Position
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Applied
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.map((app) => (
            <ApplicationRow
              key={app.id}
              application={app}
              isExpanded={expandedId === app.id}
              onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Application Row ─────────────────────────────────────────

function ApplicationRow({
  application,
  isExpanded,
  onToggle,
}: {
  application: JobApplication
  isExpanded: boolean
  onToggle: () => void
}) {
  const statusMutation = useUpdateApplicationStatus()

  return (
    <>
      <tr className="hover:bg-slate-50/50 transition-colors">
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">{application.applicant_name}</p>
            <p className="text-xs text-slate-500">{application.applicant_email}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          {application.listing_title || 'Unknown'}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              APP_STATUS_STYLES[application.status] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-slate-500">
          {new Date(application.created_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">
          <select
            value={application.status}
            onChange={(e) => {
              statusMutation.mutate({
                id: application.id,
                status: e.target.value,
              })
            }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {APP_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={onToggle}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-slate-50/50 px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {application.applicant_phone && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Phone</p>
                  <p className="text-sm text-slate-700">{application.applicant_phone}</p>
                </div>
              )}
              {application.experience_years != null && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Experience</p>
                  <p className="text-sm text-slate-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {application.experience_years} year{application.experience_years !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              {application.certifications && application.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Certifications</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {application.certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        <Award className="h-3 w-3" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(application.availability_start || application.availability_end) && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Availability</p>
                  <p className="text-sm text-slate-700">
                    {application.availability_start
                      ? new Date(application.availability_start).toLocaleDateString()
                      : '?'}{' '}
                    -{' '}
                    {application.availability_end
                      ? new Date(application.availability_end).toLocaleDateString()
                      : '?'}
                  </p>
                </div>
              )}
              {application.resume_url && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Resume</p>
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 hover:underline"
                  >
                    View Resume
                  </a>
                </div>
              )}
              {application.notes && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Notes</p>
                  <p className="text-sm text-slate-700">{application.notes}</p>
                </div>
              )}
              {application.cover_letter && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-xs font-medium text-slate-500">Cover Letter</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-slate-700 border border-slate-200">
                    {application.cover_letter}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Listing Modal ───────────────────────────────────────────

function ListingModal({
  listing,
  onClose,
}: {
  listing: JobListing | null
  onClose: () => void
}) {
  const createMutation = useCreateJobListing()
  const updateMutation = useUpdateJobListing()

  const [form, setForm] = useState<JobListingCreate>(() => {
    if (listing) {
      return {
        title: listing.title,
        description: listing.description || '',
        department: listing.department || '',
        location: listing.location || '',
        employment_type: listing.employment_type,
        pay_rate: listing.pay_rate ?? undefined,
        pay_type: listing.pay_type,
        start_date: listing.start_date ? listing.start_date.split('T')[0] : '',
        end_date: listing.end_date ? listing.end_date.split('T')[0] : '',
        requirements: listing.requirements || [],
        certifications_required: listing.certifications_required || [],
        min_age: listing.min_age ?? undefined,
        positions_available: listing.positions_available,
        is_featured: listing.is_featured,
        application_deadline: listing.application_deadline
          ? listing.application_deadline.split('T')[0]
          : '',
      }
    }
    return { ...EMPTY_FORM }
  })

  const [reqInput, setReqInput] = useState('')
  const [certInput, setCertInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: JobListingCreate = {
      ...form,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      application_deadline: form.application_deadline || undefined,
    }

    if (listing) {
      updateMutation.mutate(
        { id: listing.id, data: payload },
        { onSuccess: () => onClose() }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => onClose() })
    }
  }

  const addRequirement = () => {
    if (reqInput.trim()) {
      setForm((prev) => ({
        ...prev,
        requirements: [...(prev.requirements || []), reqInput.trim()],
      }))
      setReqInput('')
    }
  }

  const removeRequirement = (index: number) => {
    setForm((prev) => ({
      ...prev,
      requirements: (prev.requirements || []).filter((_, i) => i !== index),
    }))
  }

  const addCertification = () => {
    if (certInput.trim()) {
      setForm((prev) => ({
        ...prev,
        certifications_required: [
          ...(prev.certifications_required || []),
          certInput.trim(),
        ],
      }))
      setCertInput('')
    }
  }

  const removeCertification = (index: number) => {
    setForm((prev) => ({
      ...prev,
      certifications_required: (prev.certifications_required || []).filter(
        (_, i) => i !== index
      ),
    }))
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {listing ? 'Edit Listing' : 'Create Job Listing'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. Waterfront Lifeguard"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Describe the role, responsibilities, and what makes it great..."
            />
          </div>

          {/* Two-column layout */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Department</label>
              <input
                type="text"
                value={form.department || ''}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Waterfront"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Location</label>
              <input
                type="text"
                value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Lake Tahoe, CA"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Employment Type</label>
              <select
                value={form.employment_type || 'seasonal'}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Positions Available</label>
              <input
                type="number"
                min={1}
                value={form.positions_available ?? 1}
                onChange={(e) =>
                  setForm({ ...form, positions_available: parseInt(e.target.value) || 1 })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Pay */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Pay Rate ($)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={form.pay_rate ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pay_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="15.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Pay Type</label>
              <select
                value={form.pay_type || 'hourly'}
                onChange={(e) => setForm({ ...form, pay_type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {PAY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                value={form.start_date || ''}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="date"
                value={form.end_date || ''}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Application Deadline</label>
              <input
                type="date"
                value={form.application_deadline || ''}
                onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Min age */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Minimum Age</label>
              <input
                type="number"
                min={0}
                value={form.min_age ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    min_age: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="18"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_featured || false}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Featured listing
              </label>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Requirements</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={reqInput}
                onChange={(e) => setReqInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addRequirement()
                  }
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Add requirement and press Enter"
              />
              <button
                type="button"
                onClick={addRequirement}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200"
              >
                Add
              </button>
            </div>
            {(form.requirements || []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(form.requirements || []).map((req, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {req}
                    <button
                      type="button"
                      onClick={() => removeRequirement(i)}
                      className="ml-0.5 text-slate-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Certifications Required */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Certifications Required
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCertification()
                  }
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. CPR, Lifeguard, First Aid"
              />
              <button
                type="button"
                onClick={addCertification}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200"
              >
                Add
              </button>
            </div>
            {(form.certifications_required || []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(form.certifications_required || []).map((cert, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
                  >
                    <Award className="h-3 w-3" />
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(i)}
                      className="ml-0.5 text-blue-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !form.title}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving...' : listing ? 'Update Listing' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
