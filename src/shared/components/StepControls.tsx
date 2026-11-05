import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

export const STEP_OPTIONS = [1, 5, 10, 100] as const
export type StepSize = (typeof STEP_OPTIONS)[number]

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * +/- button with press-and-hold repeat (starts after 350ms, speeds up while held).
 * `onStep` must use a functional state update so repeats never read a stale value.
 */
export function StepButton({
  direction, onStep, disabled, size = 'md', label,
}: {
  direction: 'down' | 'up'
  onStep: () => void
  disabled?: boolean
  size?: 'md' | 'lg'
  label: string
}) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(onStep)
  stepRef.current = onStep

  const stop = () => {
    if (timeout.current) clearTimeout(timeout.current)
    if (interval.current) clearInterval(interval.current)
    timeout.current = null
    interval.current = null
  }
  useEffect(() => stop, [])
  useEffect(() => { if (disabled) stop() }, [disabled])

  const start = (e: React.PointerEvent) => {
    if (disabled || e.button > 0) return
    e.preventDefault()
    stepRef.current()
    let delay = 120
    timeout.current = setTimeout(function tick() {
      stepRef.current()
      delay = Math.max(45, delay * 0.85) // accelerate while held
      timeout.current = setTimeout(tick, delay)
    }, 350)
  }

  const dims = size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-11 w-11 rounded-xl'
  const Icon = direction === 'up' ? Plus : Minus

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStep() }
      }}
      className={`flex flex-shrink-0 touch-manipulation select-none items-center justify-center border border-border-col bg-surface2 text-text-col transition-[background-color,transform,opacity] duration-100 hover:bg-surface2/70 active:scale-95 active:bg-accent-soft active:text-accent disabled:opacity-30 [-webkit-tap-highlight-color:transparent] ${dims} ${focusRing}`}
    >
      <Icon size={size === 'lg' ? 22 : 18} strokeWidth={2.25} />
    </button>
  )
}

/** One step size for every +/- in the form */
export function StepSizePicker({ value, onChange }: { value: StepSize; onChange: (s: StepSize) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span id="step-size-label" className="font-body text-sm text-muted">קפיצה</span>
      <div role="radiogroup" aria-labelledby="step-size-label" className="flex gap-1 rounded-xl bg-surface p-1">
        {STEP_OPTIONS.map((s) => {
          const selected = s === value
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(s)}
              className={`h-9 min-w-[44px] rounded-lg px-2 font-display text-lg font-semibold tabular-nums transition-colors duration-150 ${focusRing}
                ${selected ? 'bg-accent text-bg' : 'text-muted hover:text-text-col'}`}
            >
              {s}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const clampTo = (min: number, max: number) => (n: number) => Math.min(max, Math.max(min, Math.round(n)))

const STEP_KEY = 'fitnesstracker:step-size'

/** Step size remembered between openings (per device); defaults to 1 */
export function useStepSize(): [StepSize, (s: StepSize) => void] {
  const [step, setStep] = useState<StepSize>(() => {
    try {
      const saved = Number(localStorage.getItem(STEP_KEY))
      return (STEP_OPTIONS as readonly number[]).includes(saved) ? (saved as StepSize) : 1
    } catch {
      return 1
    }
  })
  const update = (s: StepSize) => {
    setStep(s)
    try { localStorage.setItem(STEP_KEY, String(s)) } catch { /* convenience only */ }
  }
  return [step, update]
}
