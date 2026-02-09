import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  ArrowLeft,
  X,
  Search,
  Loader2,
  Home,
} from 'lucide-react'
import {
  useFamily,
  useUpdateFamily,
  useAddCamperToFamily,
  useAddContactToFamily,
  useRemoveMember,
} from '@/hooks/useFamilies'
import { useCampers } from '@/hooks/useCampers'
import { useContacts } from '@/hooks/useContacts'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/Toast'

// ---------------------------------------------------------------------------
// Picker Modal (used for both campers and contacts)
// ---------------------------------------------------------------------------

function MemberPickerModal({
  title,
  type,
  familyId,
  onClose,
}: {
  title: string
  type: 'camper' | 'contact'
  familyId: string
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const addCamper = useAddCamperToFamily()
  const addContact = useAddContactToFamily()

  const { data: camperData } = useCampers(
    type === 'camper' ? { search: search || undefined } : undefined
  )
  const { data: contactData } = useContacts(
    type === 'contact' ? { search: search || undefined } : undefined
  )

  // Handle paginated campers (PaginatedCampers has an items array)
  const campers = type === 'camper'
    ? (Array.isArray(camperData) ? camperData : camperData?.items ?? [])
    : []
  const contacts = type === 'contact'
    ? (Array.isArray(contactData) ? contactData : [])
    : []

  const isPending = addCamper.isPending || addContact.isPending

  const handleSelect = async (memberId: string) => {
    try {
      if (type === 'camper') {
        await addCamper.mutateAsync({ familyId, camperId: memberId })
        toast({ type: 'success', message: 'Camper added to family.' })
      } else {
        await addContact.mutateAsync({ familyId, contactId: memberId })
        toast({ type: 'success', message: 'Contact added to family.' })
      }
      onClose()
    } catch {
      toast({ type: 'error', message: `Failed to add ${type}.` })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${type}s...`}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto px-6 py-3">
          {type === 'camper' &&
            campers.map((camper: any) => (
              <button
                key={camper.id}
                disabled={isPending}
                onClick={() => handleSelect(camper.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-medium text-emerald-600">
                  {camper.first_name?.[0]}
                  {camper.last_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {camper.first_name} {camper.last_name}
                  </p>
                  {camper.age != null && (
                    <p className="text-xs text-gray-500">Age {camper.age}</p>
                  )}
                </div>
              </button>
            ))}

          {type === 'contact' &&
            contacts.map((contact: any) => (
              <button
                key={contact.id}
                disabled={isPending}
                onClick={() => handleSelect(contact.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">
                  {contact.first_name?.[0]}
                  {contact.last_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {contact.first_name} {contact.last_name}
                  </p>
                  {contact.email && (
                    <p className="text-xs text-gray-500">{contact.email}</p>
                  )}
                </div>
              </button>
            ))}

          {type === 'camper' && campers.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              No campers found.
            </p>
          )}
          {type === 'contact' && contacts.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              No contacts found.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Family Detail Page
// ---------------------------------------------------------------------------

export function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission('core.families.update')

  const { data: family, isLoading, error } = useFamily(id)
  const updateFamily = useUpdateFamily()
  const removeMember = useRemoveMember()

  // Inline edit state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  // Picker modals
  const [showCamperPicker, setShowCamperPicker] = useState(false)
  const [showContactPicker, setShowContactPicker] = useState(false)

  const handleStartEditName = () => {
    if (!family) return
    setEditName(family.family_name)
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    if (!family || !editName.trim()) return
    try {
      await updateFamily.mutateAsync({
        id: family.id,
        data: { family_name: editName.trim() },
      })
      toast({ type: 'success', message: 'Family name updated.' })
      setIsEditingName(false)
    } catch {
      toast({ type: 'error', message: 'Failed to update family name.' })
    }
  }

  const handleRemoveMember = async (
    memberId: string,
    memberType: 'camper' | 'contact',
    name: string
  ) => {
    if (!family) return
    try {
      await removeMember.mutateAsync({
        familyId: family.id,
        memberId,
        memberType,
      })
      toast({
        type: 'success',
        message: `${name} removed from family.`,
      })
    } catch {
      toast({ type: 'error', message: `Failed to remove ${name}.` })
    }
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Error
  if (error || !family) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/app/families')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Families
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load family. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button + Header */}
      <div>
        <button
          onClick={() => navigate('/app/families')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Families
        </button>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-medium text-blue-600">
            <Home className="h-6 w-6" />
          </div>
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') setIsEditingName(false)
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xl font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveName}
                  disabled={updateFamily.isPending}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateFamily.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                  {family.family_name}
                </h1>
                {canEdit && (
                  <button
                    onClick={handleStartEditName}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
            <p className="mt-0.5 text-sm text-gray-500">
              {family.camper_count} camper
              {family.camper_count !== 1 ? 's' : ''},{' '}
              {family.contact_count} contact
              {family.contact_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Campers Section */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Campers
              </h2>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {family.camper_count}
              </span>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowCamperPicker(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Camper
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {family.campers.length === 0 && (
              <div className="flex flex-col items-center py-10">
                <Users className="h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">
                  No campers in this family yet.
                </p>
              </div>
            )}
            {family.campers.map((camper) => (
              <div
                key={camper.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-medium text-emerald-600">
                    {camper.first_name[0]}
                    {camper.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {camper.first_name} {camper.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {[
                        camper.age != null ? `Age ${camper.age}` : null,
                        camper.gender,
                      ]
                        .filter(Boolean)
                        .join(' \u00b7 ') || 'No details'}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() =>
                      handleRemoveMember(
                        camper.id,
                        'camper',
                        `${camper.first_name} ${camper.last_name}`
                      )
                    }
                    disabled={removeMember.isPending}
                    className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    title="Remove from family"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contacts Section */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Contacts
              </h2>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {family.contact_count}
              </span>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowContactPicker(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Contact
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {family.contacts.length === 0 && (
              <div className="flex flex-col items-center py-10">
                <Users className="h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">
                  No contacts in this family yet.
                </p>
              </div>
            )}
            {family.contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-medium text-blue-600">
                    {contact.first_name[0]}
                    {contact.last_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.user_id && (
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                          Portal Access
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {[
                        contact.relationship_type,
                        contact.email,
                        contact.phone,
                      ]
                        .filter(Boolean)
                        .join(' \u00b7 ')}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() =>
                      handleRemoveMember(
                        contact.id,
                        'contact',
                        `${contact.first_name} ${contact.last_name}`
                      )
                    }
                    disabled={removeMember.isPending}
                    className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    title="Remove from family"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Picker Modals */}
      {showCamperPicker && id && (
        <MemberPickerModal
          title="Add Camper to Family"
          type="camper"
          familyId={id}
          onClose={() => setShowCamperPicker(false)}
        />
      )}
      {showContactPicker && id && (
        <MemberPickerModal
          title="Add Contact to Family"
          type="contact"
          familyId={id}
          onClose={() => setShowContactPicker(false)}
        />
      )}
    </div>
  )
}
