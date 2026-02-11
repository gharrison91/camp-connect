/**
 * Camp Connect - Embed Code Generator Modal
 * Lets admins generate embed codes (iframe, JS snippet, direct link)
 * to put forms on external websites (WordPress, Shopify, etc.).
 */

import { useState } from 'react'
import {
  X,
  Code,
  Copy,
  Check,
  ExternalLink,
  Globe,
  AlertTriangle,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const EMBED_BASE_URL = import.meta.env.VITE_APP_URL || 'https://camp-connect.vercel.app'

type EmbedTab = 'iframe' | 'javascript' | 'link'

interface EmbedCodeModalProps {
  isOpen: boolean
  onClose: () => void
  formId: string
  formName: string
  formStatus: string
}

export function EmbedCodeModal({
  isOpen,
  onClose,
  formId,
  formName,
  formStatus,
}: EmbedCodeModalProps) {
  const [activeTab, setActiveTab] = useState<EmbedTab>('iframe')
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  const [iframeHeight, setIframeHeight] = useState('600')

  if (!isOpen) return null

  const formUrl = `${EMBED_BASE_URL}/embed/form/${formId}`
  const isPublished = formStatus === 'published'

  const iframeCode = `<iframe
  src="${formUrl}"
  width="100%"
  height="${iframeHeight}"
  frameborder="0"
  style="border: none; border-radius: 8px;"
  title="${formName}"
  loading="lazy"
></iframe>`

  const jsCode = `<div id="camp-connect-form-${formId}"></div>
<script src="${EMBED_BASE_URL}/embed.js"
        data-form-id="${formId}"
        data-height="${iframeHeight}"></script>`

  const directLink = formUrl

  const handleCopy = async (text: string, tab: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTab(tab)
      setTimeout(() => setCopiedTab(null), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedTab(tab)
      setTimeout(() => setCopiedTab(null), 2000)
    }
  }

  const tabs: { key: EmbedTab; label: string; icon: React.ElementType }[] = [
    { key: 'iframe', label: 'Embed Code', icon: Code },
    { key: 'javascript', label: 'JavaScript', icon: Monitor },
    { key: 'link', label: 'Direct Link', icon: ExternalLink },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Globe className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Embed Form
              </h2>
              <p className="text-sm text-gray-500">
                Add this form to any external website
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning if not published */}
        {!isPublished && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Form is not published
              </p>
              <p className="mt-0.5 text-sm text-amber-600">
                This form is currently in <strong>{formStatus}</strong> status.
                Change the status to <strong>Published</strong> and save before
                embedding, or the form will not load on external sites.
              </p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
                    activeTab === tab.key
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Height config for iframe/js */}
          {(activeTab === 'iframe' || activeTab === 'javascript') && (
            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600">
                Height (px):
              </label>
              <input
                type="number"
                value={iframeHeight}
                onChange={(e) => setIframeHeight(e.target.value)}
                min="200"
                max="2000"
                step="50"
                className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Code display */}
          <div className="mt-4">
            {activeTab === 'iframe' && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Paste this HTML into your website to embed the form.
                  </p>
                  <button
                    onClick={() => handleCopy(iframeCode, 'iframe')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      copiedTab === 'iframe'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {copiedTab === 'iframe' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm leading-relaxed text-emerald-400">
                  <code>{iframeCode}</code>
                </pre>
              </div>
            )}

            {activeTab === 'javascript' && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    More customizable embed using JavaScript. Automatically adjusts height.
                  </p>
                  <button
                    onClick={() => handleCopy(jsCode, 'javascript')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      copiedTab === 'javascript'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {copiedTab === 'javascript' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm leading-relaxed text-emerald-400">
                  <code>{jsCode}</code>
                </pre>
              </div>
            )}

            {activeTab === 'link' && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Share this link directly. Opens the form in a standalone page.
                  </p>
                  <button
                    onClick={() => handleCopy(directLink, 'link')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      copiedTab === 'link'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {copiedTab === 'link' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                  <Globe className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate text-sm text-gray-700 font-mono">
                    {directLink}
                  </span>
                  <a
                    href={directLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700">Preview</h3>
            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 rounded-md bg-gray-100 px-3 py-1 text-center">
                  <span className="text-xs text-gray-400 font-mono">
                    yourwebsite.com/contact
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded bg-emerald-100 flex items-center justify-center">
                      <Globe className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {formName || 'Untitled Form'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded bg-gray-100" />
                    <div className="h-8 w-full rounded border border-gray-200 bg-gray-50" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                    <div className="h-8 w-full rounded border border-gray-200 bg-gray-50" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                    <div className="h-20 w-full rounded border border-gray-200 bg-gray-50" />
                    <div className="pt-2">
                      <div className="h-9 w-28 rounded-lg bg-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-[10px] text-gray-400">
                      Powered by Camp Connect
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
