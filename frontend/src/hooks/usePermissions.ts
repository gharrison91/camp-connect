/**
 * Camp Connect - usePermissions Hook
 * Check if the current user has specific permissions.
 */

import { useAuthStore } from '@/stores/authStore'

export function usePermissions() {
  const user = useAuthStore((state) => state.user)
  const permissions = user?.permissions || []

  /**
   * Check if user has a specific permission.
   * @param permission - e.g., "core.events.read"
   */
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission)
  }

  /**
   * Check if user has ANY of the given permissions.
   */
  const hasAnyPermission = (...perms: string[]): boolean => {
    return perms.some((p) => permissions.includes(p))
  }

  /**
   * Check if user has ALL of the given permissions.
   */
  const hasAllPermissions = (...perms: string[]): boolean => {
    return perms.every((p) => permissions.includes(p))
  }

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}
