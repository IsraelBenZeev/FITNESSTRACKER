import { useState } from 'react'
import { Zap } from 'lucide-react'
import { amountUnitLabel, maxAmountFor, nutrientsFor, referenceLine, typicalUnitOf } from './foodMath'
import { useDayProgress } from './hooks'
import type { Food, Macros } from './types'
import { NutritionSummaryCard } from './ui/NutritionSummaryCard'
import { QuantityStepper } from './ui/QuantityStepper'
import { DEFAULT_UNIT_MODE, resolveUnitStepper, TypicalUnitToggle, type UnitMode } from './ui/TypicalUnitToggle'
import { focusRing } from './ui/styles'

/**
 * Amount for one food, like the app's FoodAmountPanel:
 * grams/units toggle, capsule stepper (10 g / ½ unit / one whole unit), the food's regular portion,
 * the rings card and the reference values.
 */
export function FoodAmountPanel({ food, amount, onChange, baseTotals }: {
  food: Food
  amount: number
  onChange: (amount: number) => void
  /** Ingredients already in the meal (meal builder only) */
  baseTotals?: Macros
}) {
  const { goals, consumed } = useDayProgress()
  const isUnits = food.measurement === 'units'
  const step = isUnits ? 0.5 : 10
  const min = isUnits ? 0.5 : 1
  const typicalUnit = typicalUnitOf(food)
  const defaultAmount = food.defaultAmount != null && food.defaultAmount > 0 ? food.defaultAmount : null
  const [unitMode, setUnitMode] = useState<UnitMode>(DEFAULT_UNIT_MODE)

  const change = (delta: number) => onChange(Math.min(maxAmountFor(food), Math.max(min, Math.round((amount + delta) * 10) / 10)))
  const stepper = resolveUnitStepper({
    typicalUnit,
    mode: unitMode,
    amount,
    gramsStepper: { value: amount, unit: amountUnitLabel(food), onIncrease: () => change(step), onDecrease: () => change(-step) },
    addDelta: change,
  })

  const n = nutrientsFor(food, amount)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-2">
        <TypicalUnitToggle unit={typicalUnit} amountUnit={food.amountUnit} mode={unitMode} onChangeMode={setUnitMode} />
        <QuantityStepper {...stepper} name={food.name} />
        {defaultAmount != null && (
          <button
            type="button"
            onClick={() => onChange(defaultAmount)}
            disabled={amount === defaultAmount}
            aria-label={`בחר מנה רגילה, ${defaultAmount} ${amountUnitLabel(food)}`}
            className={`flex min-h-9 items-center gap-1.5 rounded-full border border-accent/45 px-3 font-body text-xs font-semibold text-accent transition-opacity duration-150 disabled:opacity-40 ${focusRing}`}
          >
            <Zap size={14} strokeWidth={2} aria-hidden />
            {`מנה רגילה · ${defaultAmount} ${amountUnitLabel(food)}`}
          </button>
        )}
      </div>
      <NutritionSummaryCard totals={{ ...n, calories: Math.round(n.calories) }} goals={goals} consumed={consumed} baseTotals={baseTotals} />
      <p className="text-center font-body text-xs text-muted">{referenceLine(food)}</p>
    </div>
  )
}
