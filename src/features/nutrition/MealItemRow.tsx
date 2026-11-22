import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { amountUnitLabel, maxAmountFor, nutrientsFor, referenceLine, typicalUnitOf } from './foodMath'
import type { Food } from './types'
import { QuantityStepper } from './ui/QuantityStepper'
import { DEFAULT_UNIT_MODE, resolveUnitStepper, TypicalUnitToggle, type UnitMode } from './ui/TypicalUnitToggle'
import { focusRing } from './ui/styles'

/** Units food: ½ unit; gram food: 10 g; a counted food in units mode: one whole unit */
export const stepFor = (food: Food) => (food.measurement === 'units' ? 0.5 : 10)
const minFor = (food: Food) => (food.measurement === 'units' ? 0.5 : 1)

/** Next amount after a +/− tap, kept in range */
export const stepAmount = (food: Food, amount: number, delta: number) =>
  Math.min(maxAmountFor(food), Math.max(minFor(food), Math.round((amount + delta) * 10) / 10))

/**
 * One ingredient of a meal, like the app's meal builder / meal review row:
 * name + kcal pill, then the stepper (with the grams/units toggle above it), the macros and delete.
 */
export function MealItemRow({ food, amount, onChange, onRemove, showReference }: {
  food: Food
  amount: number
  onChange: (amount: number) => void
  onRemove: () => void
  showReference?: boolean
}) {
  const n = nutrientsFor(food, amount)
  const typicalUnit = typicalUnitOf(food)
  const [unitMode, setUnitMode] = useState<UnitMode>(DEFAULT_UNIT_MODE)
  const change = (delta: number) => onChange(stepAmount(food, amount, delta))
  const step = stepFor(food)
  const stepper = resolveUnitStepper({
    typicalUnit,
    mode: unitMode,
    amount,
    gramsStepper: { value: amount, unit: amountUnitLabel(food), onIncrease: () => change(step), onDecrease: () => change(-step) },
    addDelta: change,
  })

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 flex-1 truncate font-body text-base text-heading">{food.name}</span>
        <span className="flex-shrink-0 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 font-body text-xs font-semibold tabular-nums text-accent">
          {Math.round(n.calories).toLocaleString('he-IL')} קק״ל
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-2">
          <TypicalUnitToggle unit={typicalUnit} amountUnit={food.amountUnit} mode={unitMode} onChangeMode={setUnitMode} />
          <QuantityStepper {...stepper} name={food.name} />
        </div>
        <span className="flex items-center gap-3 font-body text-xs tabular-nums" aria-label={`חלבון ${Math.round(n.protein)}, פחמימה ${Math.round(n.carbs)}, שומן ${Math.round(n.fat)} גרם`}>
          <span className="text-macro-protein">{Math.round(n.protein)}</span>
          <span className="text-macro-carbs">{Math.round(n.carbs)}</span>
          <span className="text-macro-fat">{Math.round(n.fat)}</span>
        </span>
        <button type="button" onClick={onRemove} aria-label={`מחק ${food.name}`}
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-danger hover:bg-danger/10 ${focusRing}`}>
          <Trash2 size={18} strokeWidth={2} />
        </button>
      </div>

      {showReference && <p className="font-body text-xs text-muted">{referenceLine(food)}</p>}
    </div>
  )
}
