import { useEffect, useId, useRef } from 'react'
import ReactDOM from 'react-dom'

interface ConfirmDialogProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
}

/** Centered destructive confirmation. Cancel is focused first so a stray Enter is safe. */
export function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'מחיקה',
  cancelLabel = 'ביטול',
}: ConfirmDialogProps) {
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    cancelRef.current?.focus()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const btn =
    'h-12 flex-1 rounded-xl font-body text-[15px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

  return ReactDOM.createPortal(
    <div onClick={onCancel} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-6 backdrop-blur-[2px]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] animate-[pageEnter_0.15s_ease-out] rounded-[20px] border border-border-col bg-surface p-5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)]"
      >
        <p id={messageId} className="mb-5 text-center font-body text-base leading-relaxed text-heading">
          {message}
        </p>
        <div className="flex gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`${btn} bg-surface2 text-text-col hover:bg-surface2/70 focus-visible:outline-accent`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${btn} bg-danger font-semibold text-bg hover:bg-danger/90 focus-visible:outline-danger`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
