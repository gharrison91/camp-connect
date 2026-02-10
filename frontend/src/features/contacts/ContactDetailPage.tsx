import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Users,
  UserCircle,
  Loader2,
  Plus,
  X,
  Link2,
  Trash2,
  FileText,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContact } from '@/hooks/useContacts'
import {
  useContactAssociations,
  useCreateContactAssociation,
  useDeleteContactAssociation,
} from '@/hooks/useWorkflows'
import { useFormSubmissions } from '@/hooks/useForms'
import { useToast } from '@/components/ui/Toast'
import { ComposeMessageModal } from '@/features/communications/CommunicationsPage'

const RELATIONSHIP_TYPES = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other', label: 'Other' },
]

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [showAddAssoc, setShowAddAssoc] = useState(false)
  const [assocContactId, setAssocContactId] = useState('')
  const [assocType, setAssocType] = useState('parent')
  const [assocNotes, setAssocNotes] = useState('')
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [composeChannel, setComposeChannel] = useState<'sms' | 'email'>('email')

  const { data: contact, isLoading, error } = useContact(id)
  const { data: associations = [] } = useContactAssociations(id)
  const createAssociation = useCreateContactAssociation(id)
  const deleteAssociation = useDeleteContactAssociation(id)

  const handleAddAssociation = async () => {
    if (!assocContactId.trim()) {
      toast({ type: 'error', message: 'Please enter a contact ID' })
      return
    }
    try {
      await createAssociation.mutateAsync({
        related_contact_id: assocContactId.trim(),
        relationship_type: assocType,
        notes: assocNotes || undefined,
      })
      toast({ type: 'success', message: 'Association added' })
      setShowAddAssoc(false)
      setAssocContactId('')
      setAssocNotes('')
    } catch {
      toast({ type: 'error', message: 'Failed to add association' })
    }
  }

  const handleDeleteAssociation = async (assocId: string) => {
    try {
      await deleteAssociation.mutateAsync(assocId)
      toast({ type: 'success', message: 'Association removed' })
    } catch {
      toast({ type: 'error', message: 'Failed to remove association' })
    }
  }

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
          to="/app/contacts"
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
          to="/app/contacts"
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
          {/* Send Email/Text Buttons */}
          <div className="ml-auto flex items-center gap-2">
            {contact.email && (
              <button
                onClick={() => { setComposeChannel('email'); setShowComposeModal(true) }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Mail className="h-4 w-4 text-blue-500" />
                Send Email
              </button>
            )}
            {contact.phone && (
              <button
                onClick={() => { setComposeChannel('sms'); setShowComposeModal(true) }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Phone className="h-4 w-4 text-violet-500" />
                Send Text
              </button>
            )}
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

      {/* Contact Associations Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Relationships</h2>
          <button
            onClick={() => setShowAddAssoc(!showAddAssoc)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {showAddAssoc ? (
              <>
                <X className="h-3.5 w-3.5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add Relationship
              </>
            )}
          </button>
        </div>

        {/* Add Association Form */}
        {showAddAssoc && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Contact ID
                </label>
                <input
                  type="text"
                  value={assocContactId}
                  onChange={(e) => setAssocContactId(e.target.value)}
                  placeholder="Paste contact ID..."
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Relationship
                </label>
                <select
                  value={assocType}
                  onChange={(e) => setAssocType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {RELATIONSHIP_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>
                      {rt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={assocNotes}
                  onChange={(e) => setAssocNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleAddAssociation}
              disabled={createAssociation.isPending}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {createAssociation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Add Relationship
            </button>
          </div>
        )}

        {/* Associations List */}
        <div className="mt-3 space-y-2">
          {associations.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                  <Link2 className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    No relationships yet
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Add relationships to link this contact to family members, guardians, or other contacts.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            associations.map((assoc) => (
              <div
                key={assoc.id}
                className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-sm font-medium text-purple-600">
                    {(assoc.related_contact_name ?? '??')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <Link
                      to={`/app/contacts/${assoc.related_contact_id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {assoc.related_contact_name ?? 'Unknown Contact'}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20 capitalize">
                        {assoc.relationship_type}
                      </span>
                      {assoc.related_contact_email && (
                        <span className="text-xs text-gray-400">
                          {assoc.related_contact_email}
                        </span>
                      )}
                      {assoc.notes && (
                        <span className="text-xs text-gray-400">
                          &middot; {assoc.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAssociation(assoc.id)}
                  className="rounded p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Submissions Section */}
      {id && <ContactFormSubmissions contactId={id} />}

      {/* Compose Message Modal */}
      {showComposeModal && contact && (
        <ComposeMessageModal
          onClose={() => setShowComposeModal(false)}
          prefillTo={composeChannel === 'email' ? (contact.email || '') : (contact.phone || '')}
          prefillChannel={composeChannel}
        />
      )}
    </div>
  )
}

// ─── Contact Form Submissions ───────────────────────────────
function ContactFormSubmissions({ contactId }: { contactId: string }) {
  const { data, isLoading } = useFormSubmissions({ contact_id: contactId })
  const submissions = data?.items ?? []

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Form Submissions</h2>
      </div>

      {isLoading ? (
        <div className="mt-3 flex items-center justify-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <Clock className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">No form submissions yet</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Forms submitted by this contact will appear here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Form</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Submitted</th>
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
                      {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '--'}
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
