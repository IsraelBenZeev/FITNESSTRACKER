import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { nutrientsFor } from './foodMath'
import type { CartItem, Food } from './types'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const r1 = (n: number) => Math.round(n * 10) / 10
const MIN_UNITS = 0.5

/** Grams vs. units for a gram-food that has a typical unit (egg, roll…) — like the app's TypicalUnitShortcut */
type UnitMode = 'grams' | 'units'

/**
 * The meal before it is logged, like the app's meal review:
 * one card per food with a capsule −/value/+ stepper, its macros and a delete button.
 */
export function CartRows({ items, onChange, onRemove }: {
  items: CartItem[]
  onChange: (key: string, amount: number) => void
  onRemove: (key: string) => void
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => (
        <li key={it.key}>
          <CartRow item={it} onChange={(a) => onChange(it.key, a)} onRemove={() => onRemove(it.key)} />
        </li>
      ))}
    </ul>
  )
}

function CartRow({ item, onChange, onRemove }: { item: CartItem; onChange: (amount: number) => void; onRemove: () => void }) {
  const { food, amount } = item
  const m = nutrientsFor(food, amount)
  const isUnits = food.measurement === 'units'
  const hasTypicalUnit = !isUnits && !!food.unitWeightG && !!food.unitName
  const [mode, setMode] = useState<UnitMode>('grams')
  const byUnits = isUnits || (hasTypicalUnit && mode === 'units')
  const unitW = food.unitWeightG ?? 1

  // What the stepper shows and how much one tap moves it (app: units 0.5, grams 10)
  const shown = !isUnits && byUnits ? amount / unitW : amount
  const step = byUnits ? MIN_UNITS : 10
  const unitLabel = byUnits ? (food.unitName ?? 'יח׳') : food.amountUnit === 'ml' ? 'מ״ל' : 'גרם'
  const setShown = (v: number) => {
    const min = byUnits ? MIN_UNITS : 1
    const clamped = Math.max(min, r1(v))
    onChange(!isUnits && byUnits ? r1(clamped * unitW) : clamped)
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 flex-1 truncate font-body text-base text-heading">{food.name}</span>
        <span className="flex-shrink-0 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 font-body text-xs font-semibold tabular-nums text-accent">
          {Math.round(m.calories).toLocaleString('he-IL')} קק״ל
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-2">
          {hasTypicalUnit && (
            <div role="radiogroup" aria-label={`יחידת כמות ל${food.name}`} className="flex gap-0.5 rounded-full bg-bg p-0.5">
              {([['grams', food.amountUnit === 'ml' ? 'מ״ל' : 'גרם'], ['units', food.unitName!]] as const).map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)}
                  className={`h-7 rounded-full border px-2.5 font-body text-xs transition-colors duration-150 ${focusRing} ${mode === k ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-transparent text-muted hover:text-text-col'}`}>
                  {l}
                </button>
              ))}
            </div>
          )}
          <QuantityStepper value={r1(shown)} unit={unitLabel} name={food.name}
            onDecrease={() => setShown(shown - step)} onIncrease={() => setShown(shown + step)} onChangeValue={setShown} />
        </div>

        <div className="flex items-center gap-3 font-body text-xs tabular-nums" aria-label={`חלבון ${Math.round(m.protein)}, פחמימה ${Math.round(m.carbs)}, שומן ${Math.round(m.fat)} גרם`}>
          <span className="text-macro-protein">{Math.round(m.protein)}</span>
          <span className="text-macro-carbs">{Math.round(m.carbs)}</span>
          <span className="text-macro-fat">{Math.round(m.fat)}</span>
        </div>

        <button type="button" onClick={onRemove} aria-label={`מחק ${food.name}`}
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-danger hover:bg-danger/10 ${focusRing}`}>
          <Trash2 size={18} strokeWidth={2} />
        </button>
      </div>

      <p className="font-body text-xs text-muted">{referenceLine(food)}</p>
    </div>
  )
}

/** "130 קק״ל ל-100 גרם · חלבון 2.7 · פחמ׳ 28 · שומן 0.3" */
function referenceLine(food: Food): string {
  const v = food.measurement === 'units' ? food.perUnit : food.per100
  if (!v) return ''
  const per = food.measurement === 'units' ? `ל${food.unitName ?? 'יחידה'}` : `ל-100 ${food.amountUnit === 'ml' ? 'מ״ל' : 'גרם'}`
  return `${Math.round(v.calories)} קק״ל ${per} · חלבון ${r1(v.protein)} · פחמ׳ ${r1(v.carbs)} · שומן ${r1(v.fat)}`
}

/** Capsule stepper: −, value (typeable) and unit, + — like the app's QuantityStepper */
function QuantityStepper({ value, unit, name, onDecrease, onIncrease, onChangeValue }: {
  value: number
  unit: string
  name: string
  onDecrease: () => void
  onIncrease: () => void
  onChangeValue: (v: number) => void
}) {
  const [text, setText] = useState(String(value))
  const focused = useRef(false)
  useEffect(() => { if (!focused.current) setText(String(value)) }, [value])

  return (
    <div className="flex items-center rounded-full border border-white/[0.08] bg-white/[0.05] p-[3px]">
      <button type="button" onClick={onDecrease} aria-label={`הפחת כמות מ${name}`}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-heading transition-transform duration-100 active:scale-90 ${focusRing}`}>
        <Minus size={20} strokeWidth={2.25} />
      </button>
      <label className="flex min-w-[56px] flex-col items-center">
        <input
          value={text}
          inputMode="decimal"
          aria-label={`כמות ${name} ב${unit}`}
          onFocus={(e) => { focused.current = true; e.currentTarget.select() }}
          onBlur={() => { focused.current = false; setText(String(value)) }}
          onChange={(e) => {
            setText(e.target.value)
            const v = parseFloat(e.target.value.replace(',', '.'))
            if (Number.isFinite(v) && v > 0) onChangeValue(v)
          }}
          className="w-[52px] bg-transparent text-center font-body text-base tabular-nums text-heading outline-none"
        />
        <span className="font-body text-xs text-muted">{unit}</span>
      </label>
      <button type="button" onClick={onIncrease} aria-label={`הוסף כמות ל${name}`}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-accent transition-transform duration-100 active:scale-90 ${focusRing}`}>
        <Plus size={20} strokeWidth={2.25} />
      </button>
    </div>
  )
}
