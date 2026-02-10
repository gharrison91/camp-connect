import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Heart,
  Shield,
  Phone,
  Mail,
  Camera,
  MessageSquare,
  DollarSign,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Edit,
  ChevronRight,
  ChevronDown,
  Upload,
  FileText,
  Download,
  X,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCamperProfile } from '@/hooks/useCamperProfile'
import { useUploadPhoto } from '@/hooks/usePhotos'
import { useUploadProfilePhoto } from '@/hooks/useCampers'
import { useIndexCamperFace } from '@/hooks/useFaceRecognition'
import { useFormSubmissions } from '@/hooks/useForms'
import { useToast } from '@/components/ui/Toast'
import { CamperEditModal } from './CamperEditModal'
import { ComposeMessageModal } from '@/features/communications/CommunicationsPage'
import type {
  CamperProfile,
  CamperHealthForm,
  CamperPhoto,
  CamperProfileContact,
} from '@/hooks/useCamperProfile'

// ─── Tabs ──────────────────────────────────────────────────────
type Tab = 'overview' | 'health' | 'family' | 'events' | 'photos' | 'forms' | 'communications'

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'health', label: 'Health & Safety', icon: Shield },
  { key: 'family', label: 'Family & Contacts', icon: Users },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'photos', label: 'Photos', icon: Camera },
  { key: 'forms', label: 'Forms', icon: FileText },
  { key: 'communications', label: 'Communications', icon: MessageSquare },
]

// ─── Helpers ───────────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '$0.00'
  return `$${Number(value).toFixed(2)}`
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// ─── Status badge configs ──────────────────────────────────────
const registrationStatusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  waitlisted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
}

const paymentStatusStyles: Record<string, string> = {
  unpaid: 'bg-red-50 text-red-700 ring-red-600/20',
  deposit_paid: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  refunded: 'bg-gray-50 text-gray-600 ring-gray-500/20',
}

const healthFormStatusStyles: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  submitted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  overdue: 'bg-red-50 text-red-700 ring-red-600/20',
}

const communicationStatusStyles: Record<string, string> = {
  queued: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  failed: 'bg-red-50 text-red-700 ring-red-600/20',
  bounced: 'bg-amber-50 text-amber-700 ring-amber-600/20',
}

function StatusBadge({ status, styles }: { status: string; styles: Record<string, string> }) {
  const className = styles[status] ?? 'bg-gray-50 text-gray-600 ring-gray-500/20'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize',
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Sub-components ────────────────────────────────────────────

function InfoCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-gray-900',
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color?: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className={cn('text-lg font-semibold', color)}>{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
      <Icon className="h-10 w-10 text-gray-300" />
      <p className="mt-3 text-sm font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  )
}

// ─── Tab Content Components ────────────────────────────────────

function OverviewTab({ profile }: { profile: CamperProfile }) {
  const pendingHealthForms = profile.health_forms.filter((f) => f.status === 'pending' || f.status === 'overdue').length
  const recentRegistrations = profile.registrations.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <InfoCard
          icon={Calendar}
          label="Date of Birth"
          value={profile.date_of_birth ? formatDate(profile.date_of_birth) : '--'}
        />
        <InfoCard icon={User} label="Age" value={profile.age != null ? String(profile.age) : '--'} />
        <InfoCard icon={User} label="Gender" value={profile.gender ?? '--'} />
        <InfoCard icon={Activity} label="School" value={profile.school ?? '--'} sub={profile.grade ? `Grade ${profile.grade}` : undefined} />
        <InfoCard
          icon={MapPin}
          label="Location"
          value={
            profile.city && profile.state
              ? `${profile.city}, ${profile.state}`
              : profile.city || profile.state || '--'
          }
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Events" value={profile.registrations.length} icon={Calendar} />
        <StatCard
          label="Balance Due"
          value={formatCurrency(profile.financial_summary.balance)}
          icon={DollarSign}
          color={profile.financial_summary.balance > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
        <StatCard
          label="Health Forms Pending"
          value={pendingHealthForms}
          icon={Shield}
          color={pendingHealthForms > 0 ? 'text-amber-600' : 'text-gray-900'}
        />
      </div>

      {/* Family Card */}
      {profile.family && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">
              {profile.family.family_name} Family
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Siblings */}
            {profile.family.campers.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Siblings</p>
                <div className="space-y-2">
                  {profile.family.campers
                    .filter((c) => c.id !== profile.id)
                    .map((sibling) => (
                      <Link
                        key={sibling.id}
                        to={`/app/campers/${sibling.id}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-gray-50"
                      >
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                          {sibling.first_name} {sibling.last_name}
                        </span>
                        <div className="flex items-center gap-2">
                          {sibling.age != null && (
                            <span className="text-xs text-gray-500">Age {sibling.age}</span>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  {profile.family.campers.filter((c) => c.id !== profile.id).length === 0 && (
                    <p className="text-sm text-gray-500">No siblings in family</p>
                  )}
                </div>
              </div>
            )}
            {/* Family Contacts */}
            {profile.family.contacts.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Family Contacts</p>
                <div className="space-y-3">
                  {profile.family.contacts.map((contact) => (
                    <div key={contact.id} className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {contact.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Registrations */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Registrations</h3>
        {recentRegistrations.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No registrations yet"
            description="This camper has not been registered for any events."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Event</th>
                    <th className="px-6 py-3">Dates</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="hidden px-6 py-3 sm:table-cell">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentRegistrations.map((reg) => (
                    <tr key={reg.id} className="transition-colors hover:bg-gray-50/80">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        <Link to={`/app/events/${reg.event.id}`} className="text-blue-600 hover:text-blue-700">
                          {reg.event.name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {formatDate(reg.event.start_date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge status={reg.status} styles={registrationStatusStyles} />
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                        <StatusBadge status={reg.payment_status} styles={paymentStatusStyles} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function HealthTab({ profile }: { profile: CamperProfile }) {
  const allergies = profile.allergies ?? []
  const dietaryRestrictions = profile.dietary_restrictions ?? []

  return (
    <div className="space-y-6">
      {/* Allergies */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <h3 className="text-base font-semibold text-gray-900">Allergies</h3>
        </div>
        {allergies.length === 0 ? (
          <p className="text-sm text-gray-500">No allergies on file</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20"
              >
                {allergy}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dietary Restrictions */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900">Dietary Restrictions</h3>
        </div>
        {dietaryRestrictions.length === 0 ? (
          <p className="text-sm text-gray-500">No dietary restrictions on file</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dietaryRestrictions.map((restriction, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
              >
                {restriction}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Health Forms */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">Health Forms</h3>
        </div>
        {profile.health_forms.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No health forms"
            description="No health forms have been assigned to this camper."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {profile.health_forms.map((form) => (
              <HealthFormCard key={form.id} form={form} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HealthFormCard({ form }: { form: CamperHealthForm }) {
  const statusIcon =
    form.status === 'approved' ? CheckCircle :
    form.status === 'rejected' ? XCircle :
    Clock

  const statusIconColor =
    form.status === 'approved' ? 'text-emerald-500' :
    form.status === 'rejected' ? 'text-red-500' :
    'text-amber-500'

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = statusIcon
            return <Icon className={cn('h-5 w-5', statusIconColor)} />
          })()}
          <h4 className="text-sm font-medium text-gray-900">{form.template_name}</h4>
        </div>
        <StatusBadge status={form.status} styles={healthFormStatusStyles} />
      </div>
      <div className="mt-3 space-y-1">
        {form.event_name && (
          <p className="text-xs text-gray-500">
            Event: <span className="font-medium text-gray-700">{form.event_name}</span>
          </p>
        )}
        {form.due_date && (
          <p className="text-xs text-gray-500">
            Due: <span className="font-medium text-gray-700">{formatDate(form.due_date)}</span>
          </p>
        )}
        {form.submitted_at && (
          <p className="text-xs text-gray-500">
            Submitted: <span className="font-medium text-gray-700">{formatDateTime(form.submitted_at)}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function FamilyContactsTab({ profile }: { profile: CamperProfile }) {
  return (
    <div className="space-y-6">
      {/* Contacts */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Contacts</h3>
        {profile.contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts linked"
            description="No contacts have been linked to this camper yet."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.contacts.map((contact) => (
              <ContactCard key={contact.contact_id} contact={contact} />
            ))}
          </div>
        )}
      </div>

      {/* Family Section */}
      {profile.family ? (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">
              {profile.family.family_name} Family
            </h3>
          </div>

          {/* Siblings */}
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Campers</p>
            <div className="space-y-2">
              {profile.family.campers.map((camper) => (
                <Link
                  key={camper.id}
                  to={`/app/campers/${camper.id}`}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 transition-colors',
                    camper.id === profile.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      camper.id === profile.id ? 'text-blue-700' : 'text-blue-600 hover:text-blue-700'
                    )}
                  >
                    {camper.first_name} {camper.last_name}
                    {camper.id === profile.id && (
                      <span className="ml-2 text-xs text-blue-500">(current)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {camper.age != null && (
                      <span className="text-xs text-gray-500">Age {camper.age}</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Family Contacts */}
          {profile.family.contacts.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Family Contacts</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profile.family.contacts.map((contact) => (
                  <div key={contact.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">Family</h3>
          </div>
          <p className="text-sm text-gray-500">This camper is not linked to a family.</p>
        </div>
      )}
    </div>
  )
}

function ContactCard({ contact }: { contact: CamperProfileContact }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {contact.first_name} {contact.last_name}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 capitalize">{contact.relationship_type}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {contact.is_primary && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
              <Star className="h-3 w-3" />
              Primary
            </span>
          )}
          {contact.is_emergency && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
              <AlertTriangle className="h-3 w-3" />
              Emergency
            </span>
          )}
          {contact.is_authorized_pickup && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle className="h-3 w-3" />
              Pickup
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {contact.email && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            {contact.phone}
          </div>
        )}
      </div>
    </div>
  )
}

function EventsTab({ profile }: { profile: CamperProfile }) {
  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Total Due</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatCurrency(profile.financial_summary.total_due)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Total Paid</p>
          <p className="mt-1 text-xl font-semibold text-emerald-600">
            {formatCurrency(profile.financial_summary.total_paid)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Balance</p>
          <p
            className={cn(
              'mt-1 text-xl font-semibold',
              profile.financial_summary.balance > 0 ? 'text-red-600' : 'text-emerald-600'
            )}
          >
            {formatCurrency(profile.financial_summary.balance)}
          </p>
        </div>
      </div>

      {/* Registrations Table */}
      {profile.registrations.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No registrations"
          description="This camper has not been registered for any events."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Event</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Dates</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="hidden px-6 py-3 md:table-cell">Payment</th>
                  <th className="hidden px-6 py-3 lg:table-cell">Price</th>
                  <th className="hidden px-6 py-3 md:table-cell">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profile.registrations.map((reg) => (
                  <tr key={reg.id} className="transition-colors hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <Link to={`/app/events/${reg.event.id}`} className="text-blue-600 hover:text-blue-700">
                        {reg.event.name}
                      </Link>
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 sm:table-cell">
                      {formatDate(reg.event.start_date)} - {formatDate(reg.event.end_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={reg.status} styles={registrationStatusStyles} />
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 md:table-cell">
                      <StatusBadge status={reg.payment_status} styles={paymentStatusStyles} />
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 lg:table-cell">
                      {reg.event.price != null ? formatCurrency(reg.event.price) : '--'}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                      {formatDateTime(reg.registered_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Photo Lightbox Component ──────────────────────────────────
function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  photos: CamperPhoto[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const photo = photos[currentIndex]
  if (!photo) return null

  const handleDownload = async () => {
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
    } catch {
      // Fallback: open in new tab
      window.open(photo.url, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative flex h-full w-full flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent z-10">
          <div className="text-sm text-white/80">
            {currentIndex + 1} / {photos.length}
            {photo.caption && <span className="ml-3 text-white">{photo.caption}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              title="Download photo"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image */}
        <img
          src={photo.url}
          alt={photo.caption ?? photo.file_name}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        />

        {/* Nav buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-6 py-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span>{formatDateTime(photo.created_at)}</span>
            {photo.similarity != null && (
              <span className="inline-flex items-center rounded-full bg-blue-500/30 px-2.5 py-0.5 text-xs font-medium text-blue-200">
                {Math.round(photo.similarity)}% match
              </span>
            )}
            {photo.event_name && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                <Calendar className="h-3 w-3" />
                {photo.event_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Event Photo Group Component ──────────────────────────────
function EventPhotoGroup({
  eventName,
  photos,
  allPhotos,
  onOpenLightbox,
}: {
  eventName: string
  photos: CamperPhoto[]
  allPhotos: CamperPhoto[]
  onOpenLightbox: (index: number) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  const handleDownloadAll = async () => {
    for (const photo of photos) {
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
        // Small delay between downloads to prevent browser blocking
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch {
        // Skip failed downloads
      }
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50/50"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform',
              collapsed && '-rotate-90'
            )}
          />
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-semibold text-gray-900">{eventName}</h4>
          </div>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDownloadAll()
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          title={`Download all ${photos.length} photos`}
        >
          <Download className="h-3.5 w-3.5" />
          Download All
        </button>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => {
              const globalIndex = allPhotos.findIndex((p) => p.id === photo.id)
              return (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onClick={() => onOpenLightbox(globalIndex)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PhotosTab({
  profile,
  onUploadProfilePhoto,
  onUploadAlbumPhoto,
  profilePhotoInputRef,
  albumPhotoInputRef,
  isUploadingProfile,
  isUploadingAlbum,
  onSyncFace,
  isSyncingFace,
}: {
  profile: CamperProfile
  onUploadProfilePhoto: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUploadAlbumPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void
  profilePhotoInputRef: React.RefObject<HTMLInputElement | null>
  albumPhotoInputRef: React.RefObject<HTMLInputElement | null>
  isUploadingProfile?: boolean
  isUploadingAlbum?: boolean
  onSyncFace?: () => void
  isSyncingFace?: boolean
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Group photos by event
  const photosByEvent = profile.photos.reduce<Record<string, CamperPhoto[]>>((acc, photo) => {
    const key = photo.event_name ?? '__ungrouped__'
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {})

  const eventNames = Object.keys(photosByEvent).filter((k) => k !== '__ungrouped__').sort()
  const ungroupedPhotos = photosByEvent['__ungrouped__'] ?? []

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const prevPhoto = () => {
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : profile.photos.length - 1)
  }
  const nextPhoto = () => {
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex < profile.photos.length - 1 ? lightboxIndex + 1 : 0)
  }

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') prevPhoto()
    if (e.key === 'ArrowRight') nextPhoto()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex])

  useEffect(() => {
    if (lightboxIndex === null) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, handleKeyDown])

  return (
    <div className="space-y-6">
      {/* Reference / Profile Photo */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Profile Photo</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              This is the camper&apos;s primary identification photo. Stored separately from the photo album.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {profile.reference_photo_url && onSyncFace && (
              <button
                onClick={onSyncFace}
                disabled={isSyncingFace}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
                title="Register this face with AI so the camper is automatically detected in future photo uploads"
              >
                {isSyncingFace ? (
                  <Upload className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Activity className="h-3.5 w-3.5" />
                )}
                {isSyncingFace ? 'Syncing...' : 'Sync Face AI'}
              </button>
            )}
            <button
              onClick={() => profilePhotoInputRef.current?.click()}
              disabled={isUploadingProfile}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {isUploadingProfile ? (
                <Upload className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              {isUploadingProfile ? 'Uploading...' : 'Update Profile Photo'}
            </button>
          </div>
          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/*"
            onChange={onUploadProfilePhoto}
            className="hidden"
          />
        </div>
        {profile.reference_photo_url ? (
          <div className="flex justify-center">
            <img
              src={profile.reference_photo_url}
              alt={`${profile.first_name} ${profile.last_name} profile photo`}
              className="h-48 w-48 rounded-xl object-cover shadow-sm"
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <Camera className="h-12 w-12" />
            </div>
          </div>
        )}
      </div>

      {/* Upload to Album */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Photo Album</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Upload photos to this camper&apos;s album. Photos are auto-renamed with today&apos;s date and your camp name.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {profile.photos.length > 0 && (
              <button
                onClick={async () => {
                  for (const photo of profile.photos) {
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
                      await new Promise((resolve) => setTimeout(resolve, 300))
                    } catch { /* skip */ }
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                title={`Download all ${profile.photos.length} photos`}
              >
                <Download className="h-3.5 w-3.5" />
                Download All ({profile.photos.length})
              </button>
            )}
            <button
              onClick={() => albumPhotoInputRef.current?.click()}
              disabled={isUploadingAlbum}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploadingAlbum ? (
                <Upload className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {isUploadingAlbum ? 'Uploading...' : 'Upload to Album'}
            </button>
          </div>
          <input
            ref={albumPhotoInputRef}
            type="file"
            accept="image/*"
            onChange={onUploadAlbumPhoto}
            className="hidden"
          />
        </div>
      </div>

      {/* Photo Grid — grouped by event */}
      {profile.photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No photos found"
          description="No photos found for this camper. Upload photos above or they will appear here when detected via face recognition."
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">
            Detected in Photos ({profile.photos.length})
          </h3>

          {/* Event-grouped sections */}
          {eventNames.map((eventName) => (
            <EventPhotoGroup
              key={eventName}
              eventName={eventName}
              photos={photosByEvent[eventName]}
              allPhotos={profile.photos}
              onOpenLightbox={openLightbox}
            />
          ))}

          {/* Ungrouped photos */}
          {ungroupedPhotos.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Camera className="h-4 w-4 text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-900">
                    {eventNames.length > 0 ? 'Other Photos' : 'All Photos'}
                  </h4>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {ungroupedPhotos.length} photo{ungroupedPhotos.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {ungroupedPhotos.map((photo) => {
                    const globalIndex = profile.photos.findIndex((p) => p.id === photo.id)
                    return (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        onClick={() => openLightbox(globalIndex)}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={profile.photos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}
    </div>
  )
}

function PhotoCard({ photo, onClick }: { photo: CamperPhoto; onClick?: () => void }) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
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
    } catch {
      window.open(photo.url, '_blank')
    }
  }

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={photo.url}
          alt={photo.caption ?? photo.file_name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <button
            onClick={handleDownload}
            className="rounded-full bg-white/90 p-2 text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-white"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-3">
        {photo.caption && (
          <p className="text-xs font-medium text-gray-900 truncate">{photo.caption}</p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-gray-500">{formatDateTime(photo.created_at)}</p>
          {photo.similarity != null && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {Math.round(photo.similarity)}% match
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function FormsTab({ camperId }: { camperId: string }) {
  const { data, isLoading } = useFormSubmissions({ camper_id: camperId })
  const submissions = data?.items ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No form submissions"
        description="No forms have been submitted for this camper yet."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3">Form</th>
              <th className="px-6 py-3">Status</th>
              <th className="hidden px-6 py-3 sm:table-cell">Submitted</th>
              <th className="hidden px-6 py-3 md:table-cell">Submitted By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {submissions.map((sub) => (
              <tr key={sub.id} className="transition-colors hover:bg-gray-50/80">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {sub.template_name ?? 'Unknown Form'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize',
                      sub.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                        : sub.status === 'draft'
                          ? 'bg-gray-50 text-gray-600 ring-gray-500/20'
                          : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                    )}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 sm:table-cell">
                  {sub.submitted_at ? formatDateTime(sub.submitted_at) : '--'}
                </td>
                <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                  {sub.submitted_by_name ?? sub.submitted_by_email ?? '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CommunicationsTab({ profile }: { profile: CamperProfile }) {
  return (
    <div className="space-y-6">
      {profile.communications.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No communications"
          description="No messages have been sent regarding this camper."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Channel</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Status</th>
                  <th className="hidden px-6 py-3 md:table-cell">Recipient</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profile.communications.map((comm) => (
                  <tr key={comm.id} className="transition-colors hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(comm.sent_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                          comm.channel === 'email'
                            ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                            : 'bg-violet-50 text-violet-700 ring-violet-600/20'
                        )}
                      >
                        {comm.channel === 'email' ? 'Email' : 'SMS'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {comm.subject ?? '--'}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                      <StatusBadge status={comm.status} styles={communicationStatusStyles} />
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                      {comm.to_address ?? '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page Component ───────────────────────────────────────

export function CamperDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [composeChannel, setComposeChannel] = useState<'sms' | 'email'>('email')
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const albumPhotoInputRef = useRef<HTMLInputElement>(null)

  const { data: profile, isLoading, error, refetch } = useCamperProfile(id)
  const uploadProfilePhoto = useUploadProfilePhoto()
  const uploadAlbumPhoto = useUploadPhoto()
  const indexFace = useIndexCamperFace()
  const { toast } = useToast()

  // Upload profile photo — goes directly to camper's reference_photo_url (NOT the photo album)
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    try {
      await uploadProfilePhoto.mutateAsync({ camperId: id, file })
      refetch()
      toast({ type: 'success', message: 'Profile photo updated!' })
    } catch {
      toast({ type: 'error', message: 'Failed to upload profile photo.' })
    }
    if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = ''
  }

  // Upload album photo — creates a Photo record with auto-rename (date + camp name)
  const handleAlbumPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    try {
      await uploadAlbumPhoto.mutateAsync({
        file,
        category: 'camper',
        entity_id: id,
      })
      refetch()
      toast({ type: 'success', message: 'Photo added to album!' })
    } catch {
      toast({ type: 'error', message: 'Failed to upload album photo.' })
    }
    if (albumPhotoInputRef.current) albumPhotoInputRef.current.value = ''
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 border-b border-gray-200 pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/campers"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campers
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load camper profile. Please try again.
        </div>
      </div>
    )
  }

  const fullName = `${profile.first_name} ${profile.last_name}`
  const initials = getInitials(profile.first_name, profile.last_name)
  const avatarColor = getAvatarColor(fullName)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/app/campers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Campers
      </Link>

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          {profile.reference_photo_url ? (
            <img
              src={profile.reference_photo_url}
              alt={fullName}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-lg"
            />
          ) : (
            <div
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ring-4 ring-white shadow-lg',
                avatarColor
              )}
            >
              {initials}
            </div>
          )}

          {/* Name & Info */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{fullName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {profile.age != null && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  Age {profile.age}
                </span>
              )}
              {profile.gender && (
                <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20 capitalize">
                  {profile.gender}
                </span>
              )}
              {profile.school && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                  <Activity className="h-3.5 w-3.5" />
                  {profile.school}
                  {profile.grade && ` - Grade ${profile.grade}`}
                </span>
              )}
              {(profile.city || profile.state) && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.city && profile.state
                    ? `${profile.city}, ${profile.state}`
                    : profile.city || profile.state}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {profile.contacts.length > 0 && (
            <>
              <button
                onClick={() => {
                  setComposeChannel('email')
                  setShowComposeModal(true)
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Mail className="h-4 w-4 text-blue-500" />
                Send Email
              </button>
              <button
                onClick={() => {
                  setComposeChannel('sms')
                  setShowComposeModal(true)
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Phone className="h-4 w-4 text-violet-500" />
                Send Text
              </button>
            </>
          )}
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Edit Camper
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab profile={profile} />}
        {activeTab === 'health' && <HealthTab profile={profile} />}
        {activeTab === 'family' && <FamilyContactsTab profile={profile} />}
        {activeTab === 'events' && <EventsTab profile={profile} />}
        {activeTab === 'photos' && (
          <PhotosTab
            profile={profile}
            onUploadProfilePhoto={handleProfilePhotoUpload}
            onUploadAlbumPhoto={handleAlbumPhotoUpload}
            profilePhotoInputRef={profilePhotoInputRef}
            albumPhotoInputRef={albumPhotoInputRef}
            isUploadingProfile={uploadProfilePhoto.isPending}
            isUploadingAlbum={uploadAlbumPhoto.isPending}
            onSyncFace={async () => {
              if (!id) return
              try {
                const result = await indexFace.mutateAsync(id)
                if (result.status === 'no_face_detected') {
                  toast({ type: 'error', message: 'No face detected in profile photo. Try a clearer photo.' })
                } else {
                  toast({ type: 'success', message: 'Face indexed! Future photos will auto-match this camper.' })
                }
                refetch()
              } catch {
                toast({ type: 'error', message: 'Failed to index face. Make sure AWS Rekognition is configured.' })
              }
            }}
            isSyncingFace={indexFace.isPending}
          />
        )}
        {activeTab === 'forms' && id && <FormsTab camperId={id} />}
        {activeTab === 'communications' && <CommunicationsTab profile={profile} />}
      </div>

      {/* Edit Camper Modal */}
      {showEditModal && profile && (
        <CamperEditModal
          camper={profile as any}
          onClose={() => {
            setShowEditModal(false)
            refetch()
          }}
        />
      )}

      {/* Compose Message Modal */}
      {showComposeModal && profile && (() => {
        const primaryContact = profile.contacts.find((c) => c.is_primary) || profile.contacts[0]
        const prefillTo = composeChannel === 'email'
          ? (primaryContact?.email || '')
          : (primaryContact?.phone || '')
        return (
          <ComposeMessageModal
            onClose={() => setShowComposeModal(false)}
            prefillTo={prefillTo}
            prefillChannel={composeChannel}
          />
        )
      })()}
    </div>
  )
}
