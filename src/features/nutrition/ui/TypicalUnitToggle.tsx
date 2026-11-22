import { unitLabel, type TypicalUnit } from '../foodMath'
import { focusRing } from './styles'

/** How a counted food's amount is stepped: by grams (10) or by whole units (egg = 60 g) */
export type UnitMode = 'grams' | 'units'

/** A counted food opens in units mode — that's how people think of an egg or a slice */
export const DEFAULT_UNIT_MODE: UnitMode = 'units'

export interface StepperValue {
  value: number
  unit: string
  onIncrease: () => void
  onDecrease: () => void
}

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * The amount stepper's props, like the app's resolveUnitStepper:
 * in units mode every +/− moves a whole unit and the number shown is the unit count.
 * The amount itself is always stored in grams/ml.
 */
export function resolveUnitStepper({ typicalUnit, mode, amount, gramsStepper, addDelta }: {
  typicalUnit: TypicalUnit | null
  mode: UnitMode
  amount: number
  gramsStepper: StepperValue
  addDelta: (delta: number) => void
}): StepperValue {
  if (!typicalUnit || mode !== 'units') return gramsStepper
  const count = r1(amount / typicalUnit.weight)
  return {
    value: count,
    unit: count === 1 ? typicalUnit.name : typicalUnit.plural,
    onIncrease: () => addDelta(typicalUnit.weight),
    // never below one unit (or the amount, if it is already smaller)
    onDecrease: () => {
      if (amount - typicalUnit.weight >= 1) addDelta(-typicalUnit.weight)
    },
  }
}

/** "גרם | ביצים" switch above the stepper, with "1 ביצה = 60 גרם" under it */
export function TypicalUnitToggle({ unit, amountUnit, mode, onChangeMode }: {
  unit: TypicalUnit | null
  amountUnit: 'g' | 'ml'
  mode: UnitMode
  onChangeMode: (m: UnitMode) => void
}) {
  if (!unit) return null
  const options: { key: UnitMode; label: string }[] = [
    { key: 'grams', label: unitLabel(amountUnit) },
    { key: 'units', label: unit.plural },
  ]
  return (
    <div className="flex flex-col items-center gap-1">
      <div role="radiogroup" aria-label="אופן הזנת הכמות" className="flex overflow-hidden rounded-full border border-accent/45">
        {options.map((o, i) => {
          const selected = o.key === mode
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChangeMode(o.key)}
              className={`flex min-h-7 min-w-16 items-center justify-center px-3 font-body text-sm font-bold transition-colors duration-150 ${focusRing}
                ${i > 0 ? 'border-s border-accent/45' : ''} ${selected ? 'bg-accent/[0.18] text-accent' : 'text-muted'}`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      <span className="font-body text-xs text-muted">{`1 ${unit.name} = ${unit.weight} ${unitLabel(amountUnit)}`}</span>
    </div>
  )
}
