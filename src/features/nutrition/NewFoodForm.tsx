import { useState } from 'react'
import type { NewFoodInput } from './api'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const toNum = (v: string) => {
  const n = Number(v.replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

interface NewFoodFormProps {
  initialName: string
  pending: boolean
  onSubmit: (input: NewFoodInput) => void
}

/** A personal food (BodyBuddy `food_items`): values per 100 g/ml, or per unit */
export function NewFoodForm({ initialName, pending, onSubmit }: NewFoodFormProps) {
  const [name, setName] = useState(initialName)
  const [measurement, setMeasurement] = useState<'grams' | 'units'>('grams')
  const [amountUnit, setAmountUnit] = useState<'g' | 'ml'>('g')
  const [unitName, setUnitName] = useState('')
  const [unitWeight, setUnitWeight] = useState('')
  const [vals, setVals] = useState({ calories: '', protein: '', carbs: '', fat: '' })
  const [tried, setTried] = useState(false)

  const kcal = toNum(vals.calories)
  const invalid = !name.trim() || kcal <= 0 || (measurement === 'units' && !unitName.trim())
  const per = measurement === 'grams' ? `ל-100 ${amountUnit === 'ml' ? 'מ״ל' : 'גרם'}` : `ל${unitName.trim() || 'יחידה'}`

  const submit = () => {
    setTried(true)
    if (invalid || pending) return
    onSubmit({
      name,
      measurement,
      amountUnit,
      values: { calories: kcal, protein: toNum(vals.protein), carbs: toNum(vals.carbs), fat: toNum(vals.fat) },
      unitName: unitName.trim() || null,
      unitWeightG: unitWeight ? toNum(unitWeight) : null,
    })
  }

  return (
    <form id="new-food-form" className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
      <Field id="nf-name" label="שם המאכל">
        <input id="nf-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className={inputCls} aria-invalid={(tried && !name.trim()) || undefined} />
      </Field>

      <div role="radiogroup" aria-label="איך מודדים" className="grid grid-cols-2 gap-1 rounded-xl bg-bg p-1">
        {([['grams', 'לפי משקל'], ['units', 'לפי יחידה']] as const).map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={measurement === v} onClick={() => setMeasurement(v)}
            className={`h-10 rounded-lg font-body text-sm transition-colors duration-150 ${focusRing} ${measurement === v ? 'bg-accent font-medium text-bg' : 'text-muted hover:text-text-col'}`}>
            {l}
          </button>
        ))}
      </div>

      {measurement === 'grams' ? (
        <div role="radiogroup" aria-label="יחידת משקל" className="flex gap-2">
          {([['g', 'גרם'], ['ml', 'מ״ל (משקה)']] as const).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={amountUnit === v} onClick={() => setAmountUnit(v)}
              className={`h-9 rounded-full border px-3.5 font-body text-sm transition-colors duration-150 ${focusRing} ${amountUnit === v ? 'border-accent bg-accent-soft text-accent' : 'border-border-col text-text-col'}`}>
              {l}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Field id="nf-unit" label={measurement === 'units' ? 'שם היחידה' : 'שם יחידה (לא חובה)'}>
          <input id="nf-unit" value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="למשל: חטיף" className={inputCls}
            aria-invalid={(tried && measurement === 'units' && !unitName.trim()) || undefined} />
        </Field>
        <Field id="nf-uw" label="משקל יחידה בגרם">
          <input id="nf-uw" value={unitWeight} onChange={(e) => setUnitWeight(e.target.value)} inputMode="decimal" placeholder="לא חובה" className={inputCls} />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2 rounded-2xl border border-border-col bg-bg p-3">
        <legend className="px-1 font-body text-sm text-muted">ערכים {per}</legend>
        <div className="grid grid-cols-2 gap-3">
          {([['calories', 'קלוריות'], ['protein', 'חלבון (g)'], ['carbs', 'פחמימה (g)'], ['fat', 'שומן (g)']] as const).map(([k, l]) => (
            <Field key={k} id={`nf-${k}`} label={l}>
              <input id={`nf-${k}`} inputMode="decimal" value={vals[k]} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} placeholder="0"
                className={`${inputCls} font-display text-xl tabular-nums`} aria-invalid={(tried && k === 'calories' && kcal <= 0) || undefined} />
            </Field>
          ))}
        </div>
      </fieldset>

      {tried && invalid && <p className="font-body text-sm text-danger">צריך שם, קלוריות{measurement === 'units' ? ' ושם יחידה' : ''}.</p>}
    </form>
  )
}

const inputCls =
  'h-11 w-full rounded-xl border border-border-col bg-surface px-3 font-body text-base text-heading outline-none transition-colors duration-150 placeholder:text-subtle focus:border-accent-line aria-[invalid=true]:border-danger'

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="font-body text-xs text-muted">{label}</label>
      {children}
    </div>
  )
}
