import { useEffect, useId } from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Sticky action area pinned to the bottom of the sheet (primary action lives here) */
  footer?: React.ReactNode
  /** Compact control shown in the header next to the title (e.g. a time chip) */
  headerAction?: React.ReactNode
  zIndexOverride?: number
}

/**
 * Bottom sheet. Content scrolls; header and footer stay put,
 * so the primary action is always under the thumb.
 */
export function Modal({ isOpen, onClose, title, children, footer, headerAction, zIndexOverride }: ModalProps) {
  const titleId = useId()

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
      // Stacked sheets (e.g. exercise detail over the picker) pass a higher layer
      className={`fixed inset-0 flex items-end ${zIndexOverride != null && zIndexOverride > 100 ? 'z-[120]' : 'z-[100]'}`}
    >
      <div onClick={onClose} aria-hidden className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[92dvh] w-full animate-[slideUp_0.24s_cubic-bezier(0.32,0.72,0,1)_forwards] flex-col overflow-hidden rounded-t-[20px] border-t border-border-col bg-surface shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.6)]"
      >
        {/* Grab handle */}
        <span aria-hidden className="mx-auto mt-2 h-1 w-10 flex-shrink-0 rounded-full bg-subtle/60" />

        <header className="flex flex-shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <h2 id={titleId} className="truncate font-body text-lg font-semibold text-heading">
              {title}
            </h2>
            {headerAction}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="-me-2.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-surface2 hover:text-text-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-5 pt-2">
          {children}
        </div>

        {footer && (
          <footer className="flex-shrink-0 border-t border-border-col bg-surface px-5 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3">
            {footer}
          </footer>
        )}
        {!footer && <span aria-hidden className="h-[env(safe-area-inset-bottom,0px)] flex-shrink-0" />}
      </div>
    </div>,
    document.body,
  )
}
