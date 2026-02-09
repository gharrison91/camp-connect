/**
 * Camp Connect - ReportsPage
 * Downloadable CSV reports with optional event/status filters.
 */

import { useState } from 'react'
import { Users, ClipboardList, Heart, DollarSign, CalendarCheck, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReports } from '@/hooks/useReports'
import { useEvents } from '@/hooks/useEvents'
import { useToast } from '@/components/ui/Toast'

type ReportKey = 'camperRoster' | 'registrations' | 'healthForms' | 'financial' | 'attendance'

export function ReportsPage() {
  const { toast } = useToast()
  const reports = useReports()
  const { data: events = [] } = useEvents()

  const [rosterEventId, setRosterEventId] = useState('')
  const [regEventId, setRegEventId] = useState('')
  const [regStatus, setRegStatus] = useState('')
  const [healthEventId, setHealthEventId] = useState('')
  const [financialEventId, setFinancialEventId] = useState('')
  const [attendanceEventId, setAttendanceEventId] = useState('')
  const [loading, setLoading] = useState<Record<ReportKey, boolean>>({
    camperRoster: false, registrations: false, healthForms: false, financial: false, attendance: false,
  })

  async function handleDownload(key: ReportKey, fn: () => Promise<void>) {
    setLoading((prev) => ({ ...prev, [key]: true }))
    try {
      await fn()
      toast({ type: 'success', message: 'Report downloaded!' })
    } catch {
      toast({ type: 'error', message: 'Failed to download report.' })
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  const eventSelect = (value: string, onChange: (v: string) => void, label = 'All events') => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
      <option value="">{label}</option>
      {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
    </select>
  )

  const dlBtn = (key: ReportKey, fn: () => Promise<void>, disabled = false) => (
    <button
      onClick={() => handleDownload(key, fn)}
      disabled={loading[key] || disabled}
      className={cn('inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed')}
    >
      {loading[key] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {loading[key] ? 'Downloading...' : 'Download CSV'}
    </button>
  )

  const cards = [
    { key: 'camperRoster' as ReportKey, icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', title: 'Camper Roster', desc: 'All campers with contact info',
      filter: eventSelect(rosterEventId, setRosterEventId),
      btn: dlBtn('camperRoster', () => reports.downloadCamperRoster(rosterEventId || undefined)) },
    { key: 'registrations' as ReportKey, icon: ClipboardList, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', title: 'Registrations', desc: 'Registration records with status',
      filter: <>{eventSelect(regEventId, setRegEventId)}<select value={regStatus} onChange={(e) => setRegStatus(e.target.value)} className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"><option value="">All Statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option><option value="waitlisted">Waitlisted</option></select></>,
      btn: dlBtn('registrations', () => reports.downloadRegistrations(regEventId || undefined, regStatus || undefined)) },
    { key: 'healthForms' as ReportKey, icon: Heart, iconBg: 'bg-red-50', iconColor: 'text-red-500', title: 'Health Forms', desc: 'Health form submissions',
      filter: eventSelect(healthEventId, setHealthEventId),
      btn: dlBtn('healthForms', () => reports.downloadHealthForms(healthEventId || undefined)) },
    { key: 'financial' as ReportKey, icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', title: 'Financial Summary', desc: 'Revenue & payments',
      filter: eventSelect(financialEventId, setFinancialEventId),
      btn: dlBtn('financial', () => reports.downloadFinancial(financialEventId || undefined)) },
    { key: 'attendance' as ReportKey, icon: CalendarCheck, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', title: 'Attendance', desc: 'Daily attendance records',
      filter: <>{eventSelect(attendanceEventId, setAttendanceEventId, 'Select event (required)')}{!attendanceEventId && <p className="mt-1 text-xs text-amber-600">Event selection required.</p>}</>,
      btn: dlBtn('attendance', () => reports.downloadAttendance(attendanceEventId), !attendanceEventId) },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reports</h1>
      <p className="text-sm text-gray-500">Download CSV reports. Use optional filters to narrow results.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.key} className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', c.iconBg)}>
                  <Icon className={cn('h-5 w-5', c.iconColor)} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{c.title}</h3>
                  <p className="text-xs text-gray-500">{c.desc}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {c.filter}
                {c.btn}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
