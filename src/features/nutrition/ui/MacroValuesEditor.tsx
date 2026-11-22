import { useState } from 'react'
import { LIMITS } from '../foodMath'
import type { Macros } from '../types'
import { QuantityStepper } from './QuantityStepper'
import { focusRing } from './styles'

const ROWS: { key: keyof Macros; label: string; unit: string; dot: string }[] = [
  { key: 'calories', label: 'קלוריות', unit: 'קק״ל', dot: 'bg-accent' },
  { key: 'protein', label: 'חלבון', unit: 'g', dot: 'bg-macro-protein' },
  { key: 'carbs', label: 'פחמימות', unit: 'g', dot: 'bg-macro-carbs' },
  { key: 'fat', label: 'שומן', unit: 'g', dot: 'bg-macro-fat' },
]

const STEPS = [1, 5, 10] as const
const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * The app's macro editor: one −/+ stepper per value and a shared "קפיצות 1 / 5 / 10" picker.
 * No inputs — values change only with + and −.
 */
export function MacroValuesEditor({ values, onChange, caloriesError = false, markCarbsFatOptional = false }: {
  values: Macros
  onChange: (patch: Partial<Macros>) => void
  caloriesError?: boolean
  markCarbsFatOptional?: boolean
}) {
  const [step, setStep] = useState<(typeof STEPS)[number]>(1)

  const set = (key: keyof Macros, v: number) => {
    const max = key === 'calories' ? LIMITS.maxCaloriesPer100 : LIMITS.maxMacroPer100
    onChange({ [key]: Math.min(max, Math.max(0, r1(v))) })
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-end gap-2 pb-1 pt-2">
        <span id="macro-step-label" className="font-body text-xs text-muted">קפיצות</span>
        <div role="radiogroup" aria-labelledby="macro-step-label" className="flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] p-0.5">
          {STEPS.map((s) => {
            const selected = s === step
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`קפיצות של ${s}`}
                onClick={() => setStep(s)}
                className={`flex min-h-9 min-w-11 items-center justify-center rounded-full border px-2.5 font-body text-xs font-bold tabular-nums transition-colors duration-150 ${focusRing}
                  ${selected ? 'border-accent/50 bg-accent/20 text-accent' : 'border-transparent text-muted'}`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {ROWS.map((row) => {
        const value = values[row.key]
        const hasError = caloriesError && row.key === 'calories'
        const optional = markCarbsFatOptional && (row.key === 'carbs' || row.key === 'fat')
        return (
          <div key={row.key} className="flex min-h-14 items-center justify-between border-t border-white/[0.06]">
            <span className="flex items-center gap-2">
              <span aria-hidden className={`h-2 w-2 rounded-full ${row.dot}`} />
              <span className={`font-body text-sm ${hasError ? 'text-danger' : 'text-muted'}`}>
                {row.label}
                {hasError ? ' (חובה)' : ''}
                {optional && <span className="text-xs text-muted/80"> (אופציונלי)</span>}
              </span>
            </span>
            <QuantityStepper
              size="sm"
              value={value}
              unit={row.unit}
              name={row.label}
              onIncrease={() => set(row.key, value + step)}
              onDecrease={() => set(row.key, value - step)}
            />
          </div>
        )
      })}
    </div>
  )
}
