import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookmarkPlus, Clock, Pencil, Plus, Search, Star, Trash2, X } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { MealIcon } from '../../shared/icons/MealIcon'
import { useGoals } from '../../lib/useGoals'
import { todayLocal } from '../../lib/date'
import { DayFillBar } from '../today/nutritionVisuals'
import { AmountPicker } from './AmountPicker'
import { NewFoodForm } from './NewFoodForm'
import { amountLabel, defaultAmountFor, nutrientsFor, sumMacros } from './foodMath'
import {
  useAddMealEntries, useCatalog, useCreateFood, useCreateSavedMeal, useMyFoods, useRecentFoods, useSavedMeals, useSaveCatalogFood,
} from './hooks'
import type { CartItem, Food, SavedMeal } from './types'

export const MEAL_TYPES = ['ארוחת בוקר', 'ארוחת צהריים', 'ארוחת ערב', 'חטיף', 'נשנוש', 'שייק', 'פוסט וורקאות', 'פירות', 'ירקות', 'אחר'] as const
const SHORT: Record<string, string> = { 'ארוחת בוקר': 'בוקר', 'ארוחת צהריים': 'צהריים', 'ארוחת ערב': 'ערב', 'פוסט וורקאות': 'אחרי אימון' }

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')
const nowHHMM = () => new Date().toTimeString().slice(0, 5)

type Tab = 'catalog' | 'recent' | 'mine' | 'meals'

/** Catalog categories (foods.nutrition_category), in the app's order and wording */
const CATEGORIES: { id: string; label: string }[] = [
  { id: 'meat', label: 'עוף ובשר' }, { id: 'eggs', label: 'ביצים' }, { id: 'fish', label: 'דגים' }, { id: 'dairy', label: 'מוצרי חלב' },
  { id: 'carbs', label: 'פחמימה' }, { id: 'vegetables', label: 'ירקות' }, { id: 'fruits', label: 'פירות' }, { id: 'fats', label: 'שומן' },
  { id: 'beverages', label: 'שתייה' }, { id: 'sweets', label: 'מתוק' }, { id: 'snacks', label: 'חטיפים' }, { id: 'proteins', label: 'תוספי חלבון' },
  { id: 'sauces', label: 'רטבים' },
]
type View = { kind: 'browse' } | { kind: 'pick'; food: Food; amount: number; editKey?: string } | { kind: 'new' } | { kind: 'save-meal' }

interface AddFoodSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Meal type preselected for a new meal */
  presetMealName?: string
  /** Add more foods to an existing meal instead of creating one */
  appendTo?: { groupId: string; groupName: string; date: string; calories: number; protein: number }
  /** Today's totals so far (for the "what's left" bar) */
  dayTotals: { calories: number; protein: number }
}

/** Log food the way the BodyBuddy app does: catalog, my foods, saved meals, recents — then amounts. */
export function AddFoodSheet({ isOpen, onClose, presetMealName, appendTo, dayTotals }: AddFoodSheetProps) {
  const [mealName, setMealName] = useState<string>(presetMealName ?? MEAL_TYPES[0])
  const [time, setTime] = useState(nowHHMM)
  const [cart, setCart] = useState<CartItem[]>([])
  const [tab, setTab] = useState<Tab>('catalog')
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>({ kind: 'browse' })
  const [mealTitle, setMealTitle] = useState('')

  // Reset only when the sheet opens for a different meal (appendTo is a fresh object every render)
  const appendGroupId = appendTo?.groupId
  const appendGroupName = appendTo?.groupName
  useEffect(() => {
    if (!isOpen) return
    setMealName(appendGroupName ?? presetMealName ?? MEAL_TYPES[0])
    setTime(nowHHMM())
    setCart([])
    setQuery('')
    setView({ kind: 'browse' })
  }, [isOpen, presetMealName, appendGroupId, appendGroupName])

  const catalog = useCatalog(isOpen)
  const recent = useRecentFoods(isOpen)
  const mine = useMyFoods(isOpen)
  const meals = useSavedMeals(isOpen)
  const addEntries = useAddMealEntries()
  const createFood = useCreateFood()
  const saveCatalog = useSaveCatalogFood()
  const saveMeal = useCreateSavedMeal()
  const { goalCalories, goalProtein } = useGoals()

  // Instant local search: my foods first, then the catalog (name, English name and aliases)
  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!q) return []
    const hit = (f: Food) => f.keywords.includes(q)
    const starts = (f: Food) => (f.name.toLowerCase().startsWith(q) ? 0 : 1)
    const mineHits = (mine.data ?? []).filter(hit).sort((a, b) => starts(a) - starts(b))
    const mineCatalogIds = new Set(mineHits.filter((f) => f.source === 'catalog').map((f) => f.id))
    const catHits = (catalog.data ?? []).filter((f) => hit(f) && !mineCatalogIds.has(f.id)).sort((a, b) => starts(a) - starts(b))
    return [...mineHits, ...catHits].slice(0, 40)
  }, [q, mine.data, catalog.data])
  const catalogShown = useMemo(
    () => (catalog.data ?? []).filter((f) => category === 'all' || f.category === category),
    [catalog.data, category],
  )

  const myIds = useMemo(() => new Set((mine.data ?? []).map((f) => `${f.source}:${f.id}`)), [mine.data])
  const cartTotals = useMemo(() => sumMacros(cart.map((c) => nutrientsFor(c.food, c.amount))), [cart])

  const openPick = (food: Food) => setView({ kind: 'pick', food, amount: defaultAmountFor(food) })
  const commitPick = () => {
    if (view.kind !== 'pick' || view.amount <= 0) return
    const { food, amount, editKey } = view
    setCart((c) => (editKey ? c.map((it) => (it.key === editKey ? { ...it, amount } : it)) : [...c, { key: crypto.randomUUID(), food, amount }]))
    setQuery('')
    setView({ kind: 'browse' })
  }
  const addSavedMeal = (m: SavedMeal) => {
    setCart((c) => [...c, ...m.items.map((i) => ({ key: crypto.randomUUID(), food: i.food, amount: i.amount }))])
    if (!appendTo && MEAL_TYPES.includes(m.name as (typeof MEAL_TYPES)[number])) setMealName(m.name)
  }

  const date = appendTo?.date ?? todayLocal()
  const isToday = date === todayLocal()
  const submit = () => {
    if (!cart.length || addEntries.isPending) return
    const createdAt = new Date(`${date}T${time}:00`).toISOString()
    addEntries.mutate({ items: cart, date, groupName: mealName, createdAt, groupId: appendTo?.groupId }, { onSuccess: onClose })
  }

  // ── header ──
  const timeChip = !appendTo && (
    <label className="relative flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border-col bg-bg px-3 font-body text-sm tabular-nums text-text-col hover:border-subtle focus-within:border-accent-line">
      <Clock size={14} strokeWidth={2} className="text-muted" aria-hidden />
      {time}
      <span className="sr-only">שעת הארוחה</span>
      <input type="time" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0 [color-scheme:dark]" />
    </label>
  )

  // ── footer per view ──
  let footer: React.ReactNode
  if (view.kind === 'pick') {
    footer = (
      <button type="button" onClick={commitPick} disabled={view.amount <= 0}
        className={`flex h-[52px] w-full items-center justify-center rounded-2xl bg-accent font-body text-base font-semibold text-bg transition-transform duration-150 active:scale-[0.98] disabled:opacity-50 ${focusRing}`}>
        {view.editKey ? 'עדכן כמות' : `הוסף · ${fmt(nutrientsFor(view.food, view.amount).calories)} קל'`}
      </button>
    )
  } else if (view.kind === 'new') {
    footer = (
      <button type="submit" form="new-food-form" disabled={createFood.isPending}
        className={`flex h-[52px] w-full items-center justify-center rounded-2xl bg-accent font-body text-base font-semibold text-bg disabled:opacity-60 ${focusRing}`}>
        {createFood.isPending ? 'שומר…' : 'שמור והמשך לכמות'}
      </button>
    )
  } else if (view.kind === 'save-meal') {
    footer = (
      <button type="button" disabled={!mealTitle.trim() || saveMeal.isPending}
        onClick={() => saveMeal.mutate({ name: mealTitle, items: cart }, { onSuccess: () => setView({ kind: 'browse' }) })}
        className={`flex h-[52px] w-full items-center justify-center rounded-2xl bg-accent font-body text-base font-semibold text-bg disabled:opacity-50 ${focusRing}`}>
        {saveMeal.isPending ? 'שומר…' : 'שמור ארוחה'}
      </button>
    )
  } else {
    const before = dayTotals.calories
    footer = (
      <div className="flex flex-col gap-3">
        {isToday && cart.length > 0 && (
          <div className="flex flex-col gap-1.5" aria-live="polite">
            <DayFillBar before={before} meal={cartTotals.calories} goal={goalCalories} />
            <p className="flex justify-between font-body text-sm tabular-nums text-muted">
              <span>
                {goalCalories - before - cartTotals.calories >= 0
                  ? <>יישארו <span className="font-semibold text-accent">{fmt(goalCalories - before - cartTotals.calories)}</span> קל'</>
                  : <>חריגה של <span className="font-semibold text-danger">{fmt(before + cartTotals.calories - goalCalories)}</span> קל'</>}
              </span>
              <span>חלבון <span className="font-medium text-text-col">{fmt(dayTotals.protein + cartTotals.protein)}</span>/{goalProtein}g</span>
            </p>
          </div>
        )}
        <button type="button" onClick={submit} disabled={!cart.length || addEntries.isPending}
          className={`flex h-[52px] w-full items-center justify-center rounded-2xl font-body text-base font-semibold transition-[background-color,transform] duration-200 active:scale-[0.98] ${focusRing}
            ${cart.length ? 'bg-accent text-bg shadow-[0_8px_24px_-10px_rgba(150,200,40,0.7)]' : 'bg-surface2 text-muted'}`}>
          {addEntries.isPending ? 'שומר…' : cart.length ? `${appendTo ? 'הוסף לארוחה' : 'רשום ארוחה'} · ${fmt(cartTotals.calories)} קל'` : 'בחר מאכלים'}
        </button>
      </div>
    )
  }

  const title = view.kind === 'pick' ? view.food.name : view.kind === 'new' ? 'מאכל חדש' : view.kind === 'save-meal' ? 'שמירה כארוחה קבועה' : appendTo ? `הוספה ל${appendTo.groupName}` : 'ארוחה חדשה'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} headerAction={view.kind === 'browse' ? timeChip : undefined} footer={footer}>
      {view.kind !== 'browse' && (
        <button type="button" onClick={() => setView({ kind: 'browse' })}
          className={`-ms-1 mb-3 flex h-9 items-center gap-1 self-start rounded-lg px-1 font-body text-sm text-muted hover:text-text-col ${focusRing}`}>
          <ArrowRight size={16} strokeWidth={2} aria-hidden />
          חזרה
        </button>
      )}

      {view.kind === 'pick' && (
        <div className="flex flex-col gap-4">
          <FoodMeta food={view.food} />
          <AmountPicker food={view.food} amount={view.amount} onChange={(amount) => setView({ ...view, amount })} />
          {view.food.source === 'catalog' && !myIds.has(`catalog:${view.food.id}`) && (
            <button type="button" onClick={() => saveCatalog.mutate(view.food.id)} disabled={saveCatalog.isPending}
              className={`flex h-10 items-center justify-center gap-1.5 self-center rounded-full border border-border-col px-4 font-body text-sm text-text-col hover:border-subtle disabled:opacity-50 ${focusRing}`}>
              <Star size={15} strokeWidth={2} aria-hidden />
              שמור במאכלים שלי
            </button>
          )}
        </div>
      )}

      {view.kind === 'new' && (
        <NewFoodForm
          initialName={query}
          pending={createFood.isPending}
          onSubmit={(input) => createFood.mutate(input, { onSuccess: (food) => openPick(food as Food) })}
        />
      )}

      {view.kind === 'save-meal' && (
        <div className="flex flex-col gap-3">
          <label htmlFor="meal-title" className="font-body text-sm text-muted">שם הארוחה (תופיע ב"ארוחות שמורות" גם באפליקציה)</label>
          <input id="meal-title" value={mealTitle} onChange={(e) => setMealTitle(e.target.value)} placeholder="למשל: אורז ועוף"
            className="h-12 rounded-xl border border-border-col bg-bg px-3 font-body text-base text-heading outline-none focus:border-accent-line" />
          <p className="font-body text-sm text-muted">{cart.map((c) => `${c.food.name} ${amountLabel(c.food, c.amount)}`).join(' · ')}</p>
        </div>
      )}

      {view.kind === 'browse' && (
        <div className="flex flex-col gap-5">
          {!appendTo && (
            <div role="radiogroup" aria-label="סוג ארוחה" className="hide-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5">
              {MEAL_TYPES.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={mealName === t} onClick={() => setMealName(t)}
                  className={`flex h-10 flex-shrink-0 items-center gap-1.5 rounded-full border px-3 font-body text-sm transition-colors duration-150 ${focusRing}
                    ${mealName === t ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-border-col text-text-col hover:border-subtle'}`}>
                  <MealIcon mealName={t} size={14} color="currentColor" />
                  {SHORT[t] ?? t}
                </button>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <section aria-label="בארוחה" className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <h3 className="font-body text-sm font-medium text-text-col">בארוחה · {cart.length}</h3>
                <button type="button" onClick={() => { setMealTitle(''); setView({ kind: 'save-meal' }) }}
                  className={`flex h-9 items-center gap-1 rounded-lg px-1 font-body text-sm text-muted hover:text-text-col ${focusRing}`}>
                  <BookmarkPlus size={15} strokeWidth={2} aria-hidden />
                  שמור כארוחה קבועה
                </button>
              </div>
              <ul className="flex flex-col divide-y divide-white/[0.06] rounded-2xl border border-border-col bg-bg">
                {cart.map((c) => {
                  const m = nutrientsFor(c.food, c.amount)
                  return (
                    <li key={c.key} className="flex items-center gap-2 py-2 pe-1.5 ps-3.5">
                      <button type="button" onClick={() => setView({ kind: 'pick', food: c.food, amount: c.amount, editKey: c.key })}
                        className={`flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-lg text-right ${focusRing}`} aria-label={`שינוי כמות ${c.food.name}`}>
                        <span className="w-full truncate font-body text-[15px] text-text-col">{c.food.name}</span>
                        <span className="font-body text-xs tabular-nums text-muted">
                          {amountLabel(c.food, c.amount)} · <span className="text-heading">{fmt(m.calories)}</span> קל' · <span className="text-macro-protein">{fmt(m.protein)}g</span>
                        </span>
                      </button>
                      <Pencil size={14} strokeWidth={2} className="flex-shrink-0 text-subtle" aria-hidden />
                      <button type="button" onClick={() => setCart((cc) => cc.filter((x) => x.key !== c.key))} aria-label={`הסר ${c.food.name}`}
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-muted hover:text-danger ${focusRing}`}>
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <div className="flex h-14 items-center gap-2.5 rounded-2xl border border-border-col bg-bg px-4 focus-within:border-accent-line">
            <Search size={18} strokeWidth={2} className="flex-shrink-0 text-muted" aria-hidden />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חפש מאכל במאגר או במאכלים שלי" aria-label="חיפוש מאכל"
              className="h-full min-w-0 flex-1 bg-transparent font-body text-base text-heading outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden" />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="נקה חיפוש" className={`-me-2 flex h-10 w-10 items-center justify-center rounded-xl text-muted ${focusRing}`}>
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          {q ? (
            <FoodList
              foods={results}
              loading={mine.isLoading || catalog.isLoading}
              empty="לא נמצא. אפשר ליצור מאכל חדש."
              onPick={openPick}
              myIds={myIds}
            />
          ) : (
            <>
              <div role="tablist" aria-label="מקור" className="grid grid-cols-4 gap-1 rounded-xl bg-bg p-1">
                {([['catalog', 'מאגר'], ['recent', 'אחרונים'], ['mine', 'שלי'], ['meals', 'ארוחות']] as const).map(([k, l]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                    className={`h-10 rounded-lg font-body text-sm transition-colors duration-150 ${focusRing} ${tab === k ? 'bg-surface2 font-medium text-heading' : 'text-muted hover:text-text-col'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {tab === 'catalog' && (
                <>
                  <div role="radiogroup" aria-label="קטגוריה" className="hide-scrollbar -mx-5 -mt-2 flex gap-1.5 overflow-x-auto px-5">
                    {[{ id: 'all', label: 'הכול' }, ...CATEGORIES].map((c) => (
                      <button key={c.id} type="button" role="radio" aria-checked={category === c.id} onClick={() => setCategory(c.id)}
                        className={`h-9 flex-shrink-0 rounded-full border px-3 font-body text-sm transition-colors duration-150 ${focusRing}
                          ${category === c.id ? 'border-accent bg-accent-soft text-accent' : 'border-border-col text-text-col hover:border-subtle'}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <FoodList foods={catalogShown} loading={catalog.isLoading} empty="אין מאכלים בקטגוריה הזו." onPick={openPick} myIds={myIds} />
                </>
              )}
              {tab === 'recent' && <FoodList foods={recent.data} loading={recent.isLoading} empty="עוד אין מאכלים אחרונים." onPick={openPick} myIds={myIds} />}
              {tab === 'mine' && <FoodList foods={mine.data} loading={mine.isLoading} empty="אין עדיין מאכלים שמורים." onPick={openPick} myIds={myIds} />}
              {tab === 'meals' && <MealList meals={meals.data} loading={meals.isLoading} onAdd={addSavedMeal} />}
            </>
          )}

          <button type="button" onClick={() => setView({ kind: 'new' })}
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-border-col font-body text-sm text-text-col hover:border-subtle ${focusRing}`}>
            <Plus size={16} strokeWidth={2} aria-hidden />
            מאכל חדש{query.trim() ? `: ${query.trim()}` : ''}
          </button>
        </div>
      )}
    </Modal>
  )
}

function FoodMeta({ food }: { food: Food }) {
  const v = food.measurement === 'units' ? food.perUnit : food.per100
  const per = food.measurement === 'units' ? `ל${food.unitName ?? 'יחידה'}` : `ל-100 ${food.amountUnit === 'ml' ? 'מ״ל' : 'גרם'}`
  return (
    <p className="font-body text-sm text-muted">
      <SourceTag source={food.source} />
      {v && <span className="ms-2 tabular-nums">{fmt(v.calories)} קל' {per} · חלבון {Math.round(v.protein * 10) / 10}g</span>}
    </p>
  )
}

function SourceTag({ source }: { source: Food['source'] }) {
  return (
    <span className={`rounded-full px-2 py-0.5 font-body text-xs ${source === 'personal' ? 'bg-accent-soft text-accent' : 'bg-surface2 text-muted'}`}>
      {source === 'personal' ? 'שלי' : 'מאגר'}
    </span>
  )
}

function FoodList({ foods, loading, empty, onPick, myIds }: { foods: Food[] | undefined; loading: boolean; empty: string; onPick: (f: Food) => void; myIds: Set<string> }) {
  if (loading) return <p className="py-6 text-center font-body text-sm text-muted" aria-busy="true">טוען…</p>
  if (!foods?.length) return <p className="py-6 text-center font-body text-sm text-muted">{empty}</p>
  return (
    <ul className="flex flex-col divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-border-col bg-bg">
      {foods.map((f) => {
        const v = f.measurement === 'units' ? f.perUnit : f.per100
        const saved = f.source === 'catalog' && myIds.has(`catalog:${f.id}`)
        return (
          <li key={`${f.source}:${f.id}`}>
            <button type="button" onClick={() => onPick(f)}
              className={`flex min-h-14 w-full items-center gap-3 px-3.5 py-2 text-right transition-colors duration-100 hover:bg-surface/60 active:bg-surface ${focusRing}`}>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-body text-[15px] text-text-col">{f.name}</span>
                <span className="font-body text-xs tabular-nums text-muted">
                  {v ? `${fmt(v.calories)} קל' ${f.measurement === 'units' ? `ל${f.unitName ?? 'יחידה'}` : 'ל-100'}` : ''}
                  {v && v.protein > 0 ? ` · ${Math.round(v.protein * 10) / 10}g חלבון` : ''}
                </span>
              </span>
              {saved ? <Star size={14} strokeWidth={2} className="flex-shrink-0 text-accent" aria-label="שמור במאכלים שלי" /> : <SourceTag source={f.source} />}
              <Plus size={18} strokeWidth={2} className="flex-shrink-0 text-muted" aria-hidden />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function MealList({ meals, loading, onAdd }: { meals: SavedMeal[] | undefined; loading: boolean; onAdd: (m: SavedMeal) => void }) {
  if (loading) return <p className="py-6 text-center font-body text-sm text-muted" aria-busy="true">טוען…</p>
  if (!meals?.length) return <p className="py-6 text-center font-body text-sm text-muted">אין ארוחות שמורות.</p>
  return (
    <ul className="flex flex-col divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-border-col bg-bg">
      {meals.map((m) => {
        const total = sumMacros(m.items.map((i) => nutrientsFor(i.food, i.amount)))
        return (
          <li key={m.id}>
            <button type="button" onClick={() => onAdd(m)} aria-label={`הוסף את ${m.name} לארוחה`}
              className={`flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-right transition-colors duration-100 hover:bg-surface/60 active:bg-surface ${focusRing}`}>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-body text-[15px] text-text-col">{m.name}</span>
                <span className="line-clamp-2 font-body text-xs text-muted">{m.items.map((i) => `${i.food.name} ${amountLabel(i.food, i.amount)}`).join(' · ')}</span>
              </span>
              <span className="flex-shrink-0 font-body text-xs tabular-nums text-muted"><span className="text-heading">{fmt(total.calories)}</span> קל'</span>
              <Plus size={18} strokeWidth={2} className="flex-shrink-0 text-muted" aria-hidden />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
