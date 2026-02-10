/**
 * Camp Connect - Staff Filters Component
 * Search bar, department dropdown, and grid/list view toggle.
 */

import { Search, LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StaffDepartment } from '@/hooks/useStaff'

interface StaffFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  department: string
  onDepartmentChange: (value: string) => void
  category?: string
  onCategoryChange?: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  departments: StaffDepartment[]
}

const STAFF_CATEGORIES = [
  { value: 'full_time', label: 'Full-time Staff' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'director', label: 'Director' },
]

export function StaffFilters({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  category,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  departments,
}: StaffFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Department Dropdown */}
      <select
        value={department}
        onChange={(e) => onDepartmentChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All Departments</option>
        {departments.map((dept) => (
          <option key={dept.name} value={dept.name}>
            {dept.name} ({dept.count})
          </option>
        ))}
      </select>

      {/* Category Dropdown */}
      {onCategoryChange && (
        <select
          value={category ?? ''}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {STAFF_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      )}

      {/* View Toggle */}
      <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
        <button
          onClick={() => onViewModeChange('grid')}
          className={cn(
            'inline-flex items-center justify-center rounded-md px-2.5 py-1.5 transition-colors',
            viewMode === 'grid'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          )}
          title="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            'inline-flex items-center justify-center rounded-md px-2.5 py-1.5 transition-colors',
            viewMode === 'list'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          )}
          title="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
