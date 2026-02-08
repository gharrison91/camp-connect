import { AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

export function DeleteConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
