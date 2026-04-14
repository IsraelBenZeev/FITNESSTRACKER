import { useEffect } from 'react'
import ReactDOM from 'react-dom'

interface ConfirmDialogProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'מחיקה',
  cancelLabel = 'ביטול',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid #222',
          borderTop: '2px solid #D7FF00',
          borderRadius: '16px',
          padding: '28px 24px 20px',
          width: '280px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '15px',
            color: '#ccc',
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid #333',
              background: 'transparent',
              color: '#888',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: '#ff4757',
              color: '#fff',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
