import { createContext, useContext, useMemo } from 'react'
import { triggerFeedback } from '../../store/uiStore'
import { GlobalFeedback } from '../../ui/GlobalFeedback'

interface ToastContextValue {
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** Success / failure feedback. Kept as a hook so existing callers don't change; the UI is <GlobalFeedback />. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ToastContextValue>(() => ({
    showSuccess: (msg) => triggerFeedback(msg, 'success'),
    showError: (msg) => triggerFeedback(msg, 'failed'),
  }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <GlobalFeedback />
    </ToastContext.Provider>
  )
}
