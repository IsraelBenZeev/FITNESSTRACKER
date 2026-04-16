import { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          background: '#111',
          borderRadius: '18px 18px 0 0',
          borderTop: '2px solid #D7FF00',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
          animation: 'slideUp 0.22s cubic-bezier(0.32,0.72,0,1) forwards',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px 14px',
            borderBottom: '1px solid #1a1a1a',
          }}
        >
          <span
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              color: '#f0f0f0',
              letterSpacing: '0.04em',
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1a1a1a',
              border: '1px solid #222',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#666',
              flexShrink: 0,
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
