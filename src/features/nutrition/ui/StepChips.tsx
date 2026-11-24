import { useState } from 'react'
import { focusRing } from './styles'

/** Step sizes for every gram / macro stepper */
export const STEP_CHIPS = [1, 10, 50] as const
export type StepChip = (typeof STEP_CHIPS)[number]

export interface StepChipsState {
  value: StepChip
  onChange: (s: StepChip) => void
}

/** Selected step size, 10 by default */
export function useStepChip(initial: StepChip = 10): StepChipsState {
  const [value, onChange] = useState<StepChip>(initial)
  return { value, onChange }
}

/** Small floating pills "1 · 10 · 50" that pick how far each −/+ tap moves */
export function StepChips({ value, onChange, label = 'גודל קפיצה' }: StepChipsState & { label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {STEP_CHIPS.map((s) => {
        const selected = s === value
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`קפיצות של ${s}`}
            onClick={() => onChange(s)}
            className={`relative flex h-6 min-w-8 items-center justify-center rounded-full border px-2 font-body text-[11px] font-bold tabular-nums shadow-sm shadow-black/30 transition-colors duration-150 before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] ${focusRing}
              ${selected ? 'border-accent/50 bg-accent/20 text-accent' : 'border-white/[0.08] bg-surface2 text-muted hover:text-text-col'}`}
          >
            {s}
          </button>
        )
      })}
    </div>
  )
}
