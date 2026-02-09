/**
 * Camp Connect - EventBunkConfigModal
 * Configure which bunks are active for a specific event.
 */

import { useState, useEffect } from 'react'
import { BedDouble, X, Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBunks } from '@/hooks/useBunks'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import type { EventBunkConfig } from '@/types'

interface EventBunkConfigModalProps {
  eventId: string
  eventName: string
  onClose: () => void
}

interface BunkConfigState {
  configId?: string
  bunkId: string
  bunkName: string
  isActive: boolean
  eventCapacity: string
  notes: string
}

export function EventBunkConfigModal({ eventId, eventName, onClose }: EventBunkConfigModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: bunks = [] } = useBunks()

  // Fetch existing configs for this event
  const { data: configs = [], isLoading } = useQuery<EventBunkConfig[]>({
    queryKey: ['event-bunk-configs', eventId],
    queryFn: () => api.get('/bunks/event-config', { params: { event_id: eventId } }).then((r) => r.data),
  })

  const [bunkConfigs, setBunkConfigs] = useState<BunkConfigState[]>([])
  const [saving, setSaving] = useState(false)

  // Initialize form from bunks + existing configs
  useEffect(() => {
    if (bunks.length > 0) {
      const configMap = new Map(configs.map((c) => [c.bunk_id, c]))
      setBunkConfigs(
        bunks.map((b) => {
          const existing = configMap.get(b.id)
          return {
            configId: existing?.id,
            bunkId: b.id,
            bunkName: b.name,
            isActive: existing ? existing.is_active : false,
            eventCapacity: existing?.event_capacity?.toString() || '',
            notes: existing?.notes || '',
          }
        })
      )
    }
  }, [bunks, configs])

  function updateConfig(bunkId: string, field: keyof BunkConfigState, value: any) {
    setBunkConfigs((prev) =>
      prev.map((c) => (c.bunkId === bunkId ? { ...c, [field]: value } : c))
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      for (const bc of bunkConfigs) {
        const payload = {
          event_id: eventId,
          bunk_id: bc.bunkId,
          is_active: bc.isActive,
          event_capacity: bc.eventCapacity ? parseInt(bc.eventCapacity) : null,
          notes: bc.notes || null,
        }

        if (bc.configId) {
          // Update existing
          await api.put(`/bunks/event-config/${bc.configId}`, payload)
        } else if (bc.isActive) {
          // Create new (only if active)
          await api.post('/bunks/event-config', payload)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['event-bunk-configs', eventId] })
      toast({ type: 'success', message: 'Bunk configuration saved.' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to save configuration.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BedDouble className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configure Bunks</h2>
              <p className="text-sm text-gray-500">{eventName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
        ) : bunkConfigs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No bunks available. Create bunks first.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {bunkConfigs.map((bc) => (
              <div key={bc.bunkId} className={cn('rounded-lg border p-4 transition-colors', bc.isActive ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-gray-50/30')}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{bc.bunkName}</span>
                  <button
                    onClick={() => updateConfig(bc.bunkId, 'isActive', !bc.isActive)}
                    className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors', bc.isActive ? 'bg-emerald-500' : 'bg-gray-200')}
                  >
                    <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5', bc.isActive ? 'translate-x-5 ml-0.5' : 'translate-x-0.5')} />
                  </button>
                </div>

                {bc.isActive && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Capacity Override</label>
                      <input
                        type="number"
                        value={bc.eventCapacity}
                        onChange={(e) => updateConfig(bc.bunkId, 'eventCapacity', e.target.value)}
                        placeholder="Use default"
                        min="0"
                        className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Notes</label>
                      <input
                        type="text"
                        value={bc.notes}
                        onChange={(e) => updateConfig(bc.bunkId, 'notes', e.target.value)}
                        placeholder="Optional notes"
                        className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}
