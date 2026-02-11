/**
 * Camp Connect - NotificationPreferencesPage
 * Personal notification preferences management page.
 * Allows users to control what notifications they receive and how (email, in-app, push).
 */

import { useState, useEffect } from 'react'
import {
  Bell,
  BellOff,
  Mail,
  Monitor,
  Smartphone,
  Clock,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useResetNotificationPreferences,
} from '@/hooks/useNotificationPreferences'
import type { NotificationPreference, NotificationChannelConfig } from '@/types'

// ---------------------------------------------------------------------------
// Toggle Switch Component
// ---------------------------------------------------------------------------

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

function ToggleSwitch({ enabled, onChange, disabled = false, size = 'md' }: ToggleSwitchProps) {
  const sizeClasses = size === 'sm'
    ? { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4', off: 'translate-x-0.5', mt: 'mt-0.5' }
    : { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5', off: 'translate-x-0.5', mt: 'mt-0.5' }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        sizeClasses.track,
        enabled ? 'bg-emerald-500' : 'bg-slate-200',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out',
          sizeClasses.thumb,
          sizeClasses.mt,
          enabled ? sizeClasses.translate : sizeClasses.off,
        )}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Category Icon Map
// ---------------------------------------------------------------------------

function getCategoryIcon(category: string) {
  switch (category) {
    case 'events':
      return <Bell className="h-5 w-5 text-blue-500" />
    case 'registrations':
      return <Bell className="h-5 w-5 text-indigo-500" />
    case 'messages':
      return <Mail className="h-5 w-5 text-emerald-500" />
    case 'health':
      return <Bell className="h-5 w-5 text-red-500" />
    case 'payments':
      return <Bell className="h-5 w-5 text-amber-500" />
    case 'photos':
      return <Bell className="h-5 w-5 text-pink-500" />
    case 'schedule':
      return <Clock className="h-5 w-5 text-purple-500" />
    case 'staff':
      return <Bell className="h-5 w-5 text-teal-500" />
    case 'system':
      return <Monitor className="h-5 w-5 text-slate-500" />
    default:
      return <Bell className="h-5 w-5 text-slate-400" />
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NotificationPreferencesPage() {
  const { toast } = useToast()
  const { data, isLoading } = useNotificationPreferences()
  const updateMutation = useUpdateNotificationPreferences()
  const resetMutation = useResetNotificationPreferences()

  // Local state for editing
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState('22:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00')
  const [digestFrequency, setDigestFrequency] = useState<'instant' | 'hourly' | 'daily'>('instant')
  const [hasChanges, setHasChanges] = useState(false)

  // Sync server data to local state
  useEffect(() => {
    if (data) {
      setPreferences(data.preferences)
      setQuietHoursEnabled(data.quiet_hours_enabled)
      setQuietHoursStart(data.quiet_hours_start || '22:00')
      setQuietHoursEnd(data.quiet_hours_end || '07:00')
      setDigestFrequency(data.digest_frequency)
      setHasChanges(false)
    }
  }, [data])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleChannelToggle = (category: string, channel: keyof NotificationChannelConfig, value: boolean) => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.category === category
          ? { ...p, channels: { ...p.channels, [channel]: value } }
          : p,
      ),
    )
    setHasChanges(true)
  }

  const handleToggleAllChannel = (channel: keyof NotificationChannelConfig, value: boolean) => {
    setPreferences((prev) =>
      prev.map((p) => ({ ...p, channels: { ...p.channels, [channel]: value } })),
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        preferences: preferences.map((p) => ({
          category: p.category,
          channels: p.channels,
        })),
        quiet_hours_enabled: quietHoursEnabled,
        quiet_hours_start: quietHoursEnabled ? quietHoursStart : null,
        quiet_hours_end: quietHoursEnabled ? quietHoursEnd : null,
        digest_frequency: digestFrequency,
      })
      toast({ type: 'success', message: 'Notification preferences saved successfully.' })
      setHasChanges(false)
    } catch {
      toast({ type: 'error', message: 'Failed to save notification preferences.' })
    }
  }

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync()
      toast({ type: 'success', message: 'Notification preferences reset to defaults.' })
      setHasChanges(false)
    } catch {
      toast({ type: 'error', message: 'Failed to reset notification preferences.' })
    }
  }

  // ---------------------------------------------------------------------------
  // Computed: check if all channels are on/off for column header toggles
  // ---------------------------------------------------------------------------

  const allEmail = preferences.length > 0 && preferences.every((p) => p.channels.email)
  const allInApp = preferences.length > 0 && preferences.every((p) => p.channels.in_app)
  const allPush = preferences.length > 0 && preferences.every((p) => p.channels.push)

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-slate-500">Loading notification preferences...</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Bell className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notification Preferences</h1>
              <p className="text-sm text-slate-500">
                Control how and when you receive notifications
              </p>
            </div>
          </div>
        </div>

        {/* Notification Channels Table */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Notification Channels</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose which channels to use for each notification type
            </p>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_80px_80px_80px] items-center gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Category
            </span>
            <div className="flex flex-col items-center gap-1">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Email</span>
              <ToggleSwitch
                size="sm"
                enabled={allEmail}
                onChange={(v) => handleToggleAllChannel('email', v)}
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Monitor className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">In-App</span>
              <ToggleSwitch
                size="sm"
                enabled={allInApp}
                onChange={(v) => handleToggleAllChannel('in_app', v)}
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Smartphone className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Push</span>
              <ToggleSwitch
                size="sm"
                enabled={allPush}
                onChange={(v) => handleToggleAllChannel('push', v)}
              />
            </div>
          </div>

          {/* Preference Rows */}
          <div className="divide-y divide-slate-100">
            {preferences.map((pref) => (
              <div
                key={pref.category}
                className="grid grid-cols-[1fr_80px_80px_80px] items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  {getCategoryIcon(pref.category)}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{pref.label}</p>
                    <p className="text-xs text-slate-500">{pref.description}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ToggleSwitch
                    enabled={pref.channels.email}
                    onChange={(v) => handleChannelToggle(pref.category, 'email', v)}
                  />
                </div>
                <div className="flex justify-center">
                  <ToggleSwitch
                    enabled={pref.channels.in_app}
                    onChange={(v) => handleChannelToggle(pref.category, 'in_app', v)}
                  />
                </div>
                <div className="flex justify-center">
                  <ToggleSwitch
                    enabled={pref.channels.push}
                    onChange={(v) => handleChannelToggle(pref.category, 'push', v)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {quietHoursEnabled ? (
                  <BellOff className="h-5 w-5 text-slate-500" />
                ) : (
                  <Clock className="h-5 w-5 text-slate-400" />
                )}
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Quiet Hours</h2>
                  <p className="text-sm text-slate-500">
                    Pause non-urgent notifications during specific hours
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={quietHoursEnabled}
                onChange={(v) => {
                  setQuietHoursEnabled(v)
                  setHasChanges(true)
                }}
              />
            </div>
          </div>

          {quietHoursEnabled && (
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => {
                      setQuietHoursStart(e.target.value)
                      setHasChanges(true)
                    }}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="mt-6 text-sm text-slate-400">to</div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => {
                      setQuietHoursEnd(e.target.value)
                      setHasChanges(true)
                    }}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                During quiet hours, only critical health and safety notifications will be delivered.
              </p>
            </div>
          )}
        </div>

        {/* Digest Frequency */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Digest Frequency</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose how often you want to receive notification summaries
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-3">
              {([
                {
                  value: 'instant' as const,
                  label: 'Instant',
                  description: 'Receive notifications as they happen',
                },
                {
                  value: 'hourly' as const,
                  label: 'Hourly Summary',
                  description: 'Get a summary of notifications every hour',
                },
                {
                  value: 'daily' as const,
                  label: 'Daily Summary',
                  description: 'Get a single daily digest of all notifications',
                },
              ]).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
                    digestFrequency === option.value
                      ? 'border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50',
                  )}
                >
                  <input
                    type="radio"
                    name="digest_frequency"
                    value={option.value}
                    checked={digestFrequency === option.value}
                    onChange={() => {
                      setDigestFrequency(option.value)
                      setHasChanges(true)
                    }}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <button
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {resetMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Reset to Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || !hasChanges}
            className={cn(
              'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50',
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-emerald-600/70 cursor-not-allowed',
            )}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Unsaved Changes Indicator */}
        {hasChanges && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            You have unsaved changes
          </div>
        )}
      </div>
    </div>
  )
}
