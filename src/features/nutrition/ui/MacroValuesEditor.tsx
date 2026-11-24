import { snapStep } from '../../../lib/snapStep'
import { LIMITS } from '../foodMath'
import type { Macros } from '../types'
import { QuantityStepper } from './QuantityStepper'
import { StepChips, useStepChip } from './StepChips'

const ROWS: { key: keyof Macros; label: string; unit: string; dot: string }[] = [
  { key: 'calories', label: 'קלוריות', unit: 'קק״ל', dot: 'bg-accent' },
  { key: 'protein', label: 'חלבון', unit: 'g', dot: 'bg-macro-protein' },
  { key: 'carbs', label: 'פחמימות', unit: 'g', dot: 'bg-macro-carbs' },
  { key: 'fat', label: 'שומן', unit: 'g', dot: 'bg-macro-fat' },
]


/**
 * The app's macro editor: one −/+ stepper per value and a shared "קפיצות 1 / 10 / 50" picker.
 * Every tap lands on a multiple of the step (1 → 10 → 20), so round values are always reachable.
 * No inputs — values change only with + and −.
 */
export function MacroValuesEditor({ values, onChange, caloriesError = false, markCarbsFatOptional = false }: {
  values: Macros
  onChange: (patch: Partial<Macros>) => void
  caloriesError?: boolean
  markCarbsFatOptional?: boolean
}) {
  const stepChips = useStepChip(10)
  const step = stepChips.value

  const set = (key: keyof Macros, v: number) => {
    const max = key === 'calories' ? LIMITS.maxCaloriesPer100 : LIMITS.maxMacroPer100
    onChange({ [key]: Math.min(max, Math.max(0, v)) })
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-end gap-2 pb-2 pt-2">
        <span className="font-body text-xs text-muted">קפיצות</span>
        <StepChips {...stepChips} label="גודל קפיצה לערכים" />
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
              onIncrease={() => set(row.key, snapStep(value, step))}
              onDecrease={() => set(row.key, snapStep(value, -step))}
            />
          </div>
        )
      })}
    </div>
  )
}
