import { useEffect, useState } from 'react'
import { Camera, Plus, Search, UtensilsCrossed } from 'lucide-react'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
/** Options fan out one after another, like the app */
const STAGGER = ['delay-0', 'delay-75', 'delay-150']

interface AddOptionsFabProps {
  onAddFood: () => void
  onAddMeal: () => void
}

interface Option {
  key: string
  label: string
  aria: string
  hint: string
  icon: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  /** Tailwind classes for the round button (BodyBuddy's per-option colors, as opaque tints) */
  tone: string
  size: string
}

/**
 * The BodyBuddy app's "+" button: tap to fan out מאכל / ארוחה / AI above it.
 * AI is shown like in the app but disabled for now.
 */
export function AddOptionsFab({ onAddFood, onAddMeal }: AddOptionsFabProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const pick = (fn: () => void) => () => { setOpen(false); fn() }

  // Bottom → top, like the app (index 1 is closest to the +)
  const options: Option[] = [
    {
      key: 'food', label: 'מאכל', aria: 'הוסף מאכל', hint: 'חיפוש במאגר ובמאכלים שלך', onClick: pick(onAddFood),
      icon: <Search size={20} strokeWidth={2.25} aria-hidden />,
      tone: 'border-2 border-violet-300/80 bg-bg/85 text-violet-200 backdrop-blur-md', size: 'h-[58px] w-[58px]',
    },
    {
      key: 'meal', label: 'ארוחה', aria: 'הוסף ארוחה', hint: 'ארוחה שמורה או ארוחה חדשה', onClick: pick(onAddMeal),
      icon: <UtensilsCrossed size={20} strokeWidth={2.25} aria-hidden />,
      tone: 'border-2 border-orange-300/80 bg-bg/85 text-orange-200 backdrop-blur-md', size: 'h-[58px] w-[58px]',
    },
    {
      key: 'ai', label: 'AI', aria: 'צילום ארוחה עם AI — עדיין לא זמין', hint: 'בקרוב', disabled: true,
      icon: <Camera size={24} strokeWidth={2.25} aria-hidden />,
      tone: 'border-2 border-accent/80 bg-bg/85 text-lime-300 backdrop-blur-md', size: 'h-[72px] w-[72px]',
    },
  ]

  return (
    <>
      {/* Scrim: tap outside closes */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <div className="fixed bottom-[calc(57px+env(safe-area-inset-bottom,0px)+12px)] right-[max(16px,env(safe-area-inset-right,0px))] z-50 flex flex-col items-center">
        <div className="relative flex w-[88px] flex-col items-center">
          <ul className="absolute bottom-[76px] flex flex-col-reverse items-center gap-3" aria-hidden={!open}>
            {options.map((o, i) => (
              <li
                key={o.key}
                className={`transition-[opacity,transform] duration-200 ease-out ${open ? `${STAGGER[i]} translate-y-0 scale-100 opacity-100` : 'pointer-events-none translate-y-6 scale-50 opacity-0 delay-0'}`}
              >
                <button
                  type="button"
                  onClick={o.onClick}
                  disabled={o.disabled}
                  aria-disabled={o.disabled || undefined}
                  aria-label={o.aria}
                  title={o.disabled ? 'בקרוב' : o.hint}
                  tabIndex={open ? 0 : -1}
                  className={`relative flex flex-col items-center justify-center gap-0.5 rounded-full shadow-[0_6px_10px_rgba(0,0,0,0.35)] transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:grayscale-[60%] ${o.size} ${o.tone} ${focusRing}`}
                >
                  {o.icon}
                  <span className="font-body text-xs font-semibold leading-none">{o.label}</span>
                  {o.disabled && (
                    <span className="absolute -bottom-2 rounded-full border border-border-col bg-surface px-1.5 py-px font-body text-[11px] leading-tight text-muted">בקרוב</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'סגור תפריט הוספה' : 'פתח תפריט הוספת מאכל או ארוחה'}
            className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-bg/85 text-lime-300 shadow-[0_6px_14px_rgba(0,0,0,0.45)] backdrop-blur-md transition-transform duration-150 active:scale-95 ${focusRing}`}
          >
            <Plus size={30} strokeWidth={2.5} aria-hidden className={`transition-transform duration-200 ${open ? 'rotate-45' : 'rotate-0'}`} />
          </button>
        </div>
        <span className="mt-1 font-body text-xs font-semibold text-lime-300">{open ? 'סגור' : 'הוסף'}</span>
      </div>
    </>
  )
}
