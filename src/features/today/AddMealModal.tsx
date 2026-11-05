import { useState, useEffect, useMemo } from 'react'
import { Clock, RotateCcw, Trash2 } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { NumberField } from '../../shared/components/NumberField'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { MealIcon } from '../../shared/icons/MealIcon'
import { useAddMeal } from './useAddMeal'
import { useEditMeal } from './useEditMeal'
import { useDeleteMeal } from './useDeleteMeal'
import { useRecentMeals, type RecentMeal } from './useRecentMeals'
import { useToday } from './useToday'
import { useGoals } from '../../lib/useGoals'
import type { NutritionLog } from '../../types/nutrition'
import { todayLocal } from '../../lib/date'

/** Order = how often each is picked; first ones are visible without scrolling */
const MEAL_OPTIONS = [
  'ארוחת בוקר',
  'ארוחת צהריים',
  'ארוחת ערב',
  'חטיף',
  'שייק',
  'פוסט וורקאות',
  'נשנוש',
  'חלבון',
  'פירות',
  'ירקות',
  'פחמימות',
  'שומנים',
  'אחר',
]

/** Short chip labels; the stored value stays the full name */
const SHORT_LABEL: Record<string, string> = {
  'ארוחת בוקר': 'בוקר',
  'ארוחת צהריים': 'צהריים',
  'ארוחת ערב': 'ערב',
  'פוסט וורקאות': 'אחרי אימון',
}

const ADD_MEAL_DRAFT_KEY = 'fitnesstracker:add-meal-draft'

interface MealDraft {
  mealName: string
  foodItems: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  eatTime: string
}

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
  initialMeal?: NutritionLog
  /** Meal type to preselect when adding (overrides a saved draft's type) */
  presetMealName?: string
}

const nowHHMM = () => new Date().toTimeString().slice(0, 5)
const todayStr = todayLocal
const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export function AddMealModal({ isOpen, onClose, initialMeal, presetMealName }: AddMealModalProps) {
  const isEditing = !!initialMeal

  const [mealName, setMealName] = useState(MEAL_OPTIONS[0]!)
  const [foodItems, setFoodItems] = useState('')
  const [calories, setCalories] = useState(0)
  const [proteinG, setProteinG] = useState(0)
  const [carbsG, setCarbsG] = useState(0)
  const [fatG, setFatG] = useState(0)
  const [eatTime, setEatTime] = useState(nowHHMM)
  const [draftReady, setDraftReady] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [appliedRecent, setAppliedRecent] = useState<number | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const { mutate: addMeal, isPending: isAdding } = useAddMeal()
  const { mutate: editMeal, isPending: isSavingEdit } = useEditMeal()
  const { mutate: deleteMeal, isPending: isDeleting } = useDeleteMeal()
  const isPending = isAdding || isSavingEdit || isDeleting

  const { data: recentMeals = [] } = useRecentMeals(isOpen && !isEditing)
  const { totals } = useToday()
  const { goalCalories, goalProtein } = useGoals()

  // ── Load meal / draft on open ──
  useEffect(() => {
    if (!isOpen) return
    setTriedSubmit(false)
    setAppliedRecent(null)
    if (initialMeal) {
      setMealName(initialMeal.meal_name)
      setFoodItems(initialMeal.food_items ?? '')
      setCalories(initialMeal.calories)
      setProteinG(Math.round(initialMeal.protein_g ?? 0))
      setCarbsG(Math.round(initialMeal.carbs_g ?? 0))
      setFatG(Math.round(initialMeal.fat_g ?? 0))
      setEatTime(initialMeal.time?.slice(0, 5) ?? nowHHMM())
      setDraftReady(false)
      return
    }
    let draft: MealDraft | null = null
    try {
      const saved = localStorage.getItem(ADD_MEAL_DRAFT_KEY)
      draft = saved ? (JSON.parse(saved) as MealDraft) : null
    } catch {
      draft = null
    }
    setMealName(
      presetMealName && MEAL_OPTIONS.includes(presetMealName)
        ? presetMealName
        : draft?.mealName ?? MEAL_OPTIONS[0]!,
    )
    setFoodItems(draft?.foodItems ?? '')
    setCalories(draft?.calories ?? 0)
    setProteinG(draft?.proteinG ?? 0)
    setCarbsG(draft?.carbsG ?? 0)
    setFatG(draft?.fatG ?? 0)
    setEatTime(draft?.eatTime ?? nowHHMM())
    setDraftReady(true)
  }, [isOpen, initialMeal, presetMealName])

  // ── Persist the add-draft so an accidental close loses nothing ──
  useEffect(() => {
    if (!isOpen || isEditing || !draftReady) return
    const draft: MealDraft = { mealName, foodItems, calories, proteinG, carbsG, fatG, eatTime }
    try {
      localStorage.setItem(ADD_MEAL_DRAFT_KEY, JSON.stringify(draft))
    } catch {
      /* storage unavailable: the draft is a convenience only */
    }
  }, [isOpen, isEditing, draftReady, mealName, foodItems, calories, proteinG, carbsG, fatG, eatTime])

  const clearDraft = () => {
    try { localStorage.removeItem(ADD_MEAL_DRAFT_KEY) } catch { /* ignore */ }
  }

  const isDirty = !isEditing && (calories > 0 || proteinG > 0 || carbsG > 0 || fatG > 0 || foodItems.trim() !== '')

  const resetForm = () => {
    setFoodItems('')
    setCalories(0)
    setProteinG(0)
    setCarbsG(0)
    setFatG(0)
    setEatTime(nowHHMM())
    setAppliedRecent(null)
    setTriedSubmit(false)
    clearDraft()
  }

  const applyRecent = (m: RecentMeal, index: number) => {
    if (MEAL_OPTIONS.includes(m.meal_name)) setMealName(m.meal_name)
    setFoodItems(m.food_items)
    setCalories(m.calories)
    setProteinG(m.protein_g)
    setCarbsG(m.carbs_g)
    setFatG(m.fat_g)
    setEatTime(nowHHMM())
    setAppliedRecent(index)
  }

  // ── Live impact on today's goals ──
  const impact = useMemo(() => {
    // Editing an older day's meal: today's goals don't apply
    if (initialMeal && initialMeal.date !== todayStr()) return null
    // When editing today's meal its old values are already inside today's totals
    const baseCal = totals.calories - (initialMeal?.calories ?? 0)
    const basePro = totals.protein - (initialMeal?.protein_g ?? 0)
    return {
      calLeft: goalCalories - (baseCal + calories),
      proteinAfter: basePro + proteinG,
    }
  }, [initialMeal, totals.calories, totals.protein, calories, proteinG, goalCalories])

  const caloriesMissing = calories <= 0

  const handleSubmit = () => {
    setTriedSubmit(true)
    if (caloriesMissing || isPending) return
    const payload = {
      meal_name: mealName,
      food_items: foodItems.trim(),
      calories,
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG,
      time: eatTime,
    }
    if (isEditing && initialMeal) {
      editMeal({ id: initialMeal.id, ...payload }, { onSuccess: onClose })
    } else {
      addMeal(payload, {
        onSuccess: () => {
          clearDraft()
          onClose()
        },
      })
    }
  }

  const footer = (
    <div className="flex flex-col gap-2.5">
      {impact && (
        <p className="text-center font-body text-sm tabular-nums text-muted" aria-live="polite">
          {impact.calLeft >= 0 ? (
            <>אחרי הארוחה יישארו <span className="font-medium text-accent">{fmt(impact.calLeft)}</span> קל'</>
          ) : (
            <>אחרי הארוחה תחרוג ב-<span className="font-medium text-danger">{fmt(-impact.calLeft)}</span> קל'</>
          )}
          <span className="mx-1.5" aria-hidden>·</span>
          חלבון <span className="font-medium text-text-col">{fmt(impact.proteinAfter)}</span>/{goalProtein}g
        </p>
      )}
      <div className="flex gap-2.5">
        {isEditing && (
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={isPending}
            aria-label="מחק ארוחה"
            className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-danger/40 text-danger transition-colors duration-150 hover:bg-danger/10 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            <Trash2 size={20} strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          aria-disabled={caloriesMissing || undefined}
          className={`flex h-[52px] flex-1 items-center justify-center rounded-2xl font-body text-base font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-60 ${focusRing}
            ${caloriesMissing ? 'bg-surface2 text-muted' : 'bg-accent text-bg'}`}
        >
          {isAdding || isSavingEdit ? 'שומר…' : isEditing ? 'שמור שינויים' : 'הוסף ארוחה'}
        </button>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'עריכת ארוחה' : 'ארוחה חדשה'} footer={footer}>
      <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        {/* Repeat a recent meal: the fastest way to log */}
        {!isEditing && recentMeals.length > 0 && (
          <section aria-labelledby="recent-heading" className="flex flex-col gap-2">
            <div className="flex min-h-9 items-center justify-between">
              <h3 id="recent-heading" className="font-body text-sm text-muted">חזרה על ארוחה</h3>
              {isDirty && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={`-me-2 flex h-9 items-center gap-1 rounded-lg px-2 font-body text-sm text-muted transition-colors duration-150 hover:text-text-col ${focusRing}`}
                >
                  <RotateCcw size={14} strokeWidth={2} />
                  נקה
                </button>
              )}
            </div>
            <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {recentMeals.map((m, i) => {
                const active = appliedRecent === i
                return (
                  <button
                    key={`${m.food_items}-${m.calories}`}
                    type="button"
                    onClick={() => applyRecent(m, i)}
                    aria-pressed={active}
                    className={`flex w-40 flex-shrink-0 flex-col gap-1 rounded-2xl border p-3 text-right transition-colors duration-150 [-webkit-tap-highlight-color:transparent] ${focusRing}
                      ${active ? 'border-accent-line bg-accent-soft' : 'border-border-col bg-surface2 hover:border-subtle'}`}
                  >
                    <span className="line-clamp-2 min-h-[2.5em] font-body text-sm leading-tight text-text-col">{m.food_items}</span>
                    <span className="font-body text-xs tabular-nums text-muted">
                      <span className={active ? 'text-accent' : 'text-text-col'}>{fmt(m.calories)}</span> קל'
                      {m.protein_g > 0 && <> · {m.protein_g}g חלבון</>}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Meal type */}
        <fieldset className="flex flex-col">
          <legend className="mb-2 font-body text-sm text-muted">סוג ארוחה</legend>
          <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {MEAL_OPTIONS.map((opt) => {
              const selected = opt === mealName
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMealName(opt)}
                  aria-pressed={selected}
                  className={`flex h-11 flex-shrink-0 items-center gap-1.5 rounded-full border px-4 font-body text-sm transition-colors duration-150 [-webkit-tap-highlight-color:transparent] ${focusRing}
                    ${selected
                      ? 'border-accent bg-accent font-medium text-bg'
                      : 'border-border-col bg-surface2 text-text-col hover:border-subtle'}`}
                >
                  <MealIcon mealName={opt} size={16} color="currentColor" />
                  {SHORT_LABEL[opt] ?? opt}
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* What */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="meal-food" className="font-body text-sm text-muted">מה אכלת?</label>
          <input
            id="meal-food"
            type="text"
            value={foodItems}
            onChange={(e) => setFoodItems(e.target.value)}
            placeholder="לדוגמה: אורז, חזה עוף, סלט"
            enterKeyHint="next"
            className="h-12 w-full rounded-2xl border border-border-col bg-bg px-4 font-body text-base text-heading outline-none transition-colors duration-150 placeholder:text-subtle focus:border-accent-line"
          />
        </div>

        {/* When */}
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="meal-time" className="flex items-center gap-2 font-body text-sm text-muted">
            <Clock size={16} strokeWidth={2} />
            שעה
          </label>
          <div className="flex items-center gap-2">
            {eatTime !== nowHHMM() && (
              <button
                type="button"
                onClick={() => setEatTime(nowHHMM())}
                className={`flex h-11 items-center rounded-xl px-3 font-body text-sm text-accent transition-colors duration-150 hover:bg-accent-soft ${focusRing}`}
              >
                עכשיו
              </button>
            )}
            <input
              id="meal-time"
              type="time"
              value={eatTime}
              onChange={(e) => setEatTime(e.target.value)}
              className="h-11 rounded-xl border border-border-col bg-bg px-3 font-body text-base tabular-nums text-heading outline-none [color-scheme:dark] focus:border-accent-line"
            />
          </div>
        </div>

        {/* Numbers: calories is the only required one */}
        <NumberField
          label="קלוריות"
          value={calories}
          onChange={setCalories}
          unit="קל'"
          step={10}
          max={5000}
          emphasis
          invalid={triedSubmit && caloriesMissing}
          hint={triedSubmit && caloriesMissing ? 'צריך להזין קלוריות כדי לשמור' : undefined}
        />
        <NumberField label="חלבון" value={proteinG} onChange={setProteinG} unit="g" step={5} max={400} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="פחמימות" value={carbsG} onChange={setCarbsG} unit="g" step={5} max={600} />
          <NumberField label="שומן" value={fatG} onChange={setFatG} unit="g" step={5} max={300} />
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        message="למחוק את הארוחה? אי אפשר לבטל את הפעולה."
        onConfirm={() => {
          setConfirmDeleteOpen(false)
          if (initialMeal) deleteMeal(initialMeal.id, { onSuccess: onClose })
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </Modal>
  )
}
