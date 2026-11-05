import { useState } from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { useToday } from './useToday'
import { useGoals } from '../../lib/useGoals'
import { ProgressBar } from '../../shared/components/ProgressBar'
import { MealCard } from './MealCard'
import { AddMealModal } from './AddMealModal'
import { EditGoalsModal } from './EditGoalsModal'
import type { NutritionLog } from '../../types/nutrition'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime'

export function TodayPage() {
  const { meals, totals, loading } = useToday()
  const { goalCalories, goalProtein } = useGoals()
  const [addMealOpen, setAddMealOpen] = useState(false)
  const [editGoalsOpen, setEditGoalsOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<NutritionLog | null>(null)

  const remaining = Math.round(goalCalories - totals.calories)
  const isOver = remaining < 0

  return (
    <>
      <div className="flex flex-col gap-6 px-4 pb-28 pt-4">
        {loading ? (
          <TodaySkeleton />
        ) : (
          <>
            {/* Daily summary: one answer to "how am I doing today?" */}
            <section
              aria-label="סיכום יומי"
              className="flex flex-col gap-5 rounded-2xl border border-border-col border-t-2 border-t-lime bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="font-body text-sm text-muted">
                    {isOver ? 'חרגת מהיעד ב-' : 'נשאר להיום'}
                  </p>
                  <p className="flex items-baseline gap-1.5">
                    <span
                      className={`font-display text-6xl font-bold leading-none tabular-nums ${isOver ? 'text-danger' : 'text-lime'}`}
                    >
                      {Math.abs(remaining).toLocaleString('he-IL')}
                    </span>
                    <span className="font-body text-base text-muted">קלוריות</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditGoalsOpen(true)}
                  aria-label="עריכת יעדים"
                  className={`-me-2 -mt-1 flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors duration-200 hover:bg-surface2 hover:text-text-col [-webkit-tap-highlight-color:transparent] ${focusRing}`}
                >
                  <SlidersHorizontal size={20} strokeWidth={1.75} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <ProgressBar value={totals.calories} goal={goalCalories} label="קלוריות" size="primary" />
                <ProgressBar value={totals.protein} goal={goalProtein} label="חלבון" unit="g" />
              </div>

              <dl className="flex gap-6 border-t border-border-col pt-3 font-body text-sm">
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-muted">פחמימות</dt>
                  <dd className="font-medium tabular-nums text-text-col">{Math.round(totals.carbs)}g</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-muted">שומן</dt>
                  <dd className="font-medium tabular-nums text-text-col">{Math.round(totals.fat)}g</dd>
                </div>
              </dl>
            </section>

            {/* Meals */}
            <section aria-labelledby="meals-heading" className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h2 id="meals-heading" className="font-body text-base font-medium text-text-col">
                  ארוחות היום
                </h2>
                {meals.length > 0 && (
                  <span className="font-body text-sm tabular-nums text-muted">{meals.length}</span>
                )}
              </div>

              {meals.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-col px-6 py-10 text-center">
                  <p className="font-body text-sm leading-relaxed text-muted">
                    עוד לא רשמת ארוחות היום.
                    <br />
                    כל ארוחה שתוסיף תתעדכן ביעדים למעלה.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddMealOpen(true)}
                    className={`flex h-11 items-center gap-2 rounded-xl border border-lime/40 px-5 font-body text-sm font-medium text-lime transition-colors duration-200 hover:bg-lime-dim ${focusRing}`}
                  >
                    <Plus size={16} strokeWidth={2.25} />
                    הוסף ארוחה
                  </button>
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {meals.map((meal) => (
                    <li key={meal.id}>
                      <MealCard meal={meal} onEdit={setEditingMeal} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {/* FAB: thumb zone, above TabBar + iOS safe area */}
      <button
        type="button"
        onClick={() => setAddMealOpen(true)}
        aria-label="הוסף ארוחה"
        className={`fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-lime text-bg shadow-[0_8px_24px_-6px_rgba(215,255,0,0.45)] transition-transform duration-150 ease-out active:scale-95 [-webkit-tap-highlight-color:transparent] ${focusRing}`}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <AddMealModal isOpen={addMealOpen} onClose={() => setAddMealOpen(false)} />
      <AddMealModal
        isOpen={!!editingMeal}
        onClose={() => setEditingMeal(null)}
        initialMeal={editingMeal ?? undefined}
      />
      <EditGoalsModal isOpen={editGoalsOpen} onClose={() => setEditGoalsOpen(false)} />
    </>
  )
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="טוען" className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-2xl border border-border-col bg-surface p-4">
        <div className="h-3 w-20 rounded bg-surface2" />
        <div className="h-12 w-40 rounded bg-surface2" />
        <div className="h-2.5 w-full rounded-full bg-surface2" />
        <div className="h-1.5 w-full rounded-full bg-surface2" />
      </div>
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-border-col bg-surface" />
        ))}
      </div>
    </div>
  )
}
