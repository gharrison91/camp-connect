/**
 * Camp Connect - Alumni Network Page
 * Directory of camp alumni with search, filters, stats, and CRUD modals.
 */

import { useState, useEffect } from 'react'
import {
  Users,
  GraduationCap,
  Briefcase,
  Calendar,
  Search,
  Plus,
  X,
  Loader2,
  MapPin,
  Linkedin,
  Edit2,
  Trash2,
  User,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useAlumni,
  useAlumniStats,
  useCreateAlumni,
  useUpdateAlumni,
  useDeleteAlumni,
} from '@/hooks/useAlumni'
import type { AlumniData } from '@/hooks/useAlumni'

// ---------------------------------------------------------------------------
// Animated counter (matches AwardsPage pattern)
// ---------------------------------------------------------------------------

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }
    const duration = 800
    const steps = 30
    const increment = value / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const current = Math.min(Math.round(increment * step), value)
      setDisplay(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span className={className}>{display.toLocaleString()}</span>
}

// ---------------------------------------------------------------------------
// Role badge component
// ---------------------------------------------------------------------------

const ROLE_STYLES: Record<string, string> = {
  camper: 'bg-blue-50 text-blue-700 border-blue-200',
  staff: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  both: 'bg-purple-50 text-purple-700 border-purple-200',
}

const ROLE_LABELS: Record<string, string> = {
  camper: 'Camper',
  staff: 'Staff',
  both: 'Camper & Staff',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        ROLE_STYLES[role] ?? 'bg-gray-50 text-gray-700 border-gray-200',
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Alumni form modal (create / edit)
// ---------------------------------------------------------------------------

function AlumniFormModal({
  alumni,
  onClose,
  onSave,
  isSaving,
}: {
  alumni?: AlumniData | null
  onClose: () => void
  onSave: (data: Partial<AlumniData>) => void
  isSaving: boolean
}) {
  const [firstName, setFirstName] = useState(alumni?.first_name ?? '')
  const [lastName, setLastName] = useState(alumni?.last_name ?? '')
  const [email, setEmail] = useState(alumni?.email ?? '')
  const [phone, setPhone] = useState(alumni?.phone ?? '')
  const [role, setRole] = useState<string>(alumni?.role ?? 'camper')
  const [graduationYear, setGraduationYear] = useState(
    alumni?.graduation_year?.toString() ?? '',
  )
  const [yearsAttended, setYearsAttended] = useState(
    alumni?.years_attended?.join(', ') ?? '',
  )
  const [city, setCity] = useState(alumni?.current_city ?? '')
  const [state, setState] = useState(alumni?.current_state ?? '')
  const [bio, setBio] = useState(alumni?.bio ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(alumni?.linkedin_url ?? '')
  const [photoUrl, setPhotoUrl] = useState(alumni?.profile_photo_url ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedYears = yearsAttended
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n))

    onSave({
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      role: role as AlumniData['role'],
      graduation_year: graduationYear ? parseInt(graduationYear) : null,
      years_attended: parsedYears,
      current_city: city || null,
      current_state: state || null,
      bio: bio || null,
      linkedin_url: linkedinUrl || null,
      profile_photo_url: photoUrl || null,
    })
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {alumni ? 'Edit Alumni' : 'Add Alumni'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                First Name *
              </label>
              <input
                required
                className={inputCls}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Last Name *
              </label>
              <input
                required
                className={inputCls}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Phone
              </label>
              <input
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Role & Graduation Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Role
              </label>
              <select
                className={inputCls}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="camper">Camper</option>
                <option value="staff">Staff</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Graduation Year
              </label>
              <input
                type="number"
                className={inputCls}
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2020"
                min={1950}
                max={2100}
              />
            </div>
          </div>

          {/* Years Attended */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Years Attended
            </label>
            <input
              className={inputCls}
              value={yearsAttended}
              onChange={(e) => setYearsAttended(e.target.value)}
              placeholder="2018, 2019, 2020"
            />
            <p className="mt-1 text-xs text-gray-400">Comma-separated list of years</p>
          </div>

          {/* Location row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                City
              </label>
              <input
                className={inputCls}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                State
              </label>
              <input
                className={inputCls}
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="NY"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Bio
            </label>
            <textarea
              className={cn(inputCls, 'min-h-[80px] resize-none')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio..."
              rows={3}
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              LinkedIn URL
            </label>
            <input
              type="url"
              className={inputCls}
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          {/* Profile Photo URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Profile Photo URL
            </label>
            <input
              type="url"
              className={inputCls}
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !firstName.trim() || !lastName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {alumni ? 'Save Changes' : 'Add Alumni'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  alumni,
  onClose,
  onConfirm,
  isDeleting,
}: {
  alumni: AlumniData
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">Delete Alumni</h3>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to remove{' '}
          <span className="font-medium">
            {alumni.first_name} {alumni.last_name}
          </span>{' '}
          from the alumni directory? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Alumni card
// ---------------------------------------------------------------------------

function AlumniCard({
  alumni,
  onEdit,
  onDelete,
}: {
  alumni: AlumniData
  onEdit: () => void
  onDelete: () => void
}) {
  const initials = `${alumni.first_name.charAt(0)}${alumni.last_name.charAt(0)}`.toUpperCase()
  const location = [alumni.current_city, alumni.current_state].filter(Boolean).join(', ')

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
      {/* Actions (top-right) */}
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Edit"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Photo / Initials */}
      <div className="mb-3 flex items-center gap-3">
        {alumni.profile_photo_url ? (
          <img
            src={alumni.profile_photo_url}
            alt={`${alumni.first_name} ${alumni.last_name}`}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white ring-2 ring-white">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {alumni.first_name} {alumni.last_name}
          </h3>
          <RoleBadge role={alumni.role} />
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-1.5 text-xs text-gray-500">
        {alumni.graduation_year && (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
            <span>Class of {alumni.graduation_year}</span>
          </div>
        )}
        {alumni.years_attended.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>
              {alumni.years_attended.length} year{alumni.years_attended.length !== 1 ? 's' : ''} attended
            </span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* Bio (truncated) */}
      {alumni.bio && (
        <p className="mt-2 line-clamp-2 text-xs text-gray-500">{alumni.bio}</p>
      )}

      {/* LinkedIn link */}
      {alumni.linkedin_url && (
        <a
          href={alumni.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          <Linkedin className="h-3.5 w-3.5" />
          LinkedIn Profile
        </a>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function AlumniNetworkPage() {
  const { toast } = useToast()

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingAlumni, setEditingAlumni] = useState<AlumniData | null>(null)
  const [deletingAlumni, setDeletingAlumni] = useState<AlumniData | null>(null)

  // Queries
  const { data: alumni, isLoading } = useAlumni({
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    graduation_year: yearFilter ? parseInt(yearFilter) : undefined,
  })
  const { data: stats } = useAlumniStats()

  // Mutations
  const createMutation = useCreateAlumni()
  const updateMutation = useUpdateAlumni()
  const deleteMutation = useDeleteAlumni()

  // Derive unique graduation years from data for filter dropdown
  const graduationYears = Array.from(
    new Set(
      (alumni ?? [])
        .map((a) => a.graduation_year)
        .filter((y): y is number => y !== null),
    ),
  ).sort((a, b) => b - a)

  // ---- Handlers ----

  const handleSave = (data: Partial<AlumniData>) => {
    if (editingAlumni) {
      updateMutation.mutate(
        { id: editingAlumni.id, data },
        {
          onSuccess: () => {
            toast({ type: 'success', message: 'Alumni updated successfully' })
            setShowFormModal(false)
            setEditingAlumni(null)
          },
          onError: () => {
            toast({ type: 'error', message: 'Failed to update alumni' })
          },
        },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({ type: 'success', message: 'Alumni added successfully' })
          setShowFormModal(false)
        },
        onError: () => {
          toast({ type: 'error', message: 'Failed to add alumni' })
        },
      })
    }
  }

  const handleDelete = () => {
    if (!deletingAlumni) return
    deleteMutation.mutate(deletingAlumni.id, {
      onSuccess: () => {
        toast({ type: 'success', message: 'Alumni removed from directory' })
        setDeletingAlumni(null)
      },
      onError: () => {
        toast({ type: 'error', message: 'Failed to delete alumni' })
      },
    })
  }

  const openEdit = (a: AlumniData) => {
    setEditingAlumni(a)
    setShowFormModal(true)
  }

  const openCreate = () => {
    setEditingAlumni(null)
    setShowFormModal(true)
  }

  // ---- Stats cards config ----

  const statCards = [
    {
      label: 'Total Alumni',
      value: stats?.total_alumni ?? 0,
      icon: Users,
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    },
    {
      label: 'Camper Alumni',
      value: stats?.camper_alumni ?? 0,
      icon: User,
      color: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    {
      label: 'Staff Alumni',
      value: stats?.staff_alumni ?? 0,
      icon: Briefcase,
      color: 'from-purple-500 to-violet-500',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
    },
    {
      label: 'Avg Years Attended',
      value: stats?.avg_years_attended ?? 0,
      icon: Calendar,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      isDecimal: true,
    },
  ]

  // ---- Render ----

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alumni Network</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect with former campers and staff members
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Alumni
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {card.isDecimal ? (
                    (stats?.avg_years_attended ?? 0).toFixed(1)
                  ) : (
                    <AnimatedNumber value={card.value} />
                  )}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  card.bg,
                )}
              >
                <card.icon className={cn('h-5 w-5', card.text)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Roles</option>
            <option value="camper">Camper</option>
            <option value="staff">Staff</option>
            <option value="both">Both</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="relative">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Years</option>
            {graduationYears.map((y) => (
              <option key={y} value={y}>
                Class of {y}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Alumni grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : !alumni || alumni.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <GraduationCap className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No alumni found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {debouncedSearch || roleFilter || yearFilter
              ? 'Try adjusting your search or filters.'
              : 'Get started by adding your first alumni record.'}
          </p>
          {!debouncedSearch && !roleFilter && !yearFilter && (
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Alumni
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {alumni.map((a) => (
            <AlumniCard
              key={a.id}
              alumni={a}
              onEdit={() => openEdit(a)}
              onDelete={() => setDeletingAlumni(a)}
            />
          ))}
        </div>
      )}

      {/* Result count */}
      {alumni && alumni.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          Showing {alumni.length} alumni record{alumni.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Modals */}
      {showFormModal && (
        <AlumniFormModal
          alumni={editingAlumni}
          onClose={() => {
            setShowFormModal(false)
            setEditingAlumni(null)
          }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {deletingAlumni && (
        <DeleteConfirmModal
          alumni={deletingAlumni}
          onClose={() => setDeletingAlumni(null)}
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
