import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Users,
  UserCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContact } from '@/hooks/useContacts'

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: contact, isLoading, error } = useContact(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="space-y-4">
        <Link
          to="/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load contact. Please try again.
        </div>
      </div>
    )
  }

  const fullAddress = [contact.address, contact.city, contact.state, contact.zip_code]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-6">
      {/* Back Button + Header */}
      <div>
        <Link
          to="/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-medium text-blue-600">
            {contact.first_name[0]}
            {contact.last_name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {contact.first_name} {contact.last_name}
            </h1>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize',
                contact.account_status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-gray-50 text-gray-600 ring-gray-500/20'
              )}
            >
              {contact.account_status}
            </span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Email */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {contact.email ?? '—'}
          </p>
        </div>

        {/* Phone */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="h-4 w-4" />
            <span>Phone</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {contact.phone ?? '—'}
          </p>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>Address</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">
            {fullAddress || '—'}
          </p>
        </div>

        {/* Relationship Type */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <UserCircle className="h-4 w-4" />
            <span>Relationship</span>
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900 capitalize">
            {contact.relationship_type ?? '—'}
          </p>
        </div>

        {/* Account Status */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <UserCircle className="h-4 w-4" />
            <span>Account Status</span>
          </div>
          <p className="mt-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize',
                contact.account_status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-gray-50 text-gray-600 ring-gray-500/20'
              )}
            >
              {contact.account_status}
            </span>
          </p>
        </div>
      </div>

      {/* Linked Campers Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Linked Campers</h2>
        <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {contact.camper_count} camper
                {contact.camper_count !== 1 ? 's' : ''} linked
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                View individual camper profiles for full details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
