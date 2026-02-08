import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContacts } from '@/hooks/useContacts'
import { usePermissions } from '@/hooks/usePermissions'
import { ContactCreateModal } from './ContactCreateModal'

export function ContactsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { hasPermission } = usePermissions()

  const { data: contacts = [], isLoading, error } = useContacts({
    search: searchQuery || undefined,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Contacts
        </h1>
        {hasPermission('core.contacts.update') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load contacts. Please try again.
        </div>
      )}

      {/* Contacts Table */}
      {!isLoading && !error && contacts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Phone</th>
                  <th className="hidden px-6 py-3 md:table-cell">
                    Relationship
                  </th>
                  <th className="hidden px-6 py-3 lg:table-cell">Location</th>
                  <th className="px-6 py-3">Campers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50/80"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-medium text-blue-600">
                          {contact.first_name[0]}
                          {contact.last_name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {contact.account_status}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {contact.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {contact.email}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                      {contact.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {contact.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 capitalize md:table-cell">
                      {contact.relationship_type ?? '—'}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 lg:table-cell">
                      {contact.city && contact.state
                        ? `${contact.city}, ${contact.state}`
                        : contact.city || contact.state || '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                          contact.camper_count > 0
                            ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                            : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                        )}
                      >
                        {contact.camper_count} camper
                        {contact.camper_count !== 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && contacts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Search className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No contacts found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'Add your first contact to get started.'}
          </p>
        </div>
      )}

      {/* Create Contact Modal */}
      {showCreateModal && (
        <ContactCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
