/**
 * Camp Connect - Staff Profile Page
 * Detailed view of a staff member's profile with tabbed sections.
 */

import { useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStaffProfile } from '@/hooks/useStaff'
import { useOnboardingDetail } from '@/hooks/useOnboarding'

type TabKey = 'overview' | 'certifications' | 'onboarding'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'certifications', label: 'Certifications' },
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

export function StaffProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const { data: profile, isLoading, error } = useStaffProfile(id)
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingDetail(id)

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
        <div className="space-y-3">
          {profile.certifications && profile.certifications.length > 0 ? (
            profile.certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-500">{cert.issuing_authority}</p>
                </div>
                <div className="text-right">
                  {cert.certificate_number && (
                    <p className="text-xs text-gray-500">#{cert.certificate_number}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Issued: {new Date(cert.issue_date).toLocaleDateString()}
                  </p>
                  {cert.expiry_date && (
                    <p
                      className={cn(
                        'text-xs',
                        new Date(cert.expiry_date) < new Date()
                          ? 'text-red-500'
                          : 'text-gray-400'
                      )}
                    >
                      Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
              <Award className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                No certifications on file.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          {onboardingLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}

          {!onboardingLoading && !onboarding && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
              <Clock className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                No onboarding record found for this staff member.
              </p>
            </div>
          )}

          {!onboardingLoading && onboarding && (
            <>
              {/* Onboarding Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
                    onboarding.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                      : onboarding.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                        : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                  )}
                >
                  {onboarding.status === 'in_progress' ? 'In Progress' : onboarding.status}
                </span>
              </div>

              {/* Step Checklist */}
              <div className="space-y-2">
                {[
                  { label: 'Personal Info', done: onboarding.personal_info_completed },
                  { label: 'Emergency Contacts', done: onboarding.emergency_contacts_completed },
                  { label: 'Certifications', done: onboarding.certifications_completed },
                  { label: 'Policy Acknowledgments', done: onboarding.policy_acknowledgments_completed },
                  { label: 'Payroll Setup', done: onboarding.payroll_info_completed },
                ].map((step) => (
                  <div
                    key={step.label}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3',
                      step.done
                        ? 'border-emerald-100 bg-emerald-50/50'
                        : 'border-gray-100 bg-white'
                    )}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        step.done ? 'font-medium text-emerald-800' : 'text-gray-600'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {onboarding.completed_at && (
                <p className="text-xs text-gray-500">
                  Completed on{' '}
                  {new Date(onboarding.completed_at).toLocaleDateString()}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
