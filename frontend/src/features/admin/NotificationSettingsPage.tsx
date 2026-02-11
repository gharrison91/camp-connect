/**
 * Camp Connect - NotificationSettingsPage
 * Admin page for managing notification configuration settings.
 * Replaces the alert builder with a configuration/settings panel.
 */

import { useState, useEffect } from 'react'
import { Bell, Mail, Phone, Save, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

// ─── Types ───────────────────────────────────────────────────

interface NotificationSettings {
  email: {
    from_name: string
    reply_to: string
    footer_text: string
    domain_configured: boolean
  }
  sms: {
    phone_number: string
    provider_connected: boolean
  }
  preferences: Record<string, boolean>
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email: {
    from_name: '',
    reply_to: '',
    footer_text: '',
    domain_configured: false,
  },
  sms: {
    phone_number: '',
    provider_connected: false,
  },
  preferences: {
    registration_confirmed: true,
    health_form_reminder: true,
    payment_received: true,
    waitlist_promoted: true,
    event_reminder: true,
  },
}

// ─── Preference Categories ──────────────────────────────────

interface PreferenceItem {
  key: string
  label: string
  description: string
}

const PREFERENCE_CATEGORIES: { title: string; items: PreferenceItem[] }[] = [
  {
    title: 'Registration',
    items: [
      { key: 'registration_confirmed', label: 'Registration Confirmed', description: 'Notify when a camper registration is confirmed' },
      { key: 'waitlist_promoted', label: 'Waitlist Promoted', description: 'Notify when a camper is promoted from the waitlist' },
    ],
  },
  {
    title: 'Payments',
    items: [
      { key: 'payment_received', label: 'Payment Received', description: 'Notify when a payment is received' },
    ],
  },
  {
    title: 'Events',
    items: [
      { key: 'event_reminder', label: 'Event Reminder', description: 'Send reminders before events start' },
    ],
  },
  {
    title: 'Health',
    items: [
      { key: 'health_form_reminder', label: 'Health Form Reminder', description: 'Remind parents to complete health forms' },
    ],
  },
]

// ─── Main Component ─────────────────────────────────────────

export function NotificationSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings')
      const data = res.data
      const notif = data.settings?.notifications || {}
      setSettings({
        email: {
          from_name: notif.email_from_name || '',
          reply_to: notif.email_reply_to || '',
          footer_text: notif.email_footer_text || '',
          domain_configured: notif.email_domain_configured || false,
        },
        sms: {
          phone_number: notif.sms_phone_number || '',
          provider_connected: notif.sms_provider_connected || false,
        },
        preferences: {
          registration_confirmed: notif.pref_registration_confirmed !== false,
          health_form_reminder: notif.pref_health_form_reminder !== false,
          payment_received: notif.pref_payment_received !== false,
          waitlist_promoted: notif.pref_waitlist_promoted !== false,
          event_reminder: notif.pref_event_reminder !== false,
        },
      })
    } catch {
      // Use defaults on error
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/settings', {
        notifications: {
          email_from_name: settings.email.from_name,
          email_reply_to: settings.email.reply_to,
          email_footer_text: settings.email.footer_text,
          email_domain_configured: settings.email.domain_configured,
          sms_phone_number: settings.sms.phone_number,
          sms_provider_connected: settings.sms.provider_connected,
          pref_registration_confirmed: settings.preferences.registration_confirmed,
          pref_health_form_reminder: settings.preferences.health_form_reminder,
          pref_payment_received: settings.preferences.payment_received,
          pref_waitlist_promoted: settings.preferences.waitlist_promoted,
          pref_event_reminder: settings.preferences.event_reminder,
        },
      })
      toast({ type: 'success', message: 'Notification settings saved.' })
    } catch {
      toast({ type: 'error', message: 'Failed to save notification settings.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Notification Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure email, SMS, and notification preferences for your organization.
        </p>
      </div>

      {/* Section 1: Email Configuration */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-emerald-500" />
          <h3 className="text-sm font-semibold text-slate-900">Email Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">From Name</label>
            <input
              type="text"
              value={settings.email.from_name}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  email: { ...p.email, from_name: e.target.value },
                }))
              }
              placeholder="e.g. Camp Sunshine"
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Reply-to Email</label>
            <input
              type="email"
              value={settings.email.reply_to}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  email: { ...p.email, reply_to: e.target.value },
                }))
              }
              placeholder="e.g. info@campsunshine.com"
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email Footer Text</label>
            <textarea
              value={settings.email.footer_text}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  email: { ...p.email, footer_text: e.target.value },
                }))
              }
              rows={3}
              placeholder="e.g. Camp Sunshine, 123 Lake Rd, Anytown USA"
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DNS / Domain Status</label>
            <div className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
              settings.email.domain_configured
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            )}>
              {settings.email.domain_configured ? (
                <><CheckCircle className="h-3.5 w-3.5" /> Configured</>
              ) : (
                <><XCircle className="h-3.5 w-3.5" /> Not configured</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: SMS Configuration */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-purple-500" />
          <h3 className="text-sm font-semibold text-slate-900">SMS Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">SMS Phone Number</label>
            <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 border border-slate-100">
              {settings.sms.phone_number || 'No number assigned'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SMS Provider Status</label>
            <div className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
              settings.sms.provider_connected
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            )}>
              {settings.sms.provider_connected ? (
                <><CheckCircle className="h-3.5 w-3.5" /> Connected</>
              ) : (
                <><XCircle className="h-3.5 w-3.5" /> Not connected</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Notification Preferences */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-900">Notification Preferences</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Enable or disable automated notifications by category.
        </p>
        <div className="space-y-6">
          {PREFERENCE_CATEGORIES.map((category) => (
            <div key={category.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {category.title}
              </h4>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <div
                    key={item.key}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
                      settings.preferences[item.key]
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200 bg-white'
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((p) => ({
                          ...p,
                          preferences: {
                            ...p.preferences,
                            [item.key]: !p.preferences[item.key],
                          },
                        }))
                      }
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
                        settings.preferences[item.key] ? 'bg-emerald-500' : 'bg-slate-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5',
                          settings.preferences[item.key]
                            ? 'translate-x-5 ml-0.5'
                            : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Notification Preferences */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Personal Notification Preferences</h3>
            <p className="mt-1 text-xs text-slate-500">
              Manage your personal notification channels, quiet hours, and digest frequency.
            </p>
          </div>
          <Link
            to="/app/notification-preferences"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Manage personal notification preferences
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end border-t border-slate-200 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
