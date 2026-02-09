/**
 * Camp Connect - Reports Hooks
 * Trigger CSV report downloads from the /reports/* endpoints.
 */

import { api } from '../lib/api'

function downloadCsv(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

async function fetchReport(endpoint: string, params: Record<string, string | undefined>, filename: string) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  )
  const response = await api.get(endpoint, {
    params: cleanParams,
    responseType: 'text',
  })
  downloadCsv(response.data, filename)
}

export function useReports() {
  return {
    downloadCamperRoster: (eventId?: string) =>
      fetchReport('/reports/camper-roster', { event_id: eventId }, 'camper-roster.csv'),

    downloadRegistrations: (eventId?: string, status?: string) =>
      fetchReport('/reports/registrations', { event_id: eventId, status }, 'registrations.csv'),

    downloadHealthForms: (eventId?: string) =>
      fetchReport('/reports/health-forms', { event_id: eventId }, 'health-forms.csv'),

    downloadFinancial: (eventId?: string) =>
      fetchReport('/reports/financial', { event_id: eventId }, 'financial.csv'),

    downloadAttendance: (eventId: string) =>
      fetchReport('/reports/attendance', { event_id: eventId }, 'attendance.csv'),
  }
}
