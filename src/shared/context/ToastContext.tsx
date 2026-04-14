import { createContext, useContext, useRef, useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'

type ToastType = 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  function addToast(message: string, type: ToastType) {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }

  const value: ToastContextValue = {
    showSuccess: (msg) => addToast(msg, 'success'),
    showError: (msg) => addToast(msg, 'error'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: '#1a1a1a',
              border: `1px solid ${t.type === 'success' ? 'rgba(215,255,0,0.35)' : 'rgba(255,71,87,0.35)'}`,
              borderRadius: '12px',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              animation: 'slideUp 0.2s cubic-bezier(0.32,0.72,0,1) forwards',
              whiteSpace: 'nowrap',
            }}
          >
            {t.type === 'success' ? (
              <Check size={14} color="#D7FF00" strokeWidth={2.5} />
            ) : (
              <AlertCircle size={14} color="#ff4757" strokeWidth={2.5} />
            )}
            <span
              style={{
                fontFamily: '"Rubik", sans-serif',
                fontSize: '13px',
                color: t.type === 'success' ? '#D7FF00' : '#ff4757',
              }}
            >
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
