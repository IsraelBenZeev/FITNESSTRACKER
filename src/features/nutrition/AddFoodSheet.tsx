import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bookmark, BookmarkPlus, Clock, Info, Plus, PlusCircle, Search, Star, X } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { MealIcon } from '../../shared/icons/MealIcon'
import { useGoals } from '../../lib/useGoals'
import { todayLocal } from '../../lib/date'
import { DayFillBar } from '../today/nutritionVisuals'
import { AmountPicker } from './AmountPicker'
import { NewFoodForm } from './NewFoodForm'
import { CartRows } from './CartRows'
import { CategoryGroups, FoodCard, RecentStrip, ResultRows } from './BrowseFoods'
import { amountLabel, defaultAmountFor, nutrientsFor, sumMacros } from './foodMath'
import {
  useAddMealEntries, useAddSingleFood, useCatalog, useCreateFood, useCreateSavedMeal, useMyFoods, useRecentFoods, useSavedMeals, useSaveCatalogFood,
} from './hooks'
import type { CartItem, Food, SavedMeal } from './types'

export const MEAL_TYPES = ['ארוחת בוקר', 'ארוחת צהריים', 'ארוחת ערב', 'חטיף', 'נשנוש', 'שייק', 'פוסט וורקאות', 'פירות', 'ירקות', 'אחר'] as const
const SHORT: Record<string, string> = { 'ארוחת בוקר': 'בוקר', 'ארוחת צהריים': 'צהריים', 'ארוחת ערב': 'ערב', 'פוסט וורקאות': 'אחרי אימון' }

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')
const nowHHMM = () => new Date().toTimeString().slice(0, 5)

/** Browse panel: the app's search screen (recents + catalog by category) or "my foods & meals" */
type Panel = 'search' | 'mine'
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
  /** Which + option opened the sheet: 'food' (search a food) or 'meal' (saved meals first), like the app */
  mode?: 'food' | 'meal'
}

/** Log food the way the BodyBuddy app does: catalog, my foods, saved meals, recents — then amounts. */
export function AddFoodSheet({ isOpen, onClose, presetMealName, appendTo, dayTotals, mode = 'food' }: AddFoodSheetProps) {
  const [mealName, setMealName] = useState<string>(presetMealName ?? MEAL_TYPES[0])
  const [time, setTime] = useState(nowHHMM)
  const [cart, setCart] = useState<CartItem[]>([])
  const [panel, setPanel] = useState<Panel>('search')
  const [mineTab, setMineTab] = useState<'foods' | 'meals'>('foods')
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
    setPanel(mode === 'meal' ? 'mine' : 'search')
    setMineTab(mode === 'meal' ? 'meals' : 'foods')
  }, [isOpen, presetMealName, appendGroupId, appendGroupName, mode])

  const catalog = useCatalog(isOpen)
  const recent = useRecentFoods(isOpen)
  const mine = useMyFoods(isOpen)
  const meals = useSavedMeals(isOpen)
  const addEntries = useAddMealEntries()
  const addSingle = useAddSingleFood()
  // "Add food" like the app: one food straight to the log, no meal group. "Add meal" (and appending) uses the cart.
  const singleMode = mode === 'food' && !appendTo
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

  const myIds = useMemo(() => new Set((mine.data ?? []).map((f) => `${f.source}:${f.id}`)), [mine.data])
  const cartTotals = useMemo(() => sumMacros(cart.map((c) => nutrientsFor(c.food, c.amount))), [cart])

  const openPick = (food: Food) => setView({ kind: 'pick', food, amount: defaultAmountFor(food) })
  const commitPick = () => {
    if (view.kind !== 'pick' || view.amount <= 0) return
    const { food, amount, editKey } = view
    if (singleMode && !editKey) {
      if (addSingle.isPending) return
      const createdAt = new Date(`${date}T${time}:00`).toISOString()
      addSingle.mutate({ item: { key: crypto.randomUUID(), food, amount }, date, createdAt }, { onSuccess: onClose })
      return
    }
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
      <button type="button" onClick={commitPick} disabled={view.amount <= 0 || addSingle.isPending}
        className={`flex h-[52px] w-full items-center justify-center rounded-2xl border border-accent bg-transparent font-body text-base font-semibold text-accent hover:bg-accent-soft active:bg-accent-soft transition-transform duration-150 active:scale-[0.98] disabled:opacity-50 ${focusRing}`}>
        {view.editKey ? 'עדכן כמות' : singleMode ? (addSingle.isPending ? 'מוסיף…' : `הוסף ליומן · ${fmt(nutrientsFor(view.food, view.amount).calories)} קל'`) : `הוסף לארוחה · ${fmt(nutrientsFor(view.food, view.amount).calories)} קל'`}
      </button>
    )
  } else if (view.kind === 'new') {
    footer = (
      <button type="submit" form="new-food-form" disabled={createFood.isPending}
        className={`flex h-[52px] w-full items-center justify-center rounded-2xl border border-accent bg-transparent font-body text-base font-semibold text-accent hover:bg-accent-soft active:bg-accent-soft disabled:opacity-60 ${focusRing}`}>
        {createFood.isPending ? 'שומר…' : 'שמור והמשך לכמות'}
      </button>
    )
  } else if (view.kind === 'save-meal') {
    footer = (
      <button type="button" disabled={!mealTitle.trim() || saveMeal.isPending}
        onClick={() => saveMeal.mutate({ name: mealTitle, items: cart }, { onSuccess: () => setView({ kind: 'browse' }) })}
        className={`flex h-[52px] w-full items-center justify-center rounded-2xl border border-accent bg-transparent font-body text-base font-semibold text-accent hover:bg-accent-soft active:bg-accent-soft disabled:opacity-50 ${focusRing}`}>
        {saveMeal.isPending ? 'שומר…' : 'שמור ארוחה'}
      </button>
    )
  } else if (singleMode && !cart.length) {
    footer = undefined // single food: the "add" button lives on the amount screen
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
            ${cart.length ? 'border border-accent text-accent hover:bg-accent-soft active:bg-accent-soft' : 'border border-border-col text-muted'}`}>
          {addEntries.isPending ? 'שומר…' : cart.length ? `${appendTo ? 'הוסף לארוחה' : 'רשום ארוחה'} · ${fmt(cartTotals.calories)} קל'` : 'בחר מאכלים'}
        </button>
      </div>
    )
  }

  const title = view.kind === 'pick' ? view.food.name : view.kind === 'new' ? 'מאכל חדש' : view.kind === 'save-meal' ? 'שמירה כארוחה קבועה' : appendTo ? `הוספה ל${appendTo.groupName}` : mode === 'meal' ? 'הוספת ארוחה' : 'הוספת מאכל'

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
          {!appendTo && (!singleMode || cart.length > 0) && (
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
              <div className="flex items-center justify-between">
                <h3 className="font-body text-base font-semibold text-heading">מרכיבי הארוחה</h3>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-body text-xs font-semibold text-accent">{cart.length} מרכיבים</span>
              </div>
              <CartRows
                items={cart}
                onChange={(key, amount) => setCart((cc) => cc.map((x) => (x.key === key ? { ...x, amount } : x)))}
                onRemove={(key) => setCart((cc) => cc.filter((x) => x.key !== key))}
              />
              <button type="button" onClick={() => { setMealTitle(''); setView({ kind: 'save-meal' }) }}
                className={`flex h-9 items-center gap-1 self-start rounded-lg px-1 font-body text-sm text-muted hover:text-text-col ${focusRing}`}>
                <BookmarkPlus size={15} strokeWidth={2} aria-hidden />
                שמור כארוחה קבועה
              </button>
            </section>
          )}

          {panel === 'search' ? (
            <>
              <div className="flex flex-col gap-3 rounded-3xl border border-white/[0.05] bg-white/[0.03] p-4">
                <div className={`flex h-14 items-center gap-2.5 rounded-2xl border bg-bg px-4 ${q ? 'border-accent-line' : 'border-border-col'}`}>
                  <Search size={18} strokeWidth={2} className="flex-shrink-0 text-muted" aria-hidden />
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חפש מאכל..." aria-label="חיפוש מאכל"
                    className="h-full min-w-0 flex-1 bg-transparent font-body text-base text-heading outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden" />
                  {query && (
                    <button type="button" onClick={() => setQuery('')} aria-label="נקה חיפוש" className={`-me-2 flex h-10 w-10 items-center justify-center rounded-xl text-muted ${focusRing}`}>
                      <X size={16} strokeWidth={2} />
                    </button>
                  )}
                </div>
                <p className="text-center font-body text-xs text-muted">הקלד שם מאכל — חיפוש במאגר ובמאכלים שלך</p>
              </div>

              <button type="button" onClick={() => setPanel('mine')}
                className={`flex h-11 items-center justify-center gap-2 rounded-full border border-accent-line font-body text-sm font-medium text-accent hover:bg-accent-soft ${focusRing}`}>
                <Bookmark size={16} strokeWidth={2} aria-hidden />
                המאכלים והארוחות שלי
              </button>

              <p className="flex items-center justify-center gap-1.5 px-2 text-center font-body text-xs text-muted">
                <Info size={14} strokeWidth={2} className="flex-shrink-0" aria-hidden />
                הערכים הם הערכה כללית. במקרה של ספק, יש להסתמך על התווית שעל האריזה.
              </p>

              {q ? (
                <>
                  {results.length > 0
                    ? <ResultRows foods={results} onPick={openPick} />
                    : !(mine.isLoading || catalog.isLoading) && (
                      <div className="flex flex-col items-center gap-1 rounded-3xl border border-white/[0.05] bg-white/[0.03] p-5">
                        <p className="font-body text-base text-muted">לא נמצאו תוצאות</p>
                        <p className="font-body text-xs text-muted">עבור &quot;{query.trim()}&quot;</p>
                      </div>
                    )}
                  <button type="button" onClick={() => setView({ kind: 'new' })}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-3xl border border-accent-line bg-accent-soft px-6 py-3 font-body text-base text-accent ${focusRing}`}>
                    <PlusCircle size={20} strokeWidth={2} aria-hidden />
                    הוסף &quot;{query.trim()}&quot; כמאכל מותאם אישית
                  </button>
                </>
              ) : (
                <>
                  <RecentStrip foods={recent.data} loading={recent.isLoading} onPick={openPick} />
                  <CategoryGroups foods={catalog.data} loading={catalog.isLoading} onPick={openPick} />
                </>
              )}
            </>
          ) : (
            <>
              <button type="button" onClick={() => setPanel('search')}
                className={`-ms-1 flex h-9 items-center gap-1 self-start rounded-lg px-1 font-body text-sm text-muted hover:text-text-col ${focusRing}`}>
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
                לחיפוש ולמאגר
              </button>
              <div role="tablist" aria-label="המאכלים והארוחות שלי" className="grid grid-cols-2 gap-1 rounded-xl bg-bg p-1">
                {([['foods', 'מאכלים'], ['meals', 'ארוחות']] as const).map(([k, l]) => (
                  <button key={k} type="button" role="tab" aria-selected={mineTab === k} onClick={() => setMineTab(k)}
                    className={`h-10 rounded-lg font-body text-sm transition-colors duration-150 ${focusRing} ${mineTab === k ? 'bg-surface2 font-medium text-heading' : 'text-muted hover:text-text-col'}`}>
                    {l}
                    {k === 'foods' && mine.data ? <span className="ms-1 tabular-nums text-muted">{mine.data.length}</span> : null}
                  </button>
                ))}
              </div>
              {mineTab === 'foods' ? (
                mine.isLoading ? <p className="py-6 text-center font-body text-sm text-muted" aria-busy="true">טוען…</p>
                  : mine.data?.length ? (
                    <ul className="flex flex-col gap-3">
                      {mine.data.map((f) => <li key={`${f.source}:${f.id}`}><FoodCard food={f} onPick={openPick} /></li>)}
                    </ul>
                  ) : <p className="py-6 text-center font-body text-sm text-muted">עדיין לא נוספו מאכלים.</p>
              ) : (
                <MealList meals={meals.data} loading={meals.isLoading} onAdd={addSavedMeal} />
              )}
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
