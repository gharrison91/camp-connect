import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  GraduationCap,
  MapPin,
  Loader2,
  Phone,
  Mail,
  AlertTriangle,
  UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCamper } from '@/hooks/useCampers'
import { useRegistrations } from '@/hooks/useRegistrations'
import type { Registration } from '@/types'

const registrationStatusConfig: Record<
  Registration['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  waitlisted: {
    label: 'Waitlisted',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
}

const paymentStatusConfig: Record<
  Registration['payment_status'],
  { label: string; className: string }
> = {
  unpaid: {
    label: 'Unpaid',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  deposit_paid: {
    label: 'Deposit Paid',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  },
}

export function CamperDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: camper, isLoading, error } = useCamper(id)
  const { data: registrations = [], isLoading: registrationsLoading } =
    useRegistrations({ camper_id: id })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !camper) {
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
          Failed to load camper. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button + Header */}
      <div>
        <Link
          to="/app/campers"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campers
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
          {camper.first_name} {camper.last_name}
        </h1>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User className="h-4 w-4" />
            <span>Age</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {camper.age ?? '—'}
          </p>
          {camper.date_of_birth && (
            <p className="mt-0.5 text-xs text-gray-500">
              DOB:{' '}
              {new Date(camper.date_of_birth + 'T00:00:00').toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' }
              )}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User className="h-4 w-4" />
            <span>Gender</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900 capitalize">
            {camper.gender ?? '—'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <GraduationCap className="h-4 w-4" />
            <span>School</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {camper.school ?? '—'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <GraduationCap className="h-4 w-4" />
            <span>Grade</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {camper.grade ?? '—'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>City / State</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {camper.city && camper.state
              ? `${camper.city}, ${camper.state}`
              : camper.city || camper.state || '—'}
          </p>
        </div>
      </div>

      {/* Allergies & Dietary Restrictions */}
      {((camper.allergies && camper.allergies.length > 0) ||
        (camper.dietary_restrictions &&
          camper.dietary_restrictions.length > 0)) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {camper.allergies && camper.allergies.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Allergies</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {camper.allergies.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
          {camper.dietary_restrictions &&
            camper.dietary_restrictions.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>Dietary Restrictions</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {camper.dietary_restrictions.map((restriction, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
                    >
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Contacts Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
        {camper.contacts.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            No contacts linked to this camper.
          </p>
        )}
        {camper.contacts.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {camper.contacts.map((contact) => (
              <div
                key={contact.contact_id}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 capitalize">
                      {contact.relationship_type}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {contact.is_primary && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        Primary
                      </span>
                    )}
                    {contact.is_emergency && (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                        Emergency
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {contact.email && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      {contact.email}
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {contact.phone}
                    </div>
                  )}
                </div>
                {contact.is_authorized_pickup && (
                  <p className="mt-2 text-xs text-emerald-600">
                    Authorized for pickup
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registrations Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Registrations</h2>
        {registrationsLoading && (
          <div className="mt-4 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        {!registrationsLoading && registrations.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            No registrations found for this camper.
          </p>
        )}
        {!registrationsLoading && registrations.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Event</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="hidden px-6 py-3 sm:table-cell">Payment</th>
                    <th className="hidden px-6 py-3 md:table-cell">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {registrations.map((reg) => {
                    const regStatus = registrationStatusConfig[reg.status]
                    const payStatus = paymentStatusConfig[reg.payment_status]
                    return (
                      <tr
                        key={reg.id}
                        className="transition-colors hover:bg-gray-50/80"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {reg.event_name ?? 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                              regStatus.className
                            )}
                          >
                            {regStatus.label}
                          </span>
                        </td>
                        <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                              payStatus.className
                            )}
                          >
                            {payStatus.label}
                          </span>
                        </td>
                        <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                          {new Date(reg.registered_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
