import { useState, useEffect, useMemo, useRef } from 'react'
import { Clock, MoreHorizontal, Search, Sparkles, Trash2, X } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { MealIcon } from '../../shared/icons/MealIcon'
import { useAddMeal } from './useAddMeal'
import { useEditMeal } from './useEditMeal'
import { useDeleteMeal } from './useDeleteMeal'
import { useRecentMeals, type RecentMeal } from './useRecentMeals'
import { useToday } from './useToday'
import { useGoals } from '../../lib/useGoals'
import { todayLocal } from '../../lib/date'
import { DayFillBar, MacroComposition, macroKcal } from './nutritionVisuals'
import type { NutritionLog } from '../../types/nutrition'

/** Primary types get a segment each; the rest live behind "עוד" */
const PRIMARY_TYPES = ['ארוחת בוקר', 'ארוחת צהריים', 'ארוחת ערב', 'חטיף'] as const
const MORE_TYPES = ['שייק', 'פוסט וורקאות', 'נשנוש', 'חלבון', 'פירות', 'ירקות', 'פחמימות', 'שומנים', 'אחר'] as const
const MEAL_OPTIONS: string[] = [...PRIMARY_TYPES, ...MORE_TYPES]

const SHORT_LABEL: Record<string, string> = {
  'ארוחת בוקר': 'בוקר',
  'ארוחת צהריים': 'צהריים',
  'ארוחת ערב': 'ערב',
  'פוסט וורקאות': 'אחרי אימון',
}
const short = (t: string) => SHORT_LABEL[t] ?? t

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
const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')
const digitsOnly = (v: string, max: number) => {
  const d = v.replace(/[^\d]/g, '')
  return d === '' ? 0 : Math.min(max, Number(d))
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export function AddMealModal({ isOpen, onClose, initialMeal, presetMealName }: AddMealModalProps) {
  const isEditing = !!initialMeal

  const [mealName, setMealName] = useState<string>(PRIMARY_TYPES[0])
  const [foodItems, setFoodItems] = useState('')
  const [calories, setCalories] = useState(0)
  const [proteinG, setProteinG] = useState(0)
  const [carbsG, setCarbsG] = useState(0)
  const [fatG, setFatG] = useState(0)
  const [eatTime, setEatTime] = useState(nowHHMM)
  const [draftReady, setDraftReady] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [filledFrom, setFilledFrom] = useState<string | null>(null)
  const [showMoreTypes, setShowMoreTypes] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const caloriesRef = useRef<HTMLInputElement>(null)

  const { mutate: addMeal, isPending: isAdding } = useAddMeal()
  const { mutate: editMeal, isPending: isSavingEdit } = useEditMeal()
  const { mutate: deleteMeal, isPending: isDeleting } = useDeleteMeal()
  const isPending = isAdding || isSavingEdit || isDeleting

  const { data: recentMeals = [] } = useRecentMeals(isOpen, 40)
  const { totals } = useToday()
  const { goalCalories, goalProtein } = useGoals()

  // ── Load meal / draft on open ──
  useEffect(() => {
    if (!isOpen) return
    setTriedSubmit(false)
    setFilledFrom(null)
    setSearchFocused(false)
    if (initialMeal) {
      setMealName(initialMeal.meal_name)
      setFoodItems(initialMeal.food_items ?? '')
      setCalories(initialMeal.calories)
      setProteinG(Math.round(initialMeal.protein_g ?? 0))
      setCarbsG(Math.round(initialMeal.carbs_g ?? 0))
      setFatG(Math.round(initialMeal.fat_g ?? 0))
      setEatTime(initialMeal.time?.slice(0, 5) ?? nowHHMM())
      setShowMoreTypes(!PRIMARY_TYPES.includes(initialMeal.meal_name as (typeof PRIMARY_TYPES)[number]))
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
    const type =
      presetMealName && MEAL_OPTIONS.includes(presetMealName) ? presetMealName : draft?.mealName ?? PRIMARY_TYPES[0]
    setMealName(type)
    setShowMoreTypes(!PRIMARY_TYPES.includes(type as (typeof PRIMARY_TYPES)[number]))
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
    try { localStorage.setItem(ADD_MEAL_DRAFT_KEY, JSON.stringify(draft)) } catch { /* convenience only */ }
  }, [isOpen, isEditing, draftReady, mealName, foodItems, calories, proteinG, carbsG, fatG, eatTime])

  const clearDraft = () => {
    try { localStorage.removeItem(ADD_MEAL_DRAFT_KEY) } catch { /* ignore */ }
  }

  // ── Search over what you've eaten before ──
  const query = foodItems.trim().toLowerCase()
  const suggestions = useMemo(() => {
    if (filledFrom && filledFrom === foodItems) return []
    if (!query) return isEditing ? [] : recentMeals.slice(0, 3)
    return recentMeals
      .filter((m) => m.food_items.toLowerCase().includes(query) && m.food_items.toLowerCase() !== query)
      .slice(0, 4)
  }, [query, recentMeals, isEditing, filledFrom, foodItems])
  const showSuggestions = searchFocused && suggestions.length > 0

  const applySuggestion = (m: RecentMeal) => {
    if (MEAL_OPTIONS.includes(m.meal_name)) {
      setMealName(m.meal_name)
      setShowMoreTypes(!PRIMARY_TYPES.includes(m.meal_name as (typeof PRIMARY_TYPES)[number]))
    }
    setFoodItems(m.food_items)
    setCalories(m.calories)
    setProteinG(m.protein_g)
    setCarbsG(m.carbs_g)
    setFatG(m.fat_g)
    setFilledFrom(m.food_items)
    setSearchFocused(false)
  }

  // ── Derived ──
  const fromMacros = macroKcal(proteinG, carbsG, fatG)
  const canEstimate = calories === 0 && fromMacros > 0
  const caloriesMissing = calories <= 0

  const impact = useMemo(() => {
    // Editing an older day's meal: today's goals don't apply
    if (initialMeal && initialMeal.date !== todayLocal()) return null
    // When editing today's meal its old values are already inside today's totals
    const before = Math.max(0, totals.calories - (initialMeal?.calories ?? 0))
    const proteinBefore = Math.max(0, totals.protein - (initialMeal?.protein_g ?? 0))
    return { before, left: goalCalories - before - calories, proteinAfter: proteinBefore + proteinG }
  }, [initialMeal, totals.calories, totals.protein, calories, proteinG, goalCalories])

  const handleSubmit = () => {
    setTriedSubmit(true)
    if (caloriesMissing) {
      caloriesRef.current?.focus()
      return
    }
    if (isPending) return
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
      addMeal(payload, { onSuccess: () => { clearDraft(); onClose() } })
    }
  }

  const moreSelected = !PRIMARY_TYPES.includes(mealName as (typeof PRIMARY_TYPES)[number])

  // ── Header: time as a compact chip that opens the native picker ──
  const timeChip = (
    <label className={`relative flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border-col bg-bg px-3 font-body text-sm tabular-nums text-text-col transition-colors duration-150 focus-within:border-accent-line hover:border-subtle`}>
      <Clock size={14} strokeWidth={2} className="text-muted" />
      {eatTime}
      <span className="sr-only">שעת הארוחה</span>
      <input
        type="time"
        value={eatTime}
        onChange={(e) => e.target.value && setEatTime(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0 [color-scheme:dark]"
      />
    </label>
  )

  const footer = (
    <div className="flex flex-col gap-3">
      {impact && (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <DayFillBar before={impact.before} meal={calories} goal={goalCalories} />
          <p className="flex justify-between font-body text-sm tabular-nums text-muted">
            <span>
              {impact.left >= 0 ? (
                <>יישארו <span className="font-semibold text-accent">{fmt(impact.left)}</span> קל'</>
              ) : (
                <>חריגה של <span className="font-semibold text-danger">{fmt(-impact.left)}</span> קל'</>
              )}
            </span>
            <span>
              חלבון <span className="font-medium text-text-col">{fmt(impact.proteinAfter)}</span>/{goalProtein}g
            </span>
          </p>
        </div>
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
          className={`flex h-[52px] flex-1 items-center justify-center rounded-2xl font-body text-base font-semibold transition-[background-color,color,transform] duration-200 active:scale-[0.98] disabled:opacity-60 ${focusRing}
            ${caloriesMissing ? 'bg-surface2 text-muted' : 'bg-accent text-bg shadow-[0_8px_24px_-10px_rgba(150,200,40,0.7)]'}`}
        >
          {isAdding || isSavingEdit ? 'שומר…' : isEditing ? 'שמור שינויים' : 'הוסף ארוחה'}
        </button>
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'עריכת ארוחה' : 'ארוחה חדשה'}
      headerAction={timeChip}
      footer={footer}
    >
      <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        {/* 1 · What did you eat — searches your history and fills everything */}
        <div className="relative">
          <div className={`flex h-14 items-center gap-2.5 rounded-2xl border bg-bg px-4 transition-colors duration-150 ${searchFocused ? 'border-accent-line' : 'border-border-col'}`}>
            <Search size={18} strokeWidth={2} className="flex-shrink-0 text-muted" />
            <input
              type="text"
              value={foodItems}
              onChange={(e) => { setFoodItems(e.target.value); setFilledFrom(null) }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="מה אכלת?"
              aria-label="מה אכלת"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              enterKeyHint="next"
              className="h-full min-w-0 flex-1 bg-transparent font-body text-base text-heading outline-none placeholder:text-muted"
            />
            {foodItems && (
              <button
                type="button"
                onClick={() => { setFoodItems(''); setFilledFrom(null) }}
                aria-label="נקה"
                className={`-me-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-muted hover:text-text-col ${focusRing}`}
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          {showSuggestions && (
            <ul role="listbox" aria-label={query ? 'תוצאות' : 'אחרונות'} className="mt-2 flex flex-col overflow-hidden rounded-2xl border border-border-col bg-surface2">
              {!query && <li className="px-4 pb-1 pt-2.5 font-body text-xs text-muted">אחרונות</li>}
              {suggestions.map((m) => (
                <li key={`${m.food_items}-${m.calories}`} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applySuggestion(m)}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-right transition-colors duration-100 hover:bg-bg/50 active:bg-bg/70"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-bg text-muted">
                      <MealIcon mealName={m.meal_name} size={15} color="currentColor" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-body text-[15px] text-text-col">{m.food_items}</span>
                    <span className="flex-shrink-0 font-body text-xs tabular-nums text-muted">
                      <span className="text-heading">{fmt(m.calories)}</span> קל'
                      {m.protein_g > 0 && <span className="text-macro-protein"> · {m.protein_g}g</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {filledFrom && filledFrom === foodItems && (
            <p className="mt-2 flex items-center gap-1.5 font-body text-xs text-accent">
              <Sparkles size={13} strokeWidth={2} />
              מולא מארוחה קודמת. אפשר לשנות כל ערך.
            </p>
          )}
        </div>

        {/* 2 · Meal type: four segments + more */}
        <div className="flex flex-col gap-2">
          <div role="radiogroup" aria-label="סוג ארוחה" className="grid grid-cols-5 gap-1 rounded-2xl bg-bg p-1">
            {PRIMARY_TYPES.map((t) => {
              const selected = mealName === t
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => { setMealName(t); setShowMoreTypes(false) }}
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl font-body text-xs transition-colors duration-150 ${focusRing}
                    ${selected ? 'bg-accent font-medium text-bg' : 'text-muted hover:text-text-col'}`}
                >
                  <MealIcon mealName={t} size={18} color="currentColor" />
                  {short(t)}
                </button>
              )
            })}
            <button
              type="button"
              aria-expanded={showMoreTypes}
              onClick={() => setShowMoreTypes((v) => !v)}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl font-body text-xs transition-colors duration-150 ${focusRing}
                ${moreSelected ? 'bg-accent font-medium text-bg' : showMoreTypes ? 'bg-surface2 text-text-col' : 'text-muted hover:text-text-col'}`}
            >
              {moreSelected ? <MealIcon mealName={mealName} size={18} color="currentColor" /> : <MoreHorizontal size={18} strokeWidth={2} />}
              <span className="max-w-full truncate px-0.5">{moreSelected ? short(mealName) : 'עוד'}</span>
            </button>
          </div>
          {showMoreTypes && (
            <div className="flex flex-wrap gap-1.5">
              {MORE_TYPES.map((t) => {
                const selected = mealName === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMealName(t)}
                    aria-pressed={selected}
                    className={`flex h-10 items-center gap-1.5 rounded-full border px-3 font-body text-sm transition-colors duration-150 ${focusRing}
                      ${selected ? 'border-accent bg-accent-soft text-accent' : 'border-border-col text-text-col hover:border-subtle'}`}
                  >
                    <MealIcon mealName={t} size={14} color="currentColor" />
                    {short(t)}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 3 · The nutrition label */}
        <section aria-label="ערכים תזונתיים" className="flex flex-col gap-4 rounded-3xl border border-border-col bg-bg p-4">
          <div className="flex flex-col items-center gap-1">
            <label htmlFor="meal-kcal" className="font-body text-sm text-muted">קלוריות</label>
            <div className="flex items-baseline justify-center gap-2">
              <input
                ref={caloriesRef}
                id="meal-kcal"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={calories === 0 ? '' : String(calories)}
                placeholder="0"
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setCalories(digitsOnly(e.target.value, 5000))}
                aria-invalid={(triedSubmit && caloriesMissing) || undefined}
                aria-describedby="meal-kcal-hint"
                className="w-[5ch] bg-transparent text-center font-display text-[64px] font-bold leading-none tabular-nums text-heading caret-accent outline-none placeholder:text-subtle"
              />
              <span className="font-body text-base text-muted">קל'</span>
            </div>
            <span
              aria-hidden
              className={`h-0.5 w-24 rounded-full transition-colors duration-200 ${triedSubmit && caloriesMissing ? 'bg-danger' : calories > 0 ? 'bg-accent' : 'bg-border-col'}`}
            />
            <p id="meal-kcal-hint" className="min-h-[1.25rem] font-body text-xs">
              {triedSubmit && caloriesMissing && !canEstimate ? (
                <span className="text-danger">צריך להזין קלוריות כדי לשמור</span>
              ) : canEstimate ? (
                <button
                  type="button"
                  onClick={() => setCalories(fromMacros)}
                  className={`flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-accent ${focusRing}`}
                >
                  <Sparkles size={12} strokeWidth={2} />
                  לפי המאקרו ≈ {fmt(fromMacros)} קל'. להשתמש?
                </button>
              ) : null}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MacroTile id="meal-p" label="חלבון" value={proteinG} onChange={setProteinG} dotClass="bg-macro-protein" />
            <MacroTile id="meal-c" label="פחמימות" value={carbsG} onChange={setCarbsG} dotClass="bg-macro-carbs" />
            <MacroTile id="meal-f" label="שומן" value={fatG} onChange={setFatG} dotClass="bg-macro-fat" />
          </div>

          <MacroComposition protein={proteinG} carbs={carbsG} fat={fatG} />
        </section>
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

function MacroTile({
  id, label, value, onChange, dotClass,
}: { id: string; label: string; value: number; onChange: (v: number) => void; dotClass: string }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-text flex-col items-center gap-1 rounded-2xl border border-border-col bg-surface px-2 py-2.5 transition-colors duration-150 focus-within:border-accent-line"
    >
      <span className="flex items-center gap-1.5 font-body text-xs text-muted">
        <span aria-hidden className={`h-2 w-2 rounded-full ${dotClass}`} />
        {label}
      </span>
      <span className="flex items-baseline gap-0.5">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={value === 0 ? '' : String(value)}
          placeholder="0"
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChange(digitsOnly(e.target.value, 999))}
          className="w-[3.5ch] bg-transparent text-center font-display text-[28px] font-semibold leading-none tabular-nums text-heading caret-accent outline-none placeholder:text-subtle"
        />
        <span className="font-body text-xs text-muted">g</span>
      </span>
    </label>
  )
}
