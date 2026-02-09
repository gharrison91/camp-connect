/**
 * Camp Connect - NotificationSettingsPage
 * Admin page for managing notification configurations.
 */

import { useState } from 'react'
import { Bell, Mail, Phone, Plus, Trash2, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useNotificationConfigs,
  useCreateNotificationConfig,
  useUpdateNotificationConfig,
  useDeleteNotificationConfig,
} from '@/hooks/useNotifications'
import { useToast } from '@/components/ui/Toast'
import type { NotificationConfig, NotificationTriggerType, NotificationChannel } from '@/types'

const TRIGGER_LABELS: Record<string, string> = {
  registration_confirmed: 'Registration Confirmed',
  health_form_reminder: 'Health Form Reminder',
  payment_received: 'Payment Received',
  waitlist_promoted: 'Waitlist Promoted',
  event_reminder: 'Event Reminder',
}

const TRIGGER_OPTIONS: NotificationTriggerType[] = [
  'registration_confirmed', 'health_form_reminder', 'payment_received', 'waitlist_promoted', 'event_reminder',
]

const CHANNEL_OPTIONS: NotificationChannel[] = ['email', 'sms', 'both']

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'sms') return <Phone className="h-4 w-4 text-purple-500" />
  if (channel === 'both') return <Bell className="h-4 w-4 text-blue-500" />
  return <Mail className="h-4 w-4 text-emerald-500" />
}

export function NotificationSettingsPage() {
  const { toast } = useToast()
  const { data: configs = [], isLoading } = useNotificationConfigs()
  const createConfig = useCreateNotificationConfig()
  const updateConfig = useUpdateNotificationConfig()
  const deleteConfig = useDeleteNotificationConfig()

  const [showModal, setShowModal] = useState(false)
  const [triggerType, setTriggerType] = useState<NotificationTriggerType>('registration_confirmed')
  const [channel, setChannel] = useState<NotificationChannel>('email')
  const [isActive, setIsActive] = useState(true)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createConfig.mutateAsync({ trigger_type: triggerType, channel, is_active: isActive })
      toast({ type: 'success', message: 'Notification config created.' })
      setShowModal(false)
    } catch {
      toast({ type: 'error', message: 'Failed to create config.' })
    }
  }

  async function handleToggle(config: NotificationConfig) {
    try {
      await updateConfig.mutateAsync({ id: config.id, data: { is_active: !config.is_active } })
    } catch {
      toast({ type: 'error', message: 'Failed to update config.' })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteConfig.mutateAsync(id)
      toast({ type: 'success', message: 'Config deleted.' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete config.' })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
          <p className="mt-1 text-sm text-gray-500">Configure automated notifications for system events.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Configuration
        </button>
      </div>

      {configs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Bell className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No notification configs</p>
          <p className="mt-1 text-sm text-gray-500">Add a configuration to enable automated notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div key={config.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <ChannelIcon channel={config.channel} />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {TRIGGER_LABELS[config.trigger_type] || config.trigger_type}
                  </h4>
                  <p className="text-xs text-gray-500 capitalize">
                    Channel: {config.channel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(config)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
                    config.is_active ? 'bg-emerald-500' : 'bg-gray-200'
                  )}
                >
                  <span className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5',
                    config.is_active ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                  )} />
                </button>
                <button onClick={() => handleDelete(config.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Notification Config</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Trigger Type</label>
                <select value={triggerType} onChange={(e) => setTriggerType(e.target.value as NotificationTriggerType)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {TRIGGER_OPTIONS.map((t) => <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Channel</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value as NotificationChannel)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {CHANNEL_OPTIONS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300" />
                Active
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createConfig.isPending} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                  {createConfig.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
