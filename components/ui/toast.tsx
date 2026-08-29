'use client'

import * as React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  /** Milliseconds before the toast dismisses itself. Pass 0 to keep it until dismissed by hand. */
  duration?: number
}

interface Toast extends ToastOptions {
  id: number
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number
  dismiss: (id: number) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION_MS = 5000
// An error is the one variant worth reading twice, so it lingers.
const ERROR_DURATION_MS = 8000

const VARIANT_STYLES: Record<ToastVariant, { container: string; icon: React.ElementType; iconClass: string }> = {
  success: { container: 'border-success/40', icon: CheckCircle2, iconClass: 'text-success' },
  error: { container: 'border-destructive/50', icon: XCircle, iconClass: 'text-destructive' },
  warning: { container: 'border-warning/40', icon: AlertTriangle, iconClass: 'text-warning' },
  info: { container: 'border-border', icon: Info, iconClass: 'text-muted-foreground' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const nextId = React.useRef(0)
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = React.useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((previous) => previous.filter((item) => item.id !== id))
  }, [])

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const id = (nextId.current += 1)
      const variant = options.variant ?? 'info'
      setToasts((previous) => [...previous, { ...options, variant, id }])

      const duration = options.duration ?? (variant === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS)
      // Scheduled here rather than in an effect: this is an imperative call, and the repo already
      // fights set-state-in-effect bugs. Timers are keyed by id so dismiss() can cancel them.
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        )
      }

      return id
    },
    [dismiss],
  )

  React.useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
    }
  }, [])

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-100 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4">
      {toasts.map((item) => {
        const styles = VARIANT_STYLES[item.variant ?? 'info']
        const Icon = styles.icon

        return (
          <div
            key={item.id}
            // Errors interrupt; everything else is announced politely when the reader is idle.
            role={item.variant === 'error' ? 'alert' : 'status'}
            aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
            className={cn(
              'pointer-events-auto flex w-full items-start gap-3 rounded-md border bg-card p-3 shadow-lg sm:w-96',
              styles.container,
            )}
          >
            <Icon className={cn('mt-0.5 size-4 shrink-0', styles.iconClass)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-card-foreground">{item.title}</p>
              {item.description && <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
