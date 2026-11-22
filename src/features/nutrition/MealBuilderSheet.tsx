import { useEffect, useMemo, useState } from 'react'
import { Calendar, List, Plus, PlusCircle, UtensilsCrossed } from 'lucide-react'
import { Modal, nextLevel, type SheetLevel } from '../../shared/components/Modal'
import { todayLocal } from '../../lib/date'
import { FoodPickerSheet } from './FoodPickerSheet'
import { MealItemRow } from './MealItemRow'
import { nutrientsFor, sumMacros } from './foodMath'
import { useAddMealEntries, useCreateSavedMeal, useDayProgress } from './hooks'
import type { CartItem, Macros } from './types'
import { NutritionSummaryCard } from './ui/NutritionSummaryCard'
import { ActionButton, SegmentedActionBar } from './ui/SegmentedActionBar'
import { CountPill } from './ui/FlowParts'
import { focusRing } from './ui/styles'

type SaveTarget = 'list' | 'journal'
const SAVE_OPTIONS = [
  { key: 'list', label: 'שמור לרשימה', Icon: List },
  { key: 'journal', label: 'יומן', Icon: Calendar },
]

/** Meal totals the way the app adds them: calories rounded per ingredient */
export function mealTotals(items: { food: CartItem['food']; amount: number }[]): Macros {
  return sumMacros(items.map((i) => {
    const n = nutrientsFor(i.food, i.amount)
    return { ...n, calories: Math.round(n.calories) }
  }))
}

/**
 * "בניית ארוחה", like the app's MealBuilder: a name, the rings card, the ingredients
 * (from my foods, or from the catalog / a new personal food via +), and where to add it:
 * save to "my meals", log to today, or both.
 */
export function MealBuilderSheet({ isOpen, onClose, level = 1 }: { isOpen: boolean; onClose: () => void; level?: SheetLevel }) {
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [targets, setTargets] = useState<SaveTarget[]>(['list', 'journal'])

  useEffect(() => {
    if (!isOpen) return
    setName('')
    setNameTouched(false)
    setItems([])
    setPickerOpen(false)
    setTargets(['list', 'journal'])
  }, [isOpen])

  const { goals, consumed } = useDayProgress()
  const saveMeal = useCreateSavedMeal()
  const addEntries = useAddMealEntries()
  const busy = saveMeal.isPending || addEntries.isPending
  const totals = useMemo(() => mealTotals(items), [items])
  const nameMissing = nameTouched && !name.trim()

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameTouched(true)
      document.getElementById('meal-name')?.focus()
      return
    }
    if (!items.length || busy) return
    const toList = targets.includes('list')
    const toJournal = targets.includes('journal')
    const writeJournal = () =>
      addEntries.mutate({ items, date: todayLocal(), groupName: trimmed, createdAt: new Date().toISOString() }, { onSuccess: onClose })
    if (!toList) {
      writeJournal()
      return
    }
    saveMeal.mutate({ name: trimmed, items }, { onSuccess: toJournal ? writeJournal : onClose })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="בניית ארוחה" level={level}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="meal-name" className="px-1 font-body text-xs font-semibold uppercase tracking-widest text-muted">איך נקרא לארוחה?</label>
            <input
              id="meal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              placeholder="למשל: שייק חלבון בוקר..."
              autoComplete="off"
              aria-invalid={nameMissing || undefined}
              aria-describedby={nameMissing ? 'meal-name-error' : undefined}
              className="min-h-[52px] rounded-2xl border border-white/5 bg-bg px-5 font-body text-base text-heading outline-none placeholder:text-subtle focus:border-accent-line aria-[invalid=true]:border-danger"
            />
            {nameMissing && <p id="meal-name-error" className="px-1 font-body text-xs text-danger">שם הארוחה הוא שדה חובה</p>}
          </div>

          {items.length > 0 && <NutritionSummaryCard totals={totals} goals={goals} consumed={consumed} />}

          <div className="flex items-center justify-between px-1">
            <h3 className="flex items-center gap-2 font-body text-base font-semibold text-heading">
              <List size={18} strokeWidth={2} className="text-accent" aria-hidden />
              מרכיבי הארוחה
            </h3>
            <div className="flex items-center gap-3">
              <CountPill>{items.length} מרכיבים</CountPill>
              {items.length > 0 && (
                <button type="button" onClick={() => setPickerOpen(true)} aria-label="הוסף מאכל לארוחה"
                  className={`flex h-11 w-11 items-center justify-center rounded-full border border-accent/45 bg-accent/[0.18] text-accent ${focusRing}`}>
                  <Plus size={24} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/10 bg-surface2/50 px-4 py-10">
              <UtensilsCrossed size={40} strokeWidth={1.5} className="text-subtle" aria-hidden />
              <p className="text-center font-body text-base text-muted">הארוחה עדיין ריקה.<br />לחץ על &quot;הוסף מאכל&quot; כדי להתחיל.</p>
              <ActionButton onClick={() => setPickerOpen(true)} Icon={PlusCircle}>הוסף מאכל לארוחה</ActionButton>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((it) => (
                <li key={it.key}>
                  <MealItemRow
                    food={it.food}
                    amount={it.amount}
                    onChange={(amount) => setItems((p) => p.map((x) => (x.key === it.key ? { ...x, amount } : x)))}
                    onRemove={() => setItems((p) => p.filter((x) => x.key !== it.key))}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2">
            <SegmentedActionBar
              options={SAVE_OPTIONS}
              selected={targets}
              onToggle={(k) => setTargets((p) => (p.includes(k as SaveTarget) ? p.filter((x) => x !== k) : [...p, k as SaveTarget]))}
              actionLabel="הוסף"
              onAction={submit}
              disabled={!items.length || busy}
              loading={busy}
              groupLabel="לאן להוסיף"
              infoMessage={'יומן בלבד: נרשם להיום ולא נשמר לשימוש חוזר.\nרשימה בלבד: נשמר לשימוש חוזר ולא נרשם להיום.\nשניהם: נשמר וגם נרשם להיום.'}
            />
          </div>
        </div>
      </Modal>

      <FoodPickerSheet
        isOpen={isOpen && pickerOpen}
        onClose={() => setPickerOpen(false)}
        level={nextLevel(level)}
        baseTotals={totals}
        onPick={(food, amount) => {
          setItems((p) => [...p, { key: crypto.randomUUID(), food, amount }])
          setPickerOpen(false)
        }}
      />
    </>
  )
}
