import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
import { Modal, nextLevel, type SheetLevel } from '../../shared/components/Modal'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { todayLocal } from '../../lib/date'
import { FoodPickerSheet } from './FoodPickerSheet'
import { MealItemRow } from './MealItemRow'
import { mealTotals } from './MealBuilderSheet'
import { useAddMealEntries, useDayProgress, useUpdateMealItems } from './hooks'
import type { Food, SavedMeal } from './types'
import { NutritionSummaryCard } from './ui/NutritionSummaryCard'
import { ActionButton } from './ui/SegmentedActionBar'
import { CountPill } from './ui/FlowParts'
import { focusRing } from './ui/styles'

/** An ingredient on the review screen: from the saved meal (mealItemId) or added now (null) */
interface Row {
  key: string
  mealItemId: string | null
  food: Food
  amount: number
  originalAmount: number | null
}

const rowsOf = (meal: SavedMeal | null): Row[] =>
  (meal?.items ?? []).map((i) => ({ key: i.id, mealItemId: i.id, food: i.food, amount: Math.max(0.5, i.amount), originalAmount: i.amount }))

/**
 * "סקירת ארוחה", like the app's MealReviewModal: adjust amounts, remove or add ingredients,
 * optionally keep the changes in the saved meal ("עדכן את הארוחה"), and log it to today.
 */
export function MealReviewSheet({ meal, onClose, onDone, level }: {
  meal: SavedMeal | null
  onClose: () => void
  /** After the meal is logged */
  onDone: () => void
  level: SheetLevel
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [updateSaved, setUpdateSaved] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<Row | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!meal) return
    setRows(rowsOf(meal))
    setUpdateSaved(false)
    setRowToDelete(null)
    setPickerOpen(false)
  }, [meal])

  const { goals, consumed } = useDayProgress()
  const addEntries = useAddMealEntries()
  const updateMeal = useUpdateMealItems()
  const busy = addEntries.isPending || updateMeal.isPending
  const totals = useMemo(() => mealTotals(rows), [rows])

  const removedIds = useMemo(() => {
    const kept = new Set(rows.map((r) => r.mealItemId).filter(Boolean))
    return rowsOf(meal).map((r) => r.mealItemId!).filter((id) => !kept.has(id))
  }, [rows, meal])
  const isDirty = removedIds.length > 0 || rows.some((r) => r.mealItemId === null || r.amount !== r.originalAmount)

  const confirm = async () => {
    if (!meal || !rows.length || busy) return
    if (updateSaved && isDirty) {
      try {
        await updateMeal.mutateAsync({
          mealId: meal.id,
          changes: {
            removeIds: removedIds,
            updates: rows.filter((r) => r.mealItemId && r.amount !== r.originalAmount).map((r) => ({ id: r.mealItemId!, amount: r.amount })),
            additions: rows.filter((r) => r.mealItemId === null).map((r) => ({ food: r.food, amount: r.amount })),
          },
        })
      } catch {
        return // stay on the screen; the error toast already showed
      }
    }
    addEntries.mutate(
      { items: rows.map((r) => ({ key: r.key, food: r.food, amount: r.amount })), date: todayLocal(), groupName: meal.name || 'ארוחה', createdAt: new Date().toISOString() },
      { onSuccess: () => { onClose(); onDone() } },
    )
  }

  if (!meal) return null

  return (
    <>
      <Modal isOpen onClose={onClose} title={meal.name || 'ארוחה חדשה'} level={level}>
        <div className="flex flex-col gap-4">
          <span className="font-body text-xs font-bold uppercase tracking-[2px] text-accent">סקירת ארוחה</span>

          <NutritionSummaryCard totals={totals} goals={goals} consumed={consumed} />

          <div className="flex items-center justify-between px-1">
            <h3 className="font-body text-base font-semibold text-heading">מרכיבי הארוחה</h3>
            <div className="flex items-center gap-3">
              <CountPill>{rows.length} מרכיבים</CountPill>
              <button type="button" onClick={() => setPickerOpen(true)} aria-label="הוסף מרכיב"
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-accent/45 bg-accent/[0.18] text-accent ${focusRing}`}>
                <Plus size={24} strokeWidth={2} />
              </button>
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {rows.map((r) => (
              <li key={r.key}>
                <MealItemRow
                  food={r.food}
                  amount={r.amount}
                  showReference
                  onChange={(amount) => setRows((p) => p.map((x) => (x.key === r.key ? { ...x, amount } : x)))}
                  onRemove={() => setRowToDelete(r)}
                />
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            {isDirty && (
              <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <input type="checkbox" checked={updateSaved} disabled={busy} onChange={(e) => setUpdateSaved(e.target.checked)}
                  className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer accent-accent" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-body text-sm font-semibold text-heading">עדכן את הארוחה</span>
                  <span className="font-body text-xs text-muted">
                    {updateSaved ? 'בפעם הבאה הארוחה תיפתח עם המרכיבים והכמויות הנוכחיים' : 'השינויים יחולו רק על ההוספה הזו'}
                  </span>
                </span>
              </label>
            )}
            <ActionButton onClick={confirm} disabled={busy || rows.length === 0} Icon={CheckCircle2}>
              {busy ? 'מוסיף…' : 'הוסף ליומן'}
            </ActionButton>
          </div>
        </div>
      </Modal>

      <FoodPickerSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        level={nextLevel(level)}
        baseTotals={totals}
        onPick={(food, amount) => {
          setRows((p) => [...p, { key: crypto.randomUUID(), mealItemId: null, food, amount, originalAmount: null }])
          setPickerOpen(false)
        }}
      />

      <ConfirmDialog
        visible={rowToDelete != null}
        title="מחיקת מרכיב"
        message={`האם למחוק את "${rowToDelete?.food.name ?? 'המרכיב'}" מהארוחה?`}
        onCancel={() => setRowToDelete(null)}
        onConfirm={() => {
          if (rowToDelete) setRows((p) => p.filter((x) => x.key !== rowToDelete.key))
          setRowToDelete(null)
        }}
      />
    </>
  )
}
