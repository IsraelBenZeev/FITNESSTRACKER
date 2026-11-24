import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { snapStep } from '../../lib/snapStep'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  stepOptions?: number[]
  label?: string
  unit?: string
  decimals?: number
  /** protein: blue +/- buttons and step chips, like the protein ring */
  tone?: 'accent' | 'protein'
}

const TONES = {
  accent: { btn: 'text-accent hover:bg-accent-soft active:bg-accent-soft focus-visible:outline-accent', chip: 'border-accent bg-accent-soft text-accent', ring: 'focus-visible:outline-accent' },
  protein: { btn: 'text-macro-protein hover:bg-macro-protein/15 active:bg-macro-protein/15 focus-visible:outline-macro-protein', chip: 'border-macro-protein bg-macro-protein/15 text-macro-protein', ring: 'focus-visible:outline-macro-protein' },
} as const
const focusBase = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
const roundBase = `flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-[background-color,opacity] duration-150  disabled:opacity-30 disabled:hover:bg-transparent select-none touch-manipulation [-webkit-tap-highlight-color:transparent] ${focusBase}`

/** Capsule stepper: − value + (hold to repeat), with selectable step sizes underneath */
export function Stepper({ value, onChange, min, max, step, stepOptions = [step], label, unit, decimals = 0, tone = 'accent' }: StepperProps) {
  const t = TONES[tone]
  const roundBtn = `${roundBase} ${t.btn}`
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeStep, setActiveStep] = useState(step)
  // Long-press repeats read the latest value, not the one captured when the press started
  const valueRef = useRef(value)
  valueRef.current = value

  const clamp = (v: number) => Math.min(max, Math.max(min, parseFloat(v.toFixed(decimals))))
  // Taps land on multiples of the step, so an odd value (1937) still reaches round ones (1940, 1950)
  const nudge = (dir: 1 | -1) => () => onChange(clamp(snapStep(valueRef.current, dir * activeStep)))

  const stopLongPress = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }
  const startLongPress = (fn: () => void) => {
    fn()
    timeoutRef.current = setTimeout(() => { intervalRef.current = setInterval(fn, 80) }, 400)
  }
  useEffect(() => stopLongPress, [])

  const atMin = value <= min
  const atMax = value >= max
  const fmt = (n: number) => n.toLocaleString('he-IL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  return (
    <div className="flex flex-col gap-2.5">
      {label && <span className="px-1 font-body text-sm font-medium text-text-col">{label}</span>}

      <div className="flex items-center gap-2 rounded-full border border-border-col bg-bg p-1">
        <button type="button" aria-label={`הפחת ${fmt(activeStep)}`} disabled={atMin} className={roundBtn}
          onPointerDown={() => startLongPress(nudge(-1))} onPointerUp={stopLongPress} onPointerLeave={stopLongPress}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nudge(-1)() } }}>
          <Minus size={22} strokeWidth={2.25} />
        </button>

        <output aria-live="polite" className="flex flex-1 items-baseline justify-center gap-1.5">
          <span className="font-display text-[34px] font-semibold leading-none tabular-nums text-heading">{fmt(value)}</span>
          {unit && <span className="font-body text-sm text-muted">{unit}</span>}
        </output>

        <button type="button" aria-label={`הוסף ${fmt(activeStep)}`} disabled={atMax} className={roundBtn}
          onPointerDown={() => startLongPress(nudge(1))} onPointerUp={stopLongPress} onPointerLeave={stopLongPress}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nudge(1)() } }}>
          <Plus size={22} strokeWidth={2.25} />
        </button>
      </div>

      {stepOptions.length > 1 && (
        <div role="radiogroup" aria-label="גודל צעד" className="flex items-center justify-center gap-1.5">
          {stepOptions.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={activeStep === option}
              onClick={() => setActiveStep(option)}
              className={`h-8 min-w-[44px] rounded-full border px-3 font-body text-sm tabular-nums transition-colors duration-150 ${focusBase} ${t.ring} ${activeStep === option ? `${t.chip} font-medium` : 'border-border-col text-muted hover:text-text-col'}`}
            >
              {option.toLocaleString('he-IL')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
