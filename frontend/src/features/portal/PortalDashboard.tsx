/**
 * Camp Connect - PortalDashboard
 * Parent dashboard showing linked campers.
 */

import { useNavigate } from 'react-router-dom'
import { Users, Loader2, ChevronRight } from 'lucide-react'
import { usePortalCampers } from '@/hooks/usePortal'

export function PortalDashboard() {
  const navigate = useNavigate()
  const { data: campers = [], isLoading } = usePortalCampers()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome!</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your campers, photos, and invoices.
        </p>
      </div>

      {campers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Users className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No campers linked</p>
          <p className="mt-1 text-sm text-gray-500">Contact the camp to link your campers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {campers.map((camper: any) => (
            <button
              key={camper.id}
              onClick={() => navigate(`/portal/campers/${camper.id}`)}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
            >
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {camper.first_name} {camper.last_name}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                  {camper.age && <span>Age {camper.age}</span>}
                  {camper.gender && <span className="capitalize">{camper.gender}</span>}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
