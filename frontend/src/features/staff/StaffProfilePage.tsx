/**
 * Camp Connect - Staff Profile Page
 * Detailed view of a staff member's profile with tabbed sections.
 */

import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Award,
  Shield,
  Clock,
  CheckCircle2,
  Loader2,
  User,
  Calendar,
  Tags,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  X,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useStaffProfile,
  useUpdateStaffCategory,
  useCertificationTypes,
  useStaffCertifications,
  useAddStaffCertification,
  useUpdateStaffCertification,
  useDeleteStaffCertification,
  useJobTitles,
  useUpdateStaffJobTitle,
} from '@/hooks/useStaff'
import type {
  StaffCategory,
  StaffCertificationRecord,
  StaffCertificationCreate,
  StaffCertificationUpdate,
  CertificationType,
} from '@/hooks/useStaff'
import { useToast } from '@/components/ui/Toast'
import { useOnboardingDetail } from '@/hooks/useOnboarding'

type TabKey = 'overview' | 'certifications' | 'financial' | 'onboarding'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'financial', label: 'Financial' },
  { key: 'onboarding', label: 'Onboarding Status' },
]

function statusBadge(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    case 'onboarding':
      return 'bg-amber-50 text-amber-700 ring-amber-600/20'
    case 'inactive':
    default:
      return 'bg-gray-50 text-gray-600 ring-gray-500/20'
  }
}

const CATEGORY_OPTIONS: { value: StaffCategory; label: string }[] = [
  { value: null, label: 'Not Set' },
  { value: 'full_time', label: 'Full-time Staff' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'director', label: 'Director' },
]

function categoryLabel(cat: StaffCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? 'Not Set'
}

export function StaffProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const { data: profile, isLoading, error } = useStaffProfile(id)
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingDetail(id)
  const updateCategory = useUpdateStaffCategory()
  const updateJobTitle = useUpdateStaffJobTitle()
  const { data: jobTitles = [] } = useJobTitles()
  const { toast } = useToast()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/staff"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load staff profile. Please try again.
        </div>
      </div>
    )
  }

  const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/app/staff"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Link>

      {/* Profile Header */}
      <div className="flex items-center gap-4">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={`${profile.first_name} ${profile.last_name}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-xl font-semibold text-blue-600">
            {initials}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {profile.first_name} {profile.last_name}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            {profile.role_name && (
              <span className="text-sm text-gray-500">{profile.role_name}</span>
            )}
            {profile.department && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">{profile.department}</span>
              </>
            )}
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
                statusBadge(profile.status)
              )}
            >
              {profile.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {profile.email}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="h-4 w-4" />
              <span>Phone</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {profile.phone ?? '--'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Building2 className="h-4 w-4" />
              <span>Department</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {profile.department ?? '--'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Role</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {profile.role_name ?? '--'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Tags className="h-4 w-4" />
              <span>Staff Category</span>
            </div>
            <select
              value={profile.staff_category ?? ''}
              onChange={async (e) => {
                const val = e.target.value || null
                try {
                  await updateCategory.mutateAsync({
                    userId: profile.user_id,
                    staffCategory: val as StaffCategory,
                  })
                  toast({
                    type: 'success',
                    message: `Category updated to ${categoryLabel(val as StaffCategory)}.`,
                  })
                } catch {
                  toast({ type: 'error', message: 'Failed to update category.' })
                }
              }}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Not Set</option>
              <option value="full_time">Full-time Staff</option>
              <option value="counselor">Counselor</option>
              <option value="director">Director</option>
            </select>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Briefcase className="h-4 w-4" />
              <span>Job Title</span>
            </div>
            <select
              value={profile.job_title_id ?? ''}
              onChange={async (e) => {
                const val = e.target.value || null
                try {
                  await updateJobTitle.mutateAsync({
                    userId: profile.user_id,
                    jobTitleId: val,
                  })
                  toast({
                    type: 'success',
                    message: 'Job title updated.',
                  })
                } catch {
                  toast({ type: 'error', message: 'Failed to update job title.' })
                }
              }}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Not Set</option>
              {jobTitles.map((jt) => (
                <option key={jt.id} value={jt.id}>
                  {jt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Hire Date</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {profile.hire_date
                ? new Date(profile.hire_date).toLocaleDateString()
                : '--'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="h-4 w-4" />
              <span>Status</span>
            </div>
            <p className="mt-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
                  statusBadge(profile.status)
                )}
              >
                {profile.status}
              </span>
            </p>
          </div>

          {/* Emergency Contacts */}
          {profile.emergency_contacts && profile.emergency_contacts.length > 0 && (
            <div className="col-span-full">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Emergency Contacts
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profile.emergency_contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-100 bg-gray-50/50 p-4"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {contact.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {contact.relationship}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{contact.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'certifications' && (
        <CertificationsTab userId={id!} />
      )}

      {activeTab === 'financial' && (
        <div className="space-y-4">
          {profile.financial_info ? (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-semibold text-gray-900">Compensation</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">Pay Rate</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {profile.financial_info.pay_rate
                      ? `$${Number(profile.financial_info.pay_rate).toFixed(2)}`
                      : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rate Type</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 capitalize">
                    {profile.financial_info.rate_type ?? '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {profile.financial_info.start_date
                      ? new Date(profile.financial_info.start_date).toLocaleDateString()
                      : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {profile.financial_info.end_date
                      ? new Date(profile.financial_info.end_date).toLocaleDateString()
                      : '--'}
                  </p>
                </div>
              </div>
              {profile.financial_info.notes && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-700">{profile.financial_info.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
              <DollarSign className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                No financial information on file.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Financial details can be set during the onboarding process.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          {onboardingLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}

          {!onboardingLoading && !onboarding && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
              <Clock className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                No onboarding record found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This staff member doesn&apos;t have an onboarding record yet.
              </p>
            </div>
          )}

          {!onboardingLoading && onboarding && (() => {
            const steps = [
              {
                label: 'Personal Information',
                description: 'Name, address, date of birth, and contact details',
                done: onboarding.personal_info_completed,
                icon: User,
              },
              {
                label: 'Emergency Contacts',
                description: 'At least one emergency contact with phone number',
                done: onboarding.emergency_contacts_completed,
                icon: Phone,
              },
              {
                label: 'Certifications',
                description: 'CPR, First Aid, and other required certifications',
                done: onboarding.certifications_completed,
                icon: Award,
              },
              {
                label: 'Policy Acknowledgments',
                description: 'Review and accept organization policies',
                done: onboarding.policy_acknowledgments_completed,
                icon: Shield,
              },
              {
                label: 'Payroll Setup',
                description: 'Pay rate, bank details, and tax information',
                done: onboarding.payroll_info_completed,
                icon: DollarSign,
              },
            ]
            const completedCount = steps.filter((s) => s.done).length
            const totalSteps = steps.length
            const progressPercent = Math.round((completedCount / totalSteps) * 100)

            return (
              <>
                {/* Progress Header */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Onboarding Progress</h3>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {completedCount} of {totalSteps} steps completed
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset',
                        onboarding.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                          : onboarding.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                            : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                      )}
                    >
                      {onboarding.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {onboarding.status === 'in_progress' && <Clock className="h-3.5 w-3.5" />}
                      {onboarding.status === 'completed'
                        ? 'Completed'
                        : onboarding.status === 'in_progress'
                          ? 'In Progress'
                          : onboarding.status}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div>
                    <div className="h-3 w-full rounded-full bg-gray-100">
                      <div
                        className={cn(
                          'h-3 rounded-full transition-all duration-500',
                          progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-right text-xs font-medium text-gray-500">
                      {progressPercent}%
                    </p>
                  </div>
                </div>

                {/* Step Cards */}
                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon
                    return (
                      <div
                        key={step.label}
                        className={cn(
                          'rounded-xl border p-5 transition-colors',
                          step.done
                            ? 'border-emerald-100 bg-emerald-50/30'
                            : 'border-gray-100 bg-white shadow-sm'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {step.done ? (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              </div>
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-sm font-semibold text-gray-400">
                                {index + 1}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <StepIcon className={cn('h-4 w-4', step.done ? 'text-emerald-600' : 'text-gray-400')} />
                              <h4 className={cn(
                                'text-sm font-medium',
                                step.done ? 'text-emerald-800' : 'text-gray-900'
                              )}>
                                {step.label}
                              </h4>
                            </div>
                            <p className={cn(
                              'mt-1 text-xs',
                              step.done ? 'text-emerald-600' : 'text-gray-500'
                            )}>
                              {step.done ? 'Completed' : step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {onboarding.completed_at && (
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm font-medium text-emerald-800">
                        Onboarding completed on{' '}
                        {new Date(onboarding.completed_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// --- Certifications Tab with full CRUD ---

const CERT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700' },
  valid: { label: 'Valid', color: 'bg-emerald-50 text-emerald-700' },
  expired: { label: 'Expired', color: 'bg-red-50 text-red-700' },
  revoked: { label: 'Revoked', color: 'bg-gray-100 text-gray-600' },
}

function CertificationsTab({ userId }: { userId: string }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCert, setEditingCert] = useState<StaffCertificationRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { data: certs = [], isLoading } = useStaffCertifications(userId)
  const { data: certTypes = [] } = useCertificationTypes()
  const deleteCert = useDeleteStaffCertification()
  const { toast } = useToast()

  const certTypeMap = useMemo(() => {
    const map = new Map<string, CertificationType>()
    for (const ct of certTypes) map.set(ct.id, ct)
    return map
  }, [certTypes])

  const handleDelete = async (certId: string) => {
    try {
      await deleteCert.mutateAsync({ certId, userId })
      toast({ type: 'success', message: 'Certification deleted' })
      setDeletingId(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete certification' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Certification
        </button>
      </div>

      {certs.length > 0 ? (
        <div className="space-y-3">
          {certs.map((cert) => {
            const statusInfo = CERT_STATUS_LABELS[cert.status] || CERT_STATUS_LABELS.pending
            const typeName = cert.certification_type_name || certTypeMap.get(cert.certification_type_id)?.name || 'Unknown'
            return (
              <div
                key={cert.id}
                className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{typeName}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {cert.notes && <p className="mt-0.5 text-xs text-gray-500">{cert.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  {cert.issued_date && (
                    <p className="text-xs text-gray-400">
                      Issued: {new Date(cert.issued_date).toLocaleDateString()}
                    </p>
                  )}
                  {cert.expiry_date && (
                    <p
                      className={cn(
                        'text-xs',
                        new Date(cert.expiry_date) < new Date()
                          ? 'text-red-500 font-medium'
                          : 'text-gray-400'
                      )}
                    >
                      Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingCert(cert)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(cert.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
          <Award className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No certifications on file</p>
          <p className="mt-1 text-sm text-gray-500">Add certifications to track staff qualifications.</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <CertificationRecordModal
          userId={userId}
          certTypes={certTypes}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editingCert && (
        <CertificationRecordModal
          userId={userId}
          certTypes={certTypes}
          existing={editingCert}
          onClose={() => setEditingCert(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Delete Certification</h3>
                <p className="text-xs text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to remove this certification record?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deletingId)} disabled={deleteCert.isPending} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleteCert.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Certification Add/Edit Modal ---

function CertificationRecordModal({
  userId,
  certTypes,
  existing,
  onClose,
}: {
  userId: string
  certTypes: CertificationType[]
  existing?: StaffCertificationRecord
  onClose: () => void
}) {
  const isEdit = !!existing
  const [certTypeId, setCertTypeId] = useState(existing?.certification_type_id || '')
  const [certStatus, setCertStatus] = useState(existing?.status || 'pending')
  const [issuedDate, setIssuedDate] = useState(existing?.issued_date?.split('T')[0] || '')
  const [expiryDate, setExpiryDate] = useState(existing?.expiry_date?.split('T')[0] || '')
  const [notes, setNotes] = useState(existing?.notes || '')
  const addCert = useAddStaffCertification()
  const updateCert = useUpdateStaffCertification()
  const { toast } = useToast()

  const handleSave = async () => {
    if (!isEdit && !certTypeId) return
    try {
      if (isEdit && existing) {
        const data: StaffCertificationUpdate = {
          status: certStatus,
          issued_date: issuedDate || null,
          expiry_date: expiryDate || null,
          notes: notes || null,
        }
        await updateCert.mutateAsync({ certId: existing.id, userId, data })
        toast({ type: 'success', message: 'Certification updated' })
      } else {
        const data: StaffCertificationCreate = {
          certification_type_id: certTypeId,
          status: certStatus,
          issued_date: issuedDate || null,
          expiry_date: expiryDate || null,
          notes: notes || null,
        }
        await addCert.mutateAsync({ userId, data })
        toast({ type: 'success', message: 'Certification added' })
      }
      onClose()
    } catch {
      toast({ type: 'error', message: `Failed to ${isEdit ? 'update' : 'add'} certification` })
    }
  }

  const isPending = addCert.isPending || updateCert.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit' : 'Add'} Certification</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="space-y-4 p-6">
          {/* Certification Type */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Certification Type</label>
              {certTypes.length > 0 ? (
                <select
                  value={certTypeId}
                  onChange={(e) => setCertTypeId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a certification type...</option>
                  {certTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} {ct.is_required ? '(Required)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">No certification types configured. Create them in Settings first.</p>
              )}
            </div>
          )}
          {isEdit && existing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Certification Type</label>
              <p className="text-sm text-gray-900">{existing.certification_type_name || 'Unknown'}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={certStatus}
              onChange={(e) => setCertStatus(e.target.value as StaffCertificationRecord['status'])}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="valid">Valid</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Issued Date</label>
              <input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Optional notes about this certification..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={(!isEdit && !certTypeId) || isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Certification'}
          </button>
        </div>
      </div>
    </div>
  )
}
