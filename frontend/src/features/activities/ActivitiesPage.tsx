import { useState, useEffect } from 'react'
import {
  Tent,
  Search,
  Plus,
  Users,
  Clock,
  Target,
  Tag,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useActivities } from '@/hooks/useActivities'
import type { Activity } from '@/hooks/useActivities'
import { usePermissions } from '@/hooks/usePermissions'
import { ActivityCreateModal } from './ActivityCreateModal'
import { ActivityEditModal } from './ActivityEditModal'

const categoryColors: Record<string, string> = {
  sports: 'bg-blue-50 text-blue-700',
  arts: 'bg-purple-50 text-purple-700',
  nature: 'bg-green-50 text-green-700',
  water: 'bg-cyan-50 text-cyan-700',
  education: 'bg-amber-50 text-amber-700',
  other: 'bg-gray-50 text-gray-700',
}

const categoryLabels: Record<string, string> = {
  sports: 'Sports',
  arts: 'Arts',
  nature: 'Nature',
  water: 'Water',
  education: 'Education',
  other: 'Other',
}

type ActiveFilter = 'all' | 'active' | 'inactive'

export function ActivitiesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const { hasPermission } = usePermissions()

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const {
    data: activities = [],
    isLoading,
    error,
  } = useActivities({
    search: debouncedSearch || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    is_active:
      activeFilter === 'active'
        ? true
        : activeFilter === 'inactive'
          ? false
          : undefined,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Activities
          </h1>
          {!isLoading && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {activities.length}
            </span>
          )}
        </div>
        {hasPermission('core.activities.update') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Create Activity
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="sports">Sports</option>
          <option value="arts">Arts</option>
          <option value="nature">Nature</option>
          <option value="water">Water</option>
          <option value="education">Education</option>
          <option value="other">Other</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
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
          Failed to load activities. Please try again.
        </div>
      )}

      {/* Activity Cards Grid */}
      {!isLoading && !error && activities.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => setEditingActivity(activity)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
            >
              <div className="p-5">
                {/* Header: category badge + active status */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                      categoryColors[activity.category] || categoryColors.other
                    )}
                  >
                    {categoryLabels[activity.category] || activity.category}
                  </span>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                      activity.is_active
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                        : 'bg-gray-50 text-gray-500 ring-gray-400/20'
                    )}
                  >
                    {activity.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Name */}
                <h3 className="mt-3 text-base font-semibold text-gray-900 group-hover:text-blue-600">
                  {activity.name}
                </h3>

                {/* Description */}
                {activity.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {activity.description}
                  </p>
                )}

                {/* Info Row */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {activity.capacity != null && (
                    <div className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 shrink-0" />
                      <span>{activity.capacity}</span>
                    </div>
                  )}
                  {activity.duration_minutes != null && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{activity.duration_minutes}m</span>
                    </div>
                  )}
                  {activity.staff_required > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>{activity.staff_required} staff</span>
                    </div>
                  )}
                </div>

                {/* Age Range */}
                {(activity.min_age != null || activity.max_age != null) && (
                  <div className="mt-2 text-xs text-gray-400">
                    Ages {activity.min_age ?? '?'}-{activity.max_age ?? '?'}
                  </div>
                )}

                {/* Equipment Tags */}
                {activity.equipment_needed &&
                  activity.equipment_needed.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {activity.equipment_needed.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
                        >
                          <Tag className="h-3 w-3" />
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && activities.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Tent className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No activities found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {searchInput || categoryFilter !== 'all' || activeFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first activity to get started.'}
          </p>
        </div>
      )}

      {/* Create Activity Modal */}
      {showCreateModal && (
        <ActivityCreateModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Edit Activity Modal */}
      {editingActivity && (
        <ActivityEditModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  )
}
