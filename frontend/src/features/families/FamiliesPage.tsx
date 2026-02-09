import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Loader2, Users, Home } from 'lucide-react'
import { useFamilies } from '@/hooks/useFamilies'
import { usePermissions } from '@/hooks/usePermissions'
import { FamilyCreateModal } from './FamilyCreateModal'

export function FamiliesPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { hasPermission } = usePermissions()

  const {
    data: families = [],
    isLoading,
    error,
  } = useFamilies(searchQuery || undefined)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Families
          </h1>
          {!isLoading && families.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {families.length}
            </span>
          )}
        </div>
        {hasPermission('core.families.update') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Create Family
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by family name..."
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
          Failed to load families. Please try again.
        </div>
      )}

      {/* Family Card Grid */}
      {!isLoading && !error && families.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <button
              key={family.id}
              onClick={() => navigate(`/app/families/${family.id}`)}
              className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm text-left transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                  <Home className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-gray-900">
                    {family.family_name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {family.camper_count} camper
                    {family.camper_count !== 1 ? 's' : ''},{' '}
                    {family.contact_count} contact
                    {family.contact_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 border-t border-gray-50 pt-3">
                <p className="text-xs text-gray-400">
                  Created{' '}
                  {new Date(family.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && families.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Users className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No families found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'Create your first family to group campers and contacts.'}
          </p>
        </div>
      )}

      {/* Create Family Modal */}
      {showCreateModal && (
        <FamilyCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
