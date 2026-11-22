import { useState } from 'react'
import { StepButton, StepSizePicker, useStepSize } from '../../shared/components/StepControls'
import { MacroComposition } from '../today/nutritionVisuals'
import { nutrientsFor } from './foodMath'
import type { Food } from './types'

const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('he-IL')

interface AmountPickerProps {
  food: Food
  amount: number
  onChange: (amount: number) => void
}

/**
 * Amount for one food. Units foods count units; gram foods count grams,
 * and when the food has a unit weight you can also count in units ("2 ביצים").
 */
export function AmountPicker({ food, amount, onChange }: AmountPickerProps) {
  const [step, setStep] = useStepSize()
  const canCountUnits = food.measurement === 'grams' && !!food.unitWeightG && !!food.unitName
  const [byUnits, setByUnits] = useState(food.measurement === 'units')
  const unitW = food.unitWeightG ?? 1

  // What the big number shows
  const counting = food.measurement === 'units' || byUnits
  const shown = food.measurement === 'grams' && byUnits ? amount / unitW : amount
  const unitLabel = counting ? (food.unitNamePlural && shown !== 1 ? food.unitNamePlural : food.unitName ?? 'יח׳') : food.amountUnit === 'ml' ? 'מ״ל' : 'גרם'
  // Units step in halves; grams use the step-size picker
  const delta = counting ? 0.5 : step
  const max = counting ? 50 : 5000

  const setShown = (v: number) => {
    const clamped = Math.min(max, Math.max(0, Math.round(v * 10) / 10))
    onChange(food.measurement === 'grams' && byUnits ? Math.round(clamped * unitW * 10) / 10 : clamped)
  }

  const m = nutrientsFor(food, amount)

  return (
    <div className="flex flex-col gap-4">
      {canCountUnits && (
        <div role="radiogroup" aria-label="יחידת כמות" className="grid grid-cols-2 gap-1 rounded-xl bg-bg p-1">
          {[
            { v: false, label: food.amountUnit === 'ml' ? 'מ״ל' : 'גרם' },
            { v: true, label: `${food.unitNamePlural ?? food.unitName} (${fmt(unitW)} גרם)` },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              role="radio"
              aria-checked={byUnits === o.v}
              onClick={() => setByUnits(o.v)}
              className={`h-10 truncate rounded-lg border px-2 font-body text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                ${byUnits === o.v ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-transparent text-muted hover:text-text-col'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <StepButton size="lg" direction="down" label={`הפחת ${delta}`} disabled={shown <= 0} onStep={() => setShown(shown - delta)} />
        <label className="flex min-w-0 flex-col items-center gap-0.5">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`כמות ב${unitLabel}`}
            value={shown === 0 ? '' : String(Math.round(shown * 10) / 10)}
            placeholder="0"
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              const v = Number(e.target.value.replace(/[^\d.]/g, ''))
              if (!Number.isNaN(v)) setShown(v)
            }}
            className="w-[5ch] min-w-0 bg-transparent text-center font-display text-[56px] font-bold leading-none tabular-nums text-heading caret-accent outline-none placeholder:text-subtle"
          />
          <span className="font-body text-sm text-muted">{unitLabel}</span>
        </label>
        <StepButton size="lg" direction="up" label={`הוסף ${delta}`} disabled={shown >= max} onStep={() => setShown(shown + delta)} />
      </div>

      {!counting && <StepSizePicker value={step} onChange={setStep} />}

      <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border-col bg-bg p-3 text-center">
        <Stat label="קלוריות" value={fmt(m.calories)} accent />
        <Stat label="חלבון" value={`${fmt(m.protein)}g`} />
        <Stat label="פחמימה" value={`${fmt(m.carbs)}g`} />
        <Stat label="שומן" value={`${fmt(m.fat)}g`} />
      </div>
      <MacroComposition protein={m.protein} carbs={m.carbs} fat={m.fat} />
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`font-display text-xl font-semibold leading-none tabular-nums ${accent ? 'text-accent' : 'text-heading'}`}>{value}</span>
      <span className="font-body text-xs text-muted">{label}</span>
    </div>
  )
}
