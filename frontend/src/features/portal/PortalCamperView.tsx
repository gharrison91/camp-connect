/**
 * Camp Connect - PortalCamperView
 * Read-only camper profile for parents.
 */

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, User } from 'lucide-react'
import { usePortalCamperProfile } from '@/hooks/usePortal'

export function PortalCamperView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: profile, isLoading } = usePortalCamperProfile(id)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">Camper not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/portal')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <User className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {profile.first_name} {profile.last_name}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              {profile.age && <span>Age {profile.age}</span>}
              {profile.gender && <span className="capitalize">{profile.gender}</span>}
              {profile.school && <span>{profile.school}</span>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profile.date_of_birth && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.date_of_birth}</dd>
            </div>
          )}
          {profile.grade && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Grade</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.grade}</dd>
            </div>
          )}
          {profile.allergies && profile.allergies.length > 0 && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Allergies</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {profile.allergies.map((a: string) => (
                  <span key={a} className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">{a}</span>
                ))}
              </dd>
            </div>
          )}
          {profile.dietary_restrictions && profile.dietary_restrictions.length > 0 && (
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Dietary Restrictions</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {profile.dietary_restrictions.map((d: string) => (
                  <span key={d} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{d}</span>
                ))}
              </dd>
            </div>
          )}
        </div>

        {/* Contacts */}
        {profile.contacts && profile.contacts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900">Contacts</h3>
            <div className="mt-2 space-y-2">
              {profile.contacts.map((c: any) => (
                <div key={c.contact_id || c.id} className="rounded-lg border border-gray-100 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-900">{c.first_name} {c.last_name}</span>
                  <span className="ml-2 text-gray-500">{c.relationship_type}</span>
                  {c.phone && <span className="ml-2 text-gray-400">{c.phone}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
