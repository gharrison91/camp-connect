import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastOptions {
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Config per toast type
// ---------------------------------------------------------------------------

const toastConfig: Record<
  ToastType,
  { icon: typeof CheckCircle2; borderColor: string; iconColor: string; bgColor: string }
> = {
  success: {
    icon: CheckCircle2,
    borderColor: 'border-l-emerald-500',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
  },
  error: {
    icon: XCircle,
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  info: {
    icon: Info,
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
}

const TOAST_DURATION = 4000 // ms

// ---------------------------------------------------------------------------
// Single toast card
// ---------------------------------------------------------------------------

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const config = toastConfig[item.type]
  const Icon = config.icon

  // Slide in on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      startExit()
    }, TOAST_DURATION)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startExit = useCallback(() => {
    setExiting(true)
    setTimeout(() => onDismiss(item.id), 300) // matches transition duration
  }, [item.id, onDismiss])

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    startExit()
  }

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex w-80 items-start gap-3 rounded-lg border border-l-4 bg-white p-4 shadow-lg transition-all duration-300',
        config.borderColor,
        visible && !exiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', config.iconColor)}>
        <Icon className="h-5 w-5" />
      </div>

      <p className="flex-1 text-sm font-medium text-gray-800">{item.message}</p>

      <button
        onClick={handleClose}
        className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

let toastCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastCounter}-${Date.now()}`
    setToasts((prev) => [...prev, { id, ...options }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-3"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
