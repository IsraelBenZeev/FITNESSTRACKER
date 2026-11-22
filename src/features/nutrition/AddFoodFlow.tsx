import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Calendar, Info, PlusCircle } from 'lucide-react'
import { Modal, type SheetLevel } from '../../shared/components/Modal'
import { todayLocal } from '../../lib/date'
import { CategoryGroups, RecentStrip, ResultRows } from './BrowseFoods'
import { FoodAmountPanel } from './FoodAmountPanel'
import { baseAmountFor, LIMITS, typicalUnitOf, unitLabel } from './foodMath'
import { useAddSingleFood, useCatalog, useCreateFood, useDayProgress, useMyFoods, useRecentFoods } from './hooks'
import type { Food, Macros } from './types'
import { MacroValuesEditor } from './ui/MacroValuesEditor'
import { NutritionSummaryCard } from './ui/NutritionSummaryCard'
import { QuantityStepper } from './ui/QuantityStepper'
import { ActionButton, SegmentedActionBar } from './ui/SegmentedActionBar'
import { DEFAULT_UNIT_MODE, resolveUnitStepper, TypicalUnitToggle, type UnitMode } from './ui/TypicalUnitToggle'
import { BackLink, FlowTitle, SearchField } from './ui/FlowParts'
import { focusRing } from './ui/styles'

type Phase = 'search' | 'db-amount' | 'custom-details'
type SaveTarget = 'save' | 'journal'

interface AddFoodFlowProps {
  isOpen: boolean
  onClose: () => void
  /** standalone: "add food" from the + button. meal-builder: add an ingredient to a meal being built */
  mode: 'standalone' | 'meal-builder'
  level?: SheetLevel
  /** "המאכלים והארוחות שלי" button on the search step (standalone only) */
  onOpenMyList?: () => void
  /** meal-builder: the picked food and amount go into the meal */
  onPickForMeal?: (food: Food, amount: number) => void
  /** meal-builder: what the meal already has, for the rings and "what's left" */
  baseTotals?: Macros
}

const nowIso = () => new Date().toISOString()

/**
 * The app's "add food" screen (AddNewFood): search the catalog and my foods → pick an amount,
 * or add a personal food — values with −/+ steppers only — and save it, log it, or both.
 */
export function AddFoodFlow({ isOpen, onClose, mode, level, onOpenMyList, onPickForMeal, baseTotals }: AddFoodFlowProps) {
  const [phase, setPhase] = useState<Phase>('search')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const [dbAmount, setDbAmount] = useState(100)

  useEffect(() => {
    if (!isOpen) return
    setPhase('search')
    setQuery('')
    setSelected(null)
  }, [isOpen])

  const catalog = useCatalog(isOpen)
  const recent = useRecentFoods(isOpen)
  const mine = useMyFoods(isOpen)
  const addSingle = useAddSingleFood()

  // Search my foods and the catalog (name, English name, aliases) — from 2 letters, like the app
  const q = query.trim().toLowerCase()
  const showResults = q.length >= 2
  const results = useMemo(() => {
    if (!showResults) return []
    const hit = (f: Food) => f.keywords.includes(q)
    const starts = (f: Food) => (f.name.toLowerCase().startsWith(q) ? 0 : 1)
    const mineHits = (mine.data ?? []).filter(hit).sort((a, b) => starts(a) - starts(b))
    const mineCatalogIds = new Set(mineHits.filter((f) => f.source === 'catalog').map((f) => f.id))
    const catHits = (catalog.data ?? []).filter((f) => hit(f) && !mineCatalogIds.has(f.id)).sort((a, b) => starts(a) - starts(b))
    return [...mineHits, ...catHits].slice(0, 40)
  }, [q, showResults, mine.data, catalog.data])

  const pickFromDb = (food: Food) => {
    setSelected(food)
    setDbAmount(baseAmountFor(food))
    setPhase('db-amount')
  }

  const confirmDb = () => {
    if (!selected) return
    if (mode === 'meal-builder') {
      onPickForMeal?.(selected, dbAmount)
      return
    }
    if (addSingle.isPending) return
    addSingle.mutate({ item: { key: crypto.randomUUID(), food: selected, amount: dbAmount }, date: todayLocal(), createdAt: nowIso() }, { onSuccess: onClose })
  }

  const title = mode === 'meal-builder' ? 'הוספת מאכל לארוחה' : 'הוספת מאכל'

  let footer: React.ReactNode
  if (phase === 'db-amount') {
    footer = (
      <ActionButton onClick={confirmDb} disabled={addSingle.isPending} Icon={PlusCircle}>
        {addSingle.isPending ? 'מוסיף…' : mode === 'meal-builder' ? 'הוסף לארוחה' : 'הוסף ליומן'}
      </ActionButton>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} level={level} footer={footer}>
      {phase !== 'search' && <BackLink onClick={() => setPhase('search')} />}

      {phase === 'search' && (
        <div className="flex flex-col gap-4">
          <FlowTitle eyebrow={mode === 'meal-builder' ? 'Meal Builder' : 'Food Search'} title={mode === 'meal-builder' ? 'הוסף מאכל' : 'חפש מאכל'} />

          <div className="flex flex-col gap-3 rounded-3xl border border-white/[0.05] bg-white/[0.03] p-4">
            <SearchField value={query} onChange={setQuery} placeholder="חפש מאכל..." label="חיפוש מאכל" highlight />
            <p className="text-center font-body text-xs text-muted">הקלד שם המאכל — נמצא לך את הנתונים</p>
          </div>

          {onOpenMyList && (
            <ActionButton onClick={onOpenMyList} variant="outline" Icon={Bookmark}>המאכלים והארוחות שלי</ActionButton>
          )}

          <p className="flex items-center justify-center gap-1.5 px-2 text-center font-body text-xs text-muted">
            <Info size={14} strokeWidth={2} className="flex-shrink-0" aria-hidden />
            הערכים הם הערכה כללית. במקרה של ספק, יש להסתמך על התווית שעל האריזה.
          </p>

          {showResults ? (
            <>
              {results.length > 0 && <ResultRows foods={results} onPick={pickFromDb} />}
              <button type="button" onClick={() => setPhase('custom-details')}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-3xl border border-accent-line bg-accent-soft px-6 py-3 font-body text-base text-accent ${focusRing}`}>
                <PlusCircle size={20} strokeWidth={2} aria-hidden />
                הוסף &quot;{query.trim()}&quot; כמאכל מותאם אישית
              </button>
              {results.length === 0 && !(mine.isLoading || catalog.isLoading) && (
                <div className="flex flex-col items-center gap-1 rounded-3xl border border-white/[0.05] bg-white/[0.03] p-5">
                  <p className="font-body text-base text-muted">לא נמצאו תוצאות</p>
                  <p className="font-body text-xs text-muted">עבור &quot;{query.trim()}&quot;</p>
                </div>
              )}
            </>
          ) : (
            <>
              <RecentStrip foods={recent.data} loading={recent.isLoading} onPick={pickFromDb} />
              <CategoryGroups foods={catalog.data} loading={catalog.isLoading} onPick={pickFromDb} />
            </>
          )}
        </div>
      )}

      {phase === 'db-amount' && selected && (
        <div className="flex flex-col">
          <FlowTitle eyebrow="Food Detail" title={selected.name} />
          <FoodAmountPanel food={selected} amount={dbAmount} onChange={setDbAmount} baseTotals={baseTotals} />
        </div>
      )}

      {phase === 'custom-details' && (
        <CustomFoodDetails
          initialName={query.trim()}
          mode={mode}
          baseTotals={baseTotals}
          onDone={onClose}
          onPickForMeal={onPickForMeal}
        />
      )}
    </Modal>
  )
}

const SAVE_OPTIONS = [
  { key: 'save', label: 'שמור', Icon: Bookmark },
  { key: 'journal', label: 'יומן', Icon: Calendar },
]

/** The app's "מאכל אישי" step: name, g/ml, values per 100 with steppers, how much was eaten, optional typical unit */
function CustomFoodDetails({ initialName, mode, baseTotals, onDone, onPickForMeal }: {
  initialName: string
  mode: 'standalone' | 'meal-builder'
  baseTotals?: Macros
  onDone: () => void
  onPickForMeal?: (food: Food, amount: number) => void
}) {
  const { goals, consumed } = useDayProgress()
  const createFood = useCreateFood()
  const addSingle = useAddSingleFood()

  const [name, setName] = useState(initialName)
  const [amountUnit, setAmountUnit] = useState<'g' | 'ml'>('g')
  const [values, setValues] = useState<Macros>({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [consumedAmount, setConsumedAmount] = useState(100)
  const [hasTypicalUnit, setHasTypicalUnit] = useState(false)
  const [unitWeight, setUnitWeight] = useState(100)
  const [unitName, setUnitName] = useState('')
  const [unitNamePlural, setUnitNamePlural] = useState('')
  const [unitMode, setUnitMode] = useState<UnitMode>(DEFAULT_UNIT_MODE)
  const [targets, setTargets] = useState<SaveTarget[]>(['save', 'journal'])
  const [tried, setTried] = useState(false)

  const typicalUnit = hasTypicalUnit ? typicalUnitOf({ measurement: 'grams', unitWeightG: unitWeight, unitName: unitName.trim() || name.trim(), unitNamePlural }) : null
  const valid = values.calories > 0 && name.trim().length > 0
  const pending = createFood.isPending || addSingle.isPending
  const ul = unitLabel(amountUnit)

  const ratio = consumedAmount / 100
  const totals: Macros = { calories: Math.round(values.calories * ratio), protein: values.protein * ratio, carbs: values.carbs * ratio, fat: values.fat * ratio }

  const changeConsumed = (delta: number) => setConsumedAmount((v) => Math.min(LIMITS.maxGrams, Math.max(1, Math.round((v + delta) * 10) / 10)))
  const stepper = resolveUnitStepper({
    typicalUnit,
    mode: unitMode,
    amount: consumedAmount,
    gramsStepper: { value: consumedAmount, unit: ul, onIncrease: () => changeConsumed(10), onDecrease: () => changeConsumed(-10) },
    addDelta: changeConsumed,
  })

  const input = () => ({
    name,
    measurement: 'grams' as const,
    amountUnit,
    values,
    unitWeightG: typicalUnit?.weight ?? null,
    unitName: typicalUnit?.name ?? null,
    unitNamePlural: typicalUnit?.plural ?? null,
    // The amount becomes the food's regular portion — unless it is counted by units
    defaultAmount: typicalUnit ? null : consumedAmount,
  })

  /** A food that is only logged, never saved (no food_items row) */
  const tempFood = (): Food => ({
    id: '',
    source: 'catalog',
    name: name.trim(),
    measurement: 'grams',
    amountUnit,
    per100: values,
    perUnit: null,
    unitWeightG: typicalUnit?.weight ?? null,
    unitName: typicalUnit?.name ?? null,
    unitNamePlural: typicalUnit?.plural ?? null,
    defaultAmount: null,
    category: null,
    keywords: '',
    createdAt: null,
  })

  const submit = () => {
    setTried(true)
    if (!valid || pending) return
    if (mode === 'meal-builder') {
      createFood.mutate(input(), { onSuccess: (food) => onPickForMeal?.(food as Food, consumedAmount) })
      return
    }
    const toJournal = targets.includes('journal')
    const toSave = targets.includes('save')
    const log = (food: Food) =>
      addSingle.mutate({ item: { key: crypto.randomUUID(), food, amount: consumedAmount }, date: todayLocal(), createdAt: nowIso() }, { onSuccess: onDone })
    if (!toSave) {
      log(tempFood())
      return
    }
    createFood.mutate(input(), { onSuccess: (food) => (toJournal ? log(food as Food) : onDone()) })
  }

  return (
    <div className="flex flex-col gap-4">
      <FlowTitle eyebrow="Custom Food" title="מאכל אישי" />

      <div className="flex flex-col gap-2">
        <label htmlFor="cf-name" className="px-1 font-body text-xs font-semibold uppercase tracking-widest text-muted">שם המאכל</label>
        <input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: שייק חלבון" autoComplete="off"
          aria-invalid={(tried && !name.trim()) || undefined}
          className="min-h-[52px] rounded-3xl border border-white/[0.08] bg-white/[0.03] px-5 font-body text-base text-heading outline-none placeholder:text-subtle focus:border-accent-line aria-[invalid=true]:border-danger" />
      </div>

      <div className="flex flex-col gap-2">
        <div role="radiogroup" aria-label="יחידת מדידה" className="flex rounded-full border border-white/[0.08] bg-white/[0.05] p-1">
          {([['g', 'גרמים', 'מדידה בגרמים'], ['ml', 'מ״ל', 'מדידה במיליליטר, למשקאות']] as const).map(([k, l, a]) => (
            <button key={k} type="button" role="radio" aria-checked={amountUnit === k} aria-label={a} onClick={() => setAmountUnit(k)}
              className={`flex min-h-11 flex-1 items-center justify-center rounded-full border font-body text-sm font-bold transition-colors duration-150 ${focusRing}
                ${amountUnit === k ? 'border-accent/45 bg-accent/[0.18] text-accent' : 'border-transparent text-muted'}`}>
              {l}
            </button>
          ))}
        </div>
        <p className="text-center font-body text-xs text-muted">{`הערכים מחושבים לכל 100 ${ul}`}</p>
      </div>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] px-4 py-2">
        <h4 className="mt-2 font-body text-xs font-semibold uppercase tracking-widest text-muted">{`ערכים ל-100 ${ul}`}</h4>
        <MacroValuesEditor values={values} onChange={(patch) => setValues((v) => ({ ...v, ...patch }))} caloriesError={tried && values.calories <= 0} markCarbsFatOptional />
      </section>

      {typicalUnit && (
        <div className="flex justify-center">
          <TypicalUnitToggle unit={typicalUnit} amountUnit={amountUnit} mode={unitMode} onChangeMode={setUnitMode} />
        </div>
      )}
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="font-body text-base font-semibold text-heading">
          {mode === 'meal-builder' ? 'כמות מנה בארוחה' : amountUnit === 'ml' ? 'כמה שתית' : 'כמה אכלת'}
        </span>
        <QuantityStepper {...stepper} name="כמות" />
      </div>
      {!typicalUnit && (mode === 'meal-builder' || targets.includes('save')) && (
        <p className="-mt-2 px-1 font-body text-xs text-muted">הכמות תישמר כמנה הרגילה של המאכל</p>
      )}

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
          <span className="font-body text-sm text-text-col">יחידה טיפוסית (למשל ביצה, פרוסה, חטיף)</span>
          <input type="checkbox" checked={hasTypicalUnit} onChange={(e) => setHasTypicalUnit(e.target.checked)}
            className="h-5 w-5 flex-shrink-0 cursor-pointer accent-accent" />
        </label>
        {hasTypicalUnit && (
          <div className="flex flex-col gap-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-muted">משקל יחידה אחת</span>
              <QuantityStepper size="sm" value={unitWeight} unit={ul} name="משקל יחידה"
                onIncrease={() => setUnitWeight((v) => Math.min(LIMITS.maxUnitWeight, Math.round((v + 5) * 10) / 10))}
                onDecrease={() => setUnitWeight((v) => Math.max(1, Math.round((v - 5) * 10) / 10))} />
            </div>
            <input value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder={`שם יחידה אחת (למשל: ${name.trim() || 'ביצה'})`} aria-label="שם יחידה אחת"
              className="min-h-12 rounded-3xl border border-white/[0.08] bg-white/[0.03] px-5 font-body text-base text-heading outline-none placeholder:text-subtle focus:border-accent-line" />
            <input value={unitNamePlural} onChange={(e) => setUnitNamePlural(e.target.value)} placeholder="שם ברבים (למשל: ביצים)" aria-label="שם היחידה ברבים"
              className="min-h-12 rounded-3xl border border-white/[0.08] bg-white/[0.03] px-5 font-body text-base text-heading outline-none placeholder:text-subtle focus:border-accent-line" />
          </div>
        )}
      </section>

      <NutritionSummaryCard totals={totals} goals={goals} consumed={consumed} baseTotals={mode === 'meal-builder' ? baseTotals : undefined} />

      {tried && !valid && <p className="font-body text-sm text-danger">צריך שם וקלוריות כדי לשמור.</p>}

      {mode === 'meal-builder' ? (
        <ActionButton onClick={submit} disabled={pending} Icon={PlusCircle}>{pending ? 'שומר…' : 'שמור והוסף לארוחה'}</ActionButton>
      ) : (
        <SegmentedActionBar
          options={SAVE_OPTIONS}
          selected={targets}
          onToggle={(k) => setTargets((p) => (p.includes(k as SaveTarget) ? p.filter((x) => x !== k) : [...p, k as SaveTarget]))}
          actionLabel="הוסף"
          onAction={submit}
          disabled={pending}
          loading={pending}
          groupLabel="לאן להוסיף"
          infoMessage={'יומן בלבד: נרשם להיום ולא נשמר לשימוש חוזר.\nשמור בלבד: נשמר לשימוש חוזר ולא נרשם להיום.\nשניהם: נשמר וגם נרשם להיום.'}
        />
      )}
    </div>
  )
}
