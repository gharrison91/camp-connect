/**
 * Camp Connect – Transportation & Bus Tracking Page
 * Tabs: Routes | Vehicles | Map View
 */

import { useState, useMemo } from 'react'
import {
  Bus,
  Car,
  Truck,
  MapPin,
  Clock,
  Users,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Navigation,
  Calendar,
  ChevronLeft,
  Loader2,
  Search,
  Edit2,
  Trash2,
  Phone,
} from 'lucide-react'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useRoutes, useCreateRoute, useDeleteRoute, useTransportationStats } from '@/hooks/useTransportation'
import { useToast } from '@/components/ui/Toast'
import type { Vehicle, TransportRoute, RouteStop } from '@/types'

const TABS = ['Routes', 'Vehicles', 'Map View'] as const
type Tab = (typeof TABS)[number]

const ROUTE_TYPES = ['pickup', 'dropoff', 'field_trip'] as const
const VEHICLE_TYPES = ['bus', 'van', 'car'] as const
const VEHICLE_STATUSES = ['active', 'maintenance', 'retired'] as const

function statusColor(s: string) {
  switch (s) {
    case 'scheduled': return 'bg-blue-100 text-blue-700'
    case 'in_progress': return 'bg-amber-100 text-amber-700'
    case 'completed': return 'bg-green-100 text-green-700'
    case 'cancelled': return 'bg-red-100 text-red-700'
    case 'active': return 'bg-green-100 text-green-700'
    case 'maintenance': return 'bg-amber-100 text-amber-700'
    case 'retired': return 'bg-slate-100 text-slate-500'
    default: return 'bg-slate-100 text-slate-600'
  }
}

function vehicleIcon(type: string) {
  switch (type) {
    case 'bus': return Bus
    case 'van': return Truck
    case 'car': return Car
    default: return Bus
  }
}

// ─── Route Form Modal ──────────────────────────────────────────
interface RouteFormModalProps { onClose: () => void }

function RouteFormModal({ onClose }: RouteFormModalProps) {
  const { toast } = useToast()
  const createRoute = useCreateRoute()
  const [form, setForm] = useState({
    name: '', route_type: 'pickup' as TransportRoute['route_type'],
    vehicle_id: '', date: new Date().toISOString().slice(0, 10),
    departure_time: '08:00', arrival_time: '09:00',
    status: 'scheduled' as TransportRoute['status'],
    stops: [{ stop_order: 1, location_name: '', address: '', estimated_time: '08:00', camper_ids: [] }] as RouteStop[],
  })

  const addStop = () => setForm(f => ({ ...f, stops: [...f.stops, { stop_order: f.stops.length + 1, location_name: '', address: '', estimated_time: '', camper_ids: [] }] }))
  const removeStop = (i: number) => setForm(f => ({ ...f, stops: f.stops.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stop_order: idx + 1 })) }))
  const updateStop = (i: number, field: keyof RouteStop, value: string) => setForm(f => ({ ...f, stops: f.stops.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }))

  const submit = () => {
    if (!form.name.trim()) return
    createRoute.mutate(form as any, {
      onSuccess: () => { toast({ message: 'Route created', type: 'success' }); onClose() },
      onError: () => toast({ message: 'Failed to create route', type: 'error' }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Route</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Route name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select className="rounded-lg border px-3 py-2 text-sm" value={form.route_type} onChange={e => setForm(f => ({ ...f, route_type: e.target.value as any }))}>
              {ROUTE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Departure</label>
              <input type="time" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Arrival</label>
              <input type="time" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.arrival_time} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Stops</span>
              <button onClick={addStop} className="text-xs text-emerald-600 hover:text-emerald-700">+ Add Stop</button>
            </div>
            {form.stops.map((stop, i) => (
              <div key={i} className="mb-2 flex items-start gap-2 rounded-lg border p-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">{stop.stop_order}</span>
                <div className="flex-1 space-y-2">
                  <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Location name" value={stop.location_name} onChange={e => updateStop(i, 'location_name', e.target.value)} />
                  <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Address" value={stop.address} onChange={e => updateStop(i, 'address', e.target.value)} />
                  <input type="time" className="rounded border px-2 py-1 text-sm" value={stop.estimated_time} onChange={e => updateStop(i, 'estimated_time', e.target.value)} />
                </div>
                {form.stops.length > 1 && (
                  <button onClick={() => removeStop(i)} className="mt-1 rounded p-1 text-slate-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={createRoute.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {createRoute.isPending ? 'Creating…' : 'Create Route'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Vehicle Form Modal ────────────────────────────────────────
interface VehicleFormModalProps { vehicle?: Vehicle | null; onClose: () => void }

function VehicleFormModal({ vehicle, onClose }: VehicleFormModalProps) {
  const { toast } = useToast()
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()
  const [form, setForm] = useState({
    name: vehicle?.name ?? '', type: vehicle?.type ?? 'bus' as Vehicle['type'],
    capacity: vehicle?.capacity ?? 40, license_plate: vehicle?.license_plate ?? '',
    driver_name: vehicle?.driver_name ?? '', driver_phone: vehicle?.driver_phone ?? '',
    status: vehicle?.status ?? 'active' as Vehicle['status'], notes: vehicle?.notes ?? '',
  })

  const submit = () => {
    if (!form.name.trim()) return
    const mut = vehicle ? updateVehicle : createVehicle
    const payload = vehicle ? { id: vehicle.id, ...form } : form
    mut.mutate(payload as any, {
      onSuccess: () => { toast({ message: vehicle ? 'Vehicle updated' : 'Vehicle added', type: 'success' }); onClose() },
      onError: () => toast({ message: 'Failed to save vehicle', type: 'error' }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Vehicle name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select className="rounded-lg border px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <input type="number" className="rounded-lg border px-3 py-2 text-sm" placeholder="Capacity" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} />
          </div>
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="License plate" value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Driver name" value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} />
            <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Driver phone" value={form.driver_phone} onChange={e => setForm(f => ({ ...f, driver_phone: e.target.value }))} />
          </div>
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
            {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={createVehicle.isPending || updateVehicle.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {(createVehicle.isPending || updateVehicle.isPending) ? 'Saving…' : vehicle ? 'Update' : 'Add Vehicle'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────
export function TransportationPage() {
  const [tab, setTab] = useState<Tab>('Routes')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)

  const { data: routes = [], isLoading: loadingRoutes } = useRoutes({ date, route_type: typeFilter || undefined })
  const { data: vehicles = [], isLoading: loadingVehicles } = useVehicles()
  const { data: stats } = useTransportationStats()
  const deleteVehicle = useDeleteVehicle()
  const deleteRoute = useDeleteRoute()
  const { toast } = useToast()

  const filteredVehicles = useMemo(() => {
    if (!search) return vehicles
    const q = search.toLowerCase()
    return vehicles.filter(v => v.name.toLowerCase().includes(q) || v.driver_name.toLowerCase().includes(q) || v.license_plate.toLowerCase().includes(q))
  }, [vehicles, search])

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10)) }
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().slice(0, 10)) }

  const handleDeleteVehicle = (v: Vehicle) => {
    if (!confirm(`Delete vehicle "${v.name}"?`)) return
    deleteVehicle.mutate(v.id, {
      onSuccess: () => toast({ message: 'Vehicle deleted', type: 'success' }),
      onError: () => toast({ message: 'Failed to delete', type: 'error' }),
    })
  }

  const handleDeleteRoute = (r: TransportRoute) => {
    if (!confirm(`Delete route "${r.name}"?`)) return
    deleteRoute.mutate(r.id, {
      onSuccess: () => toast({ message: 'Route deleted', type: 'success' }),
      onError: () => toast({ message: 'Failed to delete', type: 'error' }),
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transportation</h1>
          <p className="text-sm text-slate-500">Manage vehicles, routes, and bus assignments</p>
        </div>
        <div className="flex gap-2">
          {tab === 'Routes' && (
            <button onClick={() => setShowRouteModal(true)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Route
            </button>
          )}
          {tab === 'Vehicles' && (
            <button onClick={() => { setEditingVehicle(null); setShowVehicleModal(true) }} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Bus className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_vehicles ?? 0}</p>
              <p className="text-xs text-slate-500">Vehicles</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><Navigation className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats?.active_routes ?? 0}</p>
              <p className="text-xs text-slate-500">Active Routes</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"><Users className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats?.campers_transported_today ?? 0}</p>
              <p className="text-xs text-slate-500">Campers Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-white p-1 shadow-sm border">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Routes Tab */}
      {tab === 'Routes' && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <button onClick={prevDay} className="rounded-lg border p-2 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-sm" />
            </div>
            <button onClick={nextDay} className="rounded-lg border p-2 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">All Types</option>
              {ROUTE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>

          {loadingRoutes ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : routes.length === 0 ? (
            <div className="rounded-xl border bg-white p-12 text-center">
              <Navigation className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">No routes scheduled for this day</p>
              <button onClick={() => setShowRouteModal(true)} className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700">+ Add Route</button>
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map(route => {
                const isExpanded = expandedRoute === route.id
                return (
                  <div key={route.id} className="rounded-xl border bg-white shadow-sm">
                    <div className="flex cursor-pointer items-center gap-4 p-4" onClick={() => setExpandedRoute(isExpanded ? null : route.id)}>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{route.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusColor(route.status)}`}>{route.status.replace('_', ' ')}</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{route.route_type.replace('_', ' ')}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                          {route.vehicle_name && <span className="flex items-center gap-1"><Bus className="h-3 w-3" />{route.vehicle_name}</span>}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{route.departure_time} → {route.arrival_time}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{route.stops?.length ?? 0} stops</span>
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDeleteRoute(route) }} className="rounded p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    {isExpanded && route.stops && route.stops.length > 0 && (
                      <div className="border-t px-4 pb-4 pt-3">
                        <div className="space-y-2">
                          {route.stops.map((stop, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">{stop.stop_order}</span>
                                {i < route.stops.length - 1 && <div className="mt-1 h-6 w-px bg-slate-200" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{stop.location_name}</p>
                                <p className="text-xs text-slate-500">{stop.address}</p>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                                  <Clock className="h-3 w-3" />{stop.estimated_time}
                                  {stop.camper_ids.length > 0 && <><Users className="h-3 w-3 ml-2" />{stop.camper_ids.length} campers</>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Vehicles Tab */}
      {tab === 'Vehicles' && (
        <div>
          <div className="mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm" placeholder="Search vehicles…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loadingVehicles ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : filteredVehicles.length === 0 ? (
            <div className="rounded-xl border bg-white p-12 text-center">
              <Bus className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">No vehicles found</p>
              <button onClick={() => { setEditingVehicle(null); setShowVehicleModal(true) }} className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700">+ Add Vehicle</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map(v => {
                const Icon = vehicleIcon(v.type)
                return (
                  <div key={v.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${v.status === 'active' ? 'bg-emerald-50' : v.status === 'maintenance' ? 'bg-amber-50' : 'bg-slate-100'}`}>
                          <Icon className={`h-5 w-5 ${v.status === 'active' ? 'text-emerald-600' : v.status === 'maintenance' ? 'text-amber-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{v.name}</p>
                          <p className="text-xs text-slate-500">{v.license_plate}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(v.status)}`}>{v.status}</span>
                    </div>
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Capacity</span>
                        <span className="font-medium">{v.capacity}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: '60%' }} />
                      </div>
                    </div>
                    {v.driver_name && (
                      <div className="mb-3 flex items-center gap-2 text-xs text-slate-600">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{v.driver_name}</span>
                        {v.driver_phone && <><Phone className="h-3 w-3 ml-2 text-slate-400" /><span>{v.driver_phone}</span></>}
                      </div>
                    )}
                    <div className="flex items-center gap-1 border-t pt-3">
                      <button onClick={() => { setEditingVehicle(v); setShowVehicleModal(true) }} className="flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        <Edit2 className="mr-1 inline h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleDeleteVehicle(v)} className="rounded-lg border px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Map View Tab (simplified) */}
      {tab === 'Map View' && (
        <div className="rounded-xl border bg-white p-8 text-center">
          <MapPin className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="mb-1 text-lg font-semibold text-slate-700">Route Map View</h3>
          <p className="mb-4 text-sm text-slate-500">Interactive map integration coming soon. Use the Routes tab to manage stops and assignments.</p>
          {routes.length > 0 && (
            <div className="mx-auto max-w-md text-left">
              <h4 className="mb-2 text-sm font-medium text-slate-700">Today's Stops</h4>
              <div className="space-y-2">
                {routes.flatMap(r => (r.stops ?? []).map(s => ({ ...s, routeName: r.name }))).map((stop, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{stop.location_name}</p>
                      <p className="text-xs text-slate-500">{stop.routeName} · {stop.estimated_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showRouteModal && <RouteFormModal onClose={() => setShowRouteModal(false)} />}
      {showVehicleModal && <VehicleFormModal vehicle={editingVehicle} onClose={() => { setShowVehicleModal(false); setEditingVehicle(null) }} />}
    </div>
  )
}
