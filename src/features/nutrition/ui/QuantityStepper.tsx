import { useEffect, useRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import { focusRing } from './styles'

interface QuantityStepperProps {
  value: number
  /** Unit shown under the number (גרם, יח׳, ביצים…) */
  unit: string
  onIncrease: () => void
  onDecrease: () => void
  /** Item name, for the button labels */
  name: string
  /** sm for dense rows (macro editor) */
  size?: 'md' | 'sm'
}

const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('he-IL')

/**
 * The app's capsule stepper: −, value and unit, +.
 * No typing — every change is a tap; holding a button repeats and speeds up.
 */
export function QuantityStepper({ value, unit, onIncrease, onDecrease, name, size = 'md' }: QuantityStepperProps) {
  const btn = size === 'sm' ? 'h-10 w-10' : 'h-11 w-11'
  return (
    <div className="flex flex-shrink-0 items-center rounded-full border border-white/[0.08] bg-white/[0.05] p-[3px]">
      <HoldButton onStep={onDecrease} label={`הפחת כמות מ${name}`} className={`${btn} text-heading`}>
        <Minus size={20} strokeWidth={2.25} />
      </HoldButton>
      <span className={`flex flex-col items-center ${size === 'sm' ? 'min-w-[56px]' : 'min-w-[70px]'}`} aria-live="polite">
        <span className="font-body text-base font-semibold tabular-nums text-heading">{fmt(value)}</span>
        <span className="font-body text-xs text-muted">{unit}</span>
      </span>
      <HoldButton onStep={onIncrease} label={`הוסף כמות ל${name}`} className={`${btn} text-accent`}>
        <Plus size={20} strokeWidth={2.25} />
      </HoldButton>
    </div>
  )
}

/** Round button: a tap steps once; holding repeats after 350ms and accelerates */
function HoldButton({ onStep, label, className, children }: { onStep: () => void; label: string; className: string; children: React.ReactNode }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepRef = useRef(onStep)
  stepRef.current = onStep

  const stop = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => stop, [])

  const start = (e: React.PointerEvent) => {
    if (e.button > 0) return
    e.preventDefault()
    stepRef.current()
    let delay = 140
    timer.current = setTimeout(function tick() {
      stepRef.current()
      delay = Math.max(50, delay * 0.85)
      timer.current = setTimeout(tick, delay)
    }, 350)
  }

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStep() }
      }}
      className={`flex flex-shrink-0 touch-manipulation select-none items-center justify-center rounded-full transition-transform duration-100 active:scale-90 [-webkit-tap-highlight-color:transparent] ${className} ${focusRing}`}
    >
      {children}
    </button>
  )
}
