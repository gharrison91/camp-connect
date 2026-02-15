/**
 * Camp Connect - Super Admin Platform Settings
 * Manage platform-level configurations and integrations.
 */

import { useState } from 'react'
import {
  Settings,
  Key,
  Radar,
  Phone,
  Mail,
  CreditCard,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { usePlatformSettings, useUpdatePlatformSettings, useTestPlatformIntegration } from '@/hooks/useAdmin'

interface IntegrationCardProps {
  title: string
  description: string
  icon: typeof Radar
  color: string
  integrationKey: string
  isConfigured: boolean
  onSave: (key: string, value: string) => Promise<void>
  onTest: () => Promise<void>
  isTesting: boolean
  isSaving: boolean
}

function IntegrationCard({
  title,
  description,
  icon: Icon,
  color,
  integrationKey,
  isConfigured,
  onSave,
  onTest,
  isTesting,
  isSaving,
}: IntegrationCardProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [editing, setEditing] = useState(false)

  const handleSave = async () => {
    if (!apiKey.trim()) return
    await onSave(integrationKey, apiKey)
    setApiKey('')
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {isConfigured ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <AlertCircle className="h-3 w-3" /> Not configured
          </span>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || isSaving}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setApiKey('')
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Key className="h-4 w-4" />
            {isConfigured ? 'Update API Key' : 'Configure'}
          </button>
          {isConfigured && (
            <button
              onClick={onTest}
              disabled={isTesting}
              className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Test
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminSettingsPage() {
  const { toast } = useToast()
  const { data: settings, isLoading } = usePlatformSettings()
  const updateSettings = useUpdatePlatformSettings()
  const testIntegration = useTestPlatformIntegration()

  const [testingKey, setTestingKey] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const handleSaveIntegration = async (key: string, value: string) => {
    setSavingKey(key)
    try {
      await updateSettings.mutateAsync({ [key]: value })
      toast({ type: 'success', message: 'Integration updated successfully' })
    } catch {
      toast({ type: 'error', message: 'Failed to update integration' })
    } finally {
      setSavingKey(null)
    }
  }

  const handleTestIntegration = async (key: string) => {
    setTestingKey(key)
    try {
      const result = await testIntegration.mutateAsync(key)
      toast({
        type: result.success ? 'success' : 'error',
        message: result.message,
      })
    } catch {
      toast({ type: 'error', message: 'Failed to test integration' })
    } finally {
      setTestingKey(null)
    }
  }

  const integrations = [
    {
      key: 'apollo_api_key',
      title: 'Apollo.io',
      description: 'Lead enrichment and prospecting',
      icon: Radar,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    },
    {
      key: 'twilio_api_key',
      title: 'Twilio',
      description: 'SMS notifications and communication',
      icon: Phone,
      color: 'bg-gradient-to-br from-red-500 to-pink-600',
    },
    {
      key: 'sendgrid_api_key',
      title: 'SendGrid',
      description: 'Email delivery and campaigns',
      icon: Mail,
      color: 'bg-gradient-to-br from-blue-400 to-cyan-500',
    },
    {
      key: 'stripe_api_key',
      title: 'Stripe',
      description: 'Payment processing and subscriptions',
      icon: CreditCard,
      color: 'bg-gradient-to-br from-violet-500 to-purple-600',
    },
  ]

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
            <p className="text-sm text-slate-500">
              Configure platform-wide integrations and API connections
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Platform-level integrations:</strong> These API keys are used across all
          organizations. Individual camps will use your connections without needing their own
          API keys.
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.key}
            title={integration.title}
            description={integration.description}
            icon={integration.icon}
            color={integration.color}
            integrationKey={integration.key}
            isConfigured={!!settings?.configured_integrations?.includes(integration.key)}
            onSave={handleSaveIntegration}
            onTest={() => handleTestIntegration(integration.key)}
            isTesting={testingKey === integration.key}
            isSaving={savingKey === integration.key}
          />
        ))}
      </div>

      {/* Additional Settings */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Platform Configuration</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Allow Organization Self-Service</p>
                <p className="text-xs text-slate-500">Let organizations configure their own integrations</p>
              </div>
              <button
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  settings?.allow_org_integrations ? 'bg-violet-500' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    settings?.allow_org_integrations && 'translate-x-5'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Maintenance Mode</p>
                <p className="text-xs text-slate-500">Temporarily disable platform access for maintenance</p>
              </div>
              <button
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  settings?.maintenance_mode ? 'bg-red-500' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    settings?.maintenance_mode && 'translate-x-5'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Debug Mode</p>
                <p className="text-xs text-slate-500">Enable verbose logging for troubleshooting</p>
              </div>
              <button
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  settings?.debug_mode ? 'bg-violet-500' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    settings?.debug_mode && 'translate-x-5'
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
