/**
 * Camp Connect - Staff Card Component
 * Displays a staff member in a card format for the grid view.
 */

import { cn } from '@/lib/utils'
import type { StaffMember } from '@/hooks/useStaff'

interface StaffCardProps {
  staff: StaffMember
  onClick: () => void
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function statusDot(status: string) {
  switch (status) {
    case 'active':
      return { color: 'bg-emerald-500', label: 'Active' }
    case 'onboarding':
      return { color: 'bg-amber-400', label: 'Onboarding' }
    case 'inactive':
    default:
      return { color: 'bg-gray-400', label: 'Inactive' }
  }
}

function roleBadgeColor(role?: string | null): string {
  if (!role) return 'bg-gray-50 text-gray-600 ring-gray-500/20'
  const lower = role.toLowerCase()
  if (lower.includes('admin') || lower.includes('director'))
    return 'bg-purple-50 text-purple-700 ring-purple-600/20'
  if (lower.includes('manager') || lower.includes('lead'))
    return 'bg-blue-50 text-blue-700 ring-blue-600/20'
  return 'bg-gray-50 text-gray-600 ring-gray-500/20'
}

export function StaffCard({ staff, onClick }: StaffCardProps) {
  const initials = getInitials(staff.first_name, staff.last_name)
  const status = statusDot(staff.status)

  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col items-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {/* Avatar */}
      <div className="relative">
        {staff.avatar_url ? (
          <img
            src={staff.avatar_url}
            alt={`${staff.first_name} ${staff.last_name}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-xl font-semibold text-blue-600 transition-colors group-hover:bg-blue-100">
            {initials}
          </div>
        )}
        {/* Status Dot */}
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white',
            status.color
          )}
          title={status.label}
        />
      </div>

      {/* Name */}
      <h3 className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-blue-600">
        {staff.first_name} {staff.last_name}
      </h3>

      {/* Role Badge */}
      {staff.role_name && (
        <span
          className={cn(
            'mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            roleBadgeColor(staff.role_name)
          )}
        >
          {staff.role_name}
        </span>
      )}

      {/* Department */}
      <p className="mt-2 text-xs text-gray-500">
        {staff.department ?? 'No department'}
      </p>

      {/* Onboarding Progress Indicator */}
      {staff.status === 'onboarding' && (
        <div className="mt-3 w-full">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-amber-100">
              <div className="h-1.5 rounded-full bg-amber-400" style={{ width: '40%' }} />
            </div>
            <span className="text-[10px] font-medium text-amber-600">Onboarding</span>
          </div>
        </div>
      )}
    </button>
  )
}
