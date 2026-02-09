import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useCreateFamily } from '@/hooks/useFamilies'
import { useToast } from '@/components/ui/Toast'

interface FamilyCreateModalProps {
  onClose: () => void
}

export function FamilyCreateModal({ onClose }: FamilyCreateModalProps) {
  const createFamily = useCreateFamily()
  const { toast } = useToast()
  const [familyName, setFamilyName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createFamily.mutateAsync({ family_name: familyName.trim() })
      toast({ type: 'success', message: 'Family created successfully!' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to create family.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Family
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Family Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. The Johnson Family"
            />
          </div>

          {/* Error */}
          {createFamily.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Failed to create family. Please check your input.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createFamily.isPending || !familyName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createFamily.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create Family
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
