import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Plus, Trash2, UtensilsCrossed, Utensils } from 'lucide-react'
import { Modal, nextLevel, type SheetLevel } from '../../shared/components/Modal'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { todayLocal } from '../../lib/date'
import { CATEGORY_GROUPS, MacroPills } from './BrowseFoods'
import { FoodAmountPanel } from './FoodAmountPanel'
import { MealReviewSheet } from './MealReviewSheet'
import { mealTotals } from './MealBuilderSheet'
import { amountLabel, baseAmountFor, nutrientsFor } from './foodMath'
import { useAddSingleFood, useDeleteMyFood, useDeleteSavedMeal, useMyFoods, useSavedMeals } from './hooks'
import type { Food, SavedMeal } from './types'
import { ActionButton } from './ui/SegmentedActionBar'
import { BackLink, CountPill, EmptyState, FlowTitle, SearchField } from './ui/FlowParts'
import { fmt, focusRing } from './ui/styles'

export type MyListTab = 'foods' | 'meals'

interface MyListSheetProps {
  isOpen: boolean
  onClose: () => void
  initialTab: MyListTab
  level: SheetLevel
  /** After a food or meal was logged */
  onDone: () => void
  /** "הוסף מאכל חדש" — back to the food search, where a personal food is created */
  onAddNewFood: () => void
  /** "צור ארוחה חדשה" — the meal builder */
  onCreateMeal: () => void
}

/**
 * "המאכלים והארוחות שלי", like the app's ModalAddFoods: two tabs, newest first, each searchable.
 * No catalog here — it opens only from "add food" or from (+) when adding to a meal.
 */
export function MyListSheet({ isOpen, onClose, initialTab, level, onDone, onAddNewFood, onCreateMeal }: MyListSheetProps) {
  const [tab, setTab] = useState<MyListTab>(initialTab)
  const [foodQuery, setFoodQuery] = useState('')
  const [mealQuery, setMealQuery] = useState('')
  const [portion, setPortion] = useState<{ food: Food; amount: number } | null>(null)
  const [reviewMeal, setReviewMeal] = useState<SavedMeal | null>(null)
  const [foodToDelete, setFoodToDelete] = useState<Food | null>(null)
  const [mealToDelete, setMealToDelete] = useState<SavedMeal | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setTab(initialTab)
    setFoodQuery('')
    setMealQuery('')
    setPortion(null)
    setReviewMeal(null)
  }, [isOpen, initialTab])

  const mine = useMyFoods(isOpen)
  const meals = useSavedMeals(isOpen)
  const addSingle = useAddSingleFood()
  const deleteFood = useDeleteMyFood()
  const deleteMeal = useDeleteSavedMeal()

  // Both lists come newest first from the API; search keeps that order
  const foods = useMemo(() => {
    const q = foodQuery.trim().toLowerCase()
    const list = mine.data ?? []
    return q ? list.filter((f) => f.keywords.includes(q)) : list
  }, [mine.data, foodQuery])
  const mealList = useMemo(() => {
    const q = mealQuery.trim().toLowerCase()
    const list = meals.data ?? []
    return q ? list.filter((m) => m.name.toLowerCase().includes(q) || m.items.some((i) => i.food.keywords.includes(q))) : list
  }, [meals.data, mealQuery])

  // Saved meals that use the food about to be deleted
  const deleteNote = useMemo(() => {
    const base = 'מחיקת מאכל מהרשימה שלך לא תשפיע על הרשומות שכבר קיימות ביומן התזונה'
    if (!foodToDelete) return base
    const names = (meals.data ?? [])
      .filter((m) => m.items.some((i) => i.food.source === foodToDelete.source && i.food.id === foodToDelete.id))
      .map((m) => `"${m.name}"`)
    if (!names.length) return base
    const where = names.length === 1 ? `בארוחה ${names[0]}` : `בארוחות ${names.join(', ')}`
    return `שים לב: מאכל זה הוא מרכיב ${where} שלך. מחיקה כאן תסיר אותו מהארוחה.\n${base}`
  }, [foodToDelete, meals.data])

  const logPortion = () => {
    if (!portion || addSingle.isPending) return
    addSingle.mutate(
      { item: { key: crypto.randomUUID(), food: portion.food, amount: portion.amount }, date: todayLocal(), createdAt: new Date().toISOString() },
      { onSuccess: () => { onClose(); onDone() } },
    )
  }

  let footer: React.ReactNode
  if (portion) {
    footer = <ActionButton onClick={logPortion} disabled={addSingle.isPending} Icon={Plus}>{addSingle.isPending ? 'מעדכן…' : 'הוסף ליומן אכילה'}</ActionButton>
  } else if (tab === 'foods' && (mine.data?.length ?? 0) > 0) {
    footer = <ActionButton onClick={onAddNewFood} Icon={Plus}>הוסף מאכל חדש</ActionButton>
  } else if (tab === 'meals' && (meals.data?.length ?? 0) > 0) {
    footer = <ActionButton onClick={onCreateMeal} Icon={Plus}>צור ארוחה חדשה</ActionButton>
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={portion ? 'בחר כמות' : 'המאכלים והארוחות שלי'} level={level} footer={footer}>
        {portion ? (
          <div className="flex flex-col">
            <BackLink onClick={() => setPortion(null)} label="חזרה לרשימה" />
            <FlowTitle eyebrow="בחר כמות" title={portion.food.name} />
            <FoodAmountPanel food={portion.food} amount={portion.amount} onChange={(amount) => setPortion({ ...portion, amount })} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div role="tablist" aria-label="המאכלים והארוחות שלי" className="grid grid-cols-2 gap-1 rounded-full border border-white/[0.08] bg-white/[0.05] p-1">
              {([['foods', 'מאכלים'], ['meals', 'ארוחות']] as const).map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={`min-h-11 rounded-full border font-body text-sm font-bold transition-colors duration-150 ${focusRing}
                    ${tab === k ? 'border-accent/45 bg-accent/[0.18] text-accent' : 'border-transparent text-muted'}`}>
                  {l}
                </button>
              ))}
            </div>

            {tab === 'foods' ? (
              <>
                <ListHeader title="המאכלים שלי" count={mine.data?.length} subtitle="בחר מאכל כדי להוסיף ליום שלך" />
                {(mine.data?.length ?? 0) > 0 && <SearchField value={foodQuery} onChange={setFoodQuery} placeholder="חפש במאכלים שלי..." label="חיפוש במאכלים שלי" />}
                {mine.isLoading ? (
                  <p className="py-6 text-center font-body text-sm text-muted" aria-busy="true">טוען…</p>
                ) : !mine.data?.length ? (
                  <div className="flex flex-col gap-3">
                    <EmptyState title="עדיין לא נוספו מאכלים" text="הוסף מאכלים לרשימה שלך כדי לעקוב אחרי התזונה שלך" />
                    <ActionButton onClick={onAddNewFood} Icon={Plus}>צור מאכל חדש</ActionButton>
                  </div>
                ) : foods.length === 0 ? (
                  <EmptyState title="לא נמצא מאכל בשם הזה" />
                ) : (
                  <ul className="flex flex-col gap-4">
                    {foods.map((f) => (
                      <li key={`${f.source}:${f.id}`}>
                        <MyFoodCard food={f} onSelect={() => setPortion({ food: f, amount: baseAmountFor(f) })} onDelete={() => setFoodToDelete(f)} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <ListHeader title="הארוחות שלי" count={meals.data?.length} subtitle="בחר ארוחה מוכנה כדי להוסיף ליום שלך" />
                {(meals.data?.length ?? 0) > 0 && <SearchField value={mealQuery} onChange={setMealQuery} placeholder="חפש בארוחות שלי..." label="חיפוש בארוחות שלי" />}
                {meals.isLoading ? (
                  <p className="py-6 text-center font-body text-sm text-muted" aria-busy="true">טוען…</p>
                ) : !meals.data?.length ? (
                  <div className="flex flex-col gap-3">
                    <EmptyState title="עדיין לא נוספו ארוחות" text="צור ארוחה מוכנה עם מאכלים וכמויות כדי להוסיף אותה בקלות ביום שלך" />
                    <ActionButton onClick={onCreateMeal} Icon={Plus}>צור ארוחה חדשה</ActionButton>
                  </div>
                ) : mealList.length === 0 ? (
                  <EmptyState title="לא נמצאה ארוחה" />
                ) : (
                  <ul className="flex flex-col gap-4">
                    {mealList.map((m) => (
                      <li key={m.id}>
                        <MealCard meal={m} onSelect={() => setReviewMeal(m)} onDelete={() => setMealToDelete(m)} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      <MealReviewSheet meal={isOpen ? reviewMeal : null} level={nextLevel(level)} onClose={() => setReviewMeal(null)} onDone={() => { onClose(); onDone() }} />

      <ConfirmDialog
        visible={foodToDelete != null}
        title="מחיקת מאכל"
        message={`האם למחוק את "${foodToDelete?.name ?? ''}" מהרשימה?\n${deleteNote}`}
        isLoading={deleteFood.isPending}
        onCancel={() => setFoodToDelete(null)}
        onConfirm={() => {
          const f = foodToDelete
          setFoodToDelete(null)
          if (f) deleteFood.mutate(f)
        }}
      />
      <ConfirmDialog
        visible={mealToDelete != null}
        title="מחיקת ארוחה"
        message={`האם למחוק את "${mealToDelete?.name ?? ''}" מהרשימה?\nמחיקת ארוחה מהרשימה שלך לא תשפיע על הרשומות שכבר קיימות ביומן התזונה`}
        isLoading={deleteMeal.isPending}
        onCancel={() => setMealToDelete(null)}
        onConfirm={() => {
          const m = mealToDelete
          setMealToDelete(null)
          if (m) deleteMeal.mutate(m.id)
        }}
      />
    </>
  )
}

function ListHeader({ title, count, subtitle }: { title: string; count?: number; subtitle: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-1">
      <h3 className="flex items-center gap-2 font-body text-xl font-bold text-heading">
        {title}
        {count != null && count > 0 && <CountPill>{count}</CountPill>}
      </h3>
      <p className="font-body text-sm text-muted">{subtitle}</p>
    </div>
  )
}

/** "My foods" card like the app: category icon, name, per-100/unit, big kcal, delete, macro pills */
function MyFoodCard({ food, onSelect, onDelete }: { food: Food; onSelect: () => void; onDelete: () => void }) {
  const v = food.measurement === 'units' ? food.perUnit : food.per100
  const Icon = CATEGORY_GROUPS.find((g) => g.id === food.category)?.Icon ?? Utensils
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-surface2 p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onSelect} aria-label={`${food.name} - בחר מאכל`}
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-right transition-transform duration-100 active:scale-[0.98] ${focusRing}`}>
          <span aria-hidden className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-macro-fat/10 bg-macro-fat/10 text-macro-fat">
            <Icon size={22} strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start">
            <span className="w-full truncate font-body text-lg font-medium text-heading">{food.name}</span>
            <span className="font-body text-sm text-muted">
              {food.measurement === 'units' ? 'ליחידה' : `ל-100 ${food.amountUnit === 'ml' ? 'מ״ל' : 'גרם'}`}
              {food.source === 'catalog' ? ' · מהמאגר' : ''}
            </span>
          </span>
          <span className="flex flex-shrink-0 flex-col items-end">
            <span className="font-display text-3xl font-bold leading-none tabular-nums text-accent">{v ? fmt(v.calories) : '–'}</span>
            <span className="font-body text-xs text-muted">קק״ל</span>
          </span>
        </button>
        <button type="button" onClick={onDelete} aria-label={`מחק ${food.name}`}
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-danger hover:bg-danger/10 ${focusRing}`}>
          <Trash2 size={18} strokeWidth={2} />
        </button>
      </div>
      {v && <MacroPills protein={v.protein} carbs={v.carbs} fat={v.fat} />}
    </div>
  )
}

/** Saved meal card like the app: icon, name, total kcal, delete, macro pills, collapsible ingredients */
function MealCard({ meal, onSelect, onDelete }: { meal: SavedMeal; onSelect: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const t = mealTotals(meal.items)
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onSelect} aria-label={`${meal.name || 'ארוחה'} - בחר ארוחה`}
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-right transition-transform duration-100 active:scale-[0.98] ${focusRing}`}>
          <span aria-hidden className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-accent/10 bg-accent/10 text-accent">
            <UtensilsCrossed size={22} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1 truncate font-body text-lg font-medium text-heading">{meal.name || 'ארוחה חדשה'}</span>
          <span className="flex flex-shrink-0 flex-col items-end">
            <span className="font-display text-3xl font-bold leading-none tabular-nums text-accent">{fmt(t.calories)}</span>
            <span className="font-body text-xs text-muted">קק״ל</span>
          </span>
        </button>
        <button type="button" onClick={onDelete} aria-label={`מחק את ${meal.name || 'הארוחה'}`}
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-danger hover:bg-danger/10 ${focusRing}`}>
          <Trash2 size={18} strokeWidth={2} />
        </button>
      </div>

      <MacroPills protein={Math.round(t.protein)} carbs={Math.round(t.carbs)} fat={Math.round(t.fat)} />

      {meal.items.length > 0 && (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
            className={`flex min-h-9 items-center gap-1 self-start rounded-lg font-body text-sm text-muted hover:text-text-col ${focusRing}`}>
            {meal.items.length} מרכיבים
            <ChevronDown size={16} strokeWidth={2} aria-hidden className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <ul className="flex flex-col gap-2">
              {meal.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 font-body text-sm">
                  <span className="min-w-0 flex-1 truncate text-muted">
                    {i.food.name} <span className="text-heading">{amountLabel(i.food, i.amount)}</span>
                  </span>
                  <span className="flex-shrink-0 tabular-nums text-muted">{fmt(nutrientsFor(i.food, i.amount).calories)} קק״ל</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
