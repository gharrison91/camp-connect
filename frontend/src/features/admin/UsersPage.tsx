/**
 * Users management page — list, invite, and manage users.
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, UserCheck, UserX, Users } from 'lucide-react'
import { api } from '@/lib/api'

interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  role_id: string
  role_name: string | null
  is_active: boolean
  seasonal_access_start: string | null
  seasonal_access_end: string | null
  created_at: string
}

interface RoleOption {
  id: string
  name: string
}

export function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [inviteForm, setInviteForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role_id: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
      ])
      setUsers(usersRes.data.items || usersRes.data)
      setRoles(rolesRes.data)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await api.post('/users/invite', inviteForm)
      setSuccess('Invitation sent!')
      setShowInvite(false)
      setInviteForm({ email: '', first_name: '', last_name: '', role_id: '' })
      await loadData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to invite user')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (userId: string, currentlyActive: boolean) => {
    try {
      const endpoint = currentlyActive ? 'suspend' : 'activate'
      await api.post(`/users/${userId}/${endpoint}`)
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update user')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">
          {success}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Users ({users.length})
        </h2>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Invite a new user</h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">First name *</label>
                <input
                  type="text"
                  value={inviteForm.first_name}
                  onChange={(e) => setInviteForm((p) => ({ ...p, first_name: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Last name *</label>
                <input
                  type="text"
                  value={inviteForm.last_name}
                  onChange={(e) => setInviteForm((p) => ({ ...p, last_name: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email *</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                required
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Role *</label>
              <select
                value={inviteForm.role_id}
                onChange={(e) => setInviteForm((p) => ({ ...p, role_id: e.target.value }))}
                required
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Invite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User table */}
      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No users yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {user.role_name || 'No role'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <UserCheck className="h-3 w-3" /> Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3" /> Suspended
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleActive(user.id, user.is_active)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        user.is_active
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {user.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
