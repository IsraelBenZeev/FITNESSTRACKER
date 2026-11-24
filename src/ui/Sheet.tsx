import { useEffect, useId, type ReactNode } from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'

// Below ConfirmDialog (z-200) and the feedback card (z-300), so both show over any sheet
const LEVEL_Z = { 1: 'z-[150]', 2: 'z-[160]', 3: 'z-[170]' } as const

/**
 * The app's ModalBottom: a sheet from the bottom with a title, an optional action beside the close button,
 * and scrolling content. `level` stacks a sheet over another (e.g. "add exercise" over "my exercises").
 */
export function Sheet({
  open, title, onClose, headerAction, children, level = 1, tall = false,
}: { open: boolean; title: string; onClose: () => void; headerAction?: ReactNode; children: ReactNode; level?: 1 | 2 | 3; tall?: boolean }) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return ReactDOM.createPortal(
    <div className={`fixed inset-0 flex flex-col justify-end ${LEVEL_Z[level]}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-[pageEnter_0.2s_ease] bg-black/60" />
      <div
        className={`relative mx-auto flex w-full max-w-[640px] animate-[trayIn_0.28s_cubic-bezier(0.2,0.8,0.2,1)] flex-col rounded-t-3xl border-t border-white/10 bg-background-900 pb-[env(safe-area-inset-bottom,0px)] motion-reduce:animate-none ${tall ? 'max-h-[90dvh] min-h-[75dvh]' : 'max-h-[85dvh] min-h-[60dvh]'}`}
      >
        <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20" />
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-2">
          <h2 id={titleId} className="typo-h4 text-heading">{title}</h2>
          <div className="flex items-center gap-2">
            {headerAction}
            <button
              type="button"
              onClick={onClose}
              aria-label="סגור"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background-800 text-heading transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
            >
              <X size={22} />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
