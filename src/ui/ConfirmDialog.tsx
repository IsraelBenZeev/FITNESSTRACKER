import { useEffect, useId, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Info, Loader2, Trash2, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ConfirmDialogVariant = 'danger' | 'info'

interface ConfirmDialogProps {
  visible: boolean
  title: string
  message?: string
  /** 'danger' (default) — red, for destructive actions. 'info' — lime, for a regular confirmation. */
  variant?: ConfirmDialogVariant
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  icon?: LucideIcon
  /** Shows a spinner on the confirm button and blocks both buttons */
  isLoading?: boolean
  /** X in the corner that cancels */
  showCloseButton?: boolean
  /** false = a message with a single (confirm) button */
  showCancel?: boolean
}

const VARIANTS: Record<ConfirmDialogVariant, { iconBg: string; iconText: string; confirm: string; icon: LucideIcon; label: string }> = {
  danger: { iconBg: 'bg-danger/15', iconText: 'text-danger', confirm: 'bg-danger/10 text-danger hover:bg-danger/15', icon: Trash2, label: 'מחק' },
  info: { iconBg: 'bg-accent/15', iconText: 'text-accent', confirm: 'bg-accent/10 text-accent hover:bg-accent/15', icon: Info, label: 'אישור' },
}

/**
 * Generic "are you sure?" dialog, like the app's ConfirmDialog: icon in a tinted circle,
 * title, message, and a split footer — cancel | confirm. Cancel gets focus first, so a stray Enter is safe.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  variant = 'danger',
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel = 'ביטול',
  icon,
  isLoading = false,
  showCloseButton = false,
  showCancel = true,
}: ConfirmDialogProps) {
  const titleId = useId()
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const v = VARIANTS[variant]
  const Icon = icon ?? v.icon

  useEffect(() => {
    if (!visible) return
    ;(showCancel ? cancelRef : confirmRef).current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isLoading) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible, onCancel, isLoading, showCancel])

  if (!visible) return null

  const footerBtn = 'flex min-h-[52px] flex-1 items-center justify-center px-3 font-body text-base font-semibold transition-colors duration-150 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'

  return ReactDOM.createPortal(
    <div onClick={() => !isLoading && onCancel()} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6 backdrop-blur-[2px]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[360px] animate-[dialogIn_0.2s_cubic-bezier(0.33,1,0.68,1)_both] overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] motion-reduce:animate-none"
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="סגירה"
            className="absolute end-2 top-2 flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-surface2 hover:text-text-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X size={20} strokeWidth={2} />
          </button>
        )}

        <div className="flex flex-col items-center px-6 pb-5 pt-6 text-center">
          <span aria-hidden className={`mb-3 flex h-[54px] w-[54px] items-center justify-center rounded-full ${v.iconBg} ${v.iconText}`}>
            <Icon size={28} strokeWidth={1.75} />
          </span>
          <h2 id={titleId} className="font-body text-lg font-semibold text-heading [text-wrap:balance]">{title}</h2>
          {message && <p id={messageId} className="mt-2 whitespace-pre-line font-body text-[15px] leading-relaxed text-muted [text-wrap:pretty]">{message}</p>}
        </div>

        <div className="flex border-t border-white/10">
          {showCancel && (
            <button ref={cancelRef} type="button" onClick={onCancel} disabled={isLoading}
              className={`${footerBtn} border-e border-white/10 text-heading hover:bg-white/[0.04]`}>
              {cancelLabel}
            </button>
          )}
          <button ref={confirmRef} type="button" onClick={onConfirm} disabled={isLoading} aria-busy={isLoading || undefined}
            className={`${footerBtn} ${v.confirm}`}>
            {isLoading ? <Loader2 size={20} strokeWidth={2.25} className="animate-spin" aria-label="מבצע…" /> : confirmLabel ?? v.label}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
