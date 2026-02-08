/**
 * Locations management page — CRUD table.
 */

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, MapPin, Star } from 'lucide-react'
import { api } from '@/lib/api'

interface Location {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  phone: string | null
  is_primary: boolean
  created_at: string
}

const emptyForm = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  phone: '',
  is_primary: false,
}

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      const res = await api.get('/locations')
      setLocations(res.data)
    } catch (err) {
      setError('Failed to load locations')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        phone: formData.phone || null,
      }

      if (editing) {
        await api.put(`/locations/${editing}`, payload)
      } else {
        await api.post('/locations', payload)
      }
      await loadLocations()
      resetForm()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save location')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (loc: Location) => {
    setFormData({
      name: loc.name,
      address: loc.address || '',
      city: loc.city || '',
      state: loc.state || '',
      zip_code: loc.zip_code || '',
      phone: loc.phone || '',
      is_primary: loc.is_primary,
    })
    setEditing(loc.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return
    try {
      await api.delete(`/locations/${id}`)
      await loadLocations()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditing(null)
    setShowForm(false)
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
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Locations ({locations.length})
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Location
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            {editing ? 'Edit Location' : 'New Location'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Zip</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData((p) => ({ ...p, zip_code: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData((p) => ({ ...p, is_primary: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-sm text-slate-700">Primary location</span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {locations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No locations yet. Add your first one!</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{loc.name}</span>
                      {loc.is_primary && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {[loc.address, loc.city, loc.state, loc.zip_code].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{loc.phone || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(loc)}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
