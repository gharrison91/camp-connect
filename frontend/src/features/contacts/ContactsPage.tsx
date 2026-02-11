import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Loader2,
  Mail,
  Phone,
  BookUser,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContacts } from '@/hooks/useContacts'
import { usePermissions } from '@/hooks/usePermissions'
import { ContactCreateModal } from './ContactCreateModal'

const avatarGradients = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
  'from-teal-500 to-emerald-500',
  'from-fuchsia-500 to-pink-500',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length]
}

export function ContactsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const { hasPermission } = usePermissions()

  const { data: contacts = [], isLoading, error } = useContacts({
    search: searchQuery || undefined,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Contacts
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Parents, guardians, and emergency contacts
          </p>
        </div>
        {hasPermission('core.contacts.update') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className={cn(
          'relative flex-1 transition-all duration-300',
          searchFocused && 'scale-[1.01]'
        )}>
          <Search className={cn(
            'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-all duration-200',
            searchFocused ? 'text-emerald-500 scale-110' : 'text-gray-400'
          )} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none',
              searchFocused
                ? 'border-emerald-400 ring-2 ring-emerald-100 shadow-sm'
                : 'border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            )}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
            <Loader2 className="relative h-8 w-8 animate-spin text-emerald-500" />
          </div>
          <p className="mt-4 text-sm text-gray-400">Loading contacts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 text-sm text-red-700 shadow-sm">
          Failed to load contacts. Please try again.
        </div>
      )}

      {/* Contacts Table */}
      {!isLoading && !error && contacts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
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
                {contacts.map((contact) => {
                  const fullName = `${contact.first_name} ${contact.last_name}`
                  const gradient = getAvatarGradient(fullName)
                  return (
                    <tr
                      key={contact.id}
                      onClick={() => navigate(`/app/contacts/${contact.id}`)}
                      className="group cursor-pointer transition-all duration-150 hover:bg-emerald-50/30"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-sm font-medium text-white shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-md',
                            gradient
                          )}>
                            {contact.first_name[0]}
                            {contact.last_name[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 transition-colors duration-150 group-hover:text-emerald-700">
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
                      <td className="hidden whitespace-nowrap px-6 py-4 md:table-cell">
                        <span className="text-sm text-gray-600 capitalize">
                          {contact.relationship_type ?? '\u2014'}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 lg:table-cell">
                        {contact.city && contact.state
                          ? `${contact.city}, ${contact.state}`
                          : contact.city || contact.state || '\u2014'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-all duration-150',
                            contact.camper_count > 0
                              ? 'bg-blue-50 text-blue-700 ring-blue-600/20 group-hover:bg-blue-100'
                              : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                          )}
                        >
                          {contact.camper_count} camper
                          {contact.camper_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && contacts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 shadow-sm">
            <BookUser className="h-7 w-7 text-gray-300" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-900">
            No contacts found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'Add your first contact to get started.'}
          </p>
          {!searchQuery && hasPermission('core.contacts.update') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition-all duration-200 hover:bg-emerald-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Contact
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Create Contact Modal */}
      {showCreateModal && (
        <ContactCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
