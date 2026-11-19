import { useState } from 'react'
import { useToday } from './useToday'
import { useGoals } from '../../lib/useGoals'
import { DailySummary } from './DailySummary'
import { DayTimeline } from './DayTimeline'
import { QuickAddDock, suggestedMeal } from './QuickAddDock'
import { AddFoodSheet } from '../nutrition/AddFoodSheet'
import { MealGroupSheet } from '../nutrition/MealGroupSheet'
import { AccountMismatchBanner } from '../nutrition/ConnectBodyBuddy'
import { EditGoalsModal } from './EditGoalsModal'
import type { NutritionLog } from '../../types/nutrition'
import type { MealGroup } from '../nutrition/types'

export function TodayPage() {
  const { meals, groups, totals, loading } = useToday()
  const { goalCalories, goalProtein, isTrainingDay } = useGoals()
  const [addMealName, setAddMealName] = useState<string | null>(null)
  const [editGoalsOpen, setEditGoalsOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<MealGroup | null>(null)
  const [appendTo, setAppendTo] = useState<MealGroup | null>(null)
  const selectMeal = (m: NutritionLog) => setOpenGroup(groups.find((g) => g.key === m.id) ?? null)

  return (
    <>
      {/* pb: dock (~68px) above the TabBar padding <main> already reserves */}
      <div className="flex flex-col gap-7 px-4 pb-24 pt-4">
        <AccountMismatchBanner />
        {loading ? (
          <TodaySkeleton />
        ) : (
          <>
            <DailySummary
              totals={totals}
              goalCalories={goalCalories}
              goalProtein={goalProtein}
              isTrainingDay={isTrainingDay}
              onEditGoals={() => setEditGoalsOpen(true)}
            />

            <section aria-labelledby="day-heading" className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <h2 id="day-heading" className="font-body text-base font-medium text-text-col">
                  היום שלך
                </h2>
                {meals.length > 0 && (
                  <span className="font-body text-sm tabular-nums text-muted">
                    {meals.length === 1 ? 'ארוחה אחת' : `${meals.length} ארוחות`}
                  </span>
                )}
              </div>

              {meals.length === 0 ? (
                <div className="flex flex-col gap-1 rounded-2xl border border-dashed border-border-col px-5 py-8 text-center">
                  <p className="font-body text-[15px] text-text-col">עוד לא רשמת ארוחות היום</p>
                  <p className="font-body text-sm text-muted">בחר סוג ארוחה בסרגל למטה כדי להתחיל</p>
                </div>
              ) : (
                <DayTimeline meals={meals} onSelect={selectMeal} />
              )}
            </section>
          </>
        )}
      </div>

      <QuickAddDock onAdd={setAddMealName} />

      <AddFoodSheet
        isOpen={addMealName != null || appendTo != null}
        onClose={() => { setAddMealName(null); setAppendTo(null) }}
        presetMealName={addMealName ?? suggestedMeal()}
        appendTo={appendTo && appendTo.groupId ? { groupId: appendTo.groupId, groupName: appendTo.name, date: appendTo.date, calories: appendTo.calories, protein: appendTo.protein } : undefined}
        dayTotals={{ calories: totals.calories, protein: totals.protein }}
      />
      <MealGroupSheet
        group={openGroup && (groups.find((g) => g.key === openGroup.key) ?? null)}
        onClose={() => setOpenGroup(null)}
        onAddMore={(g) => { setOpenGroup(null); setAppendTo(g) }}
      />
      <EditGoalsModal isOpen={editGoalsOpen} onClose={() => setEditGoalsOpen(false)} />
    </>
  )
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="טוען" className="flex animate-pulse flex-col gap-7">
      <div className="flex flex-col gap-5 rounded-2xl border border-border-col bg-surface p-4">
        <div className="h-3 w-28 rounded bg-surface2" />
        <div className="h-10 w-56 rounded bg-surface2" />
        <div className="h-2.5 w-full rounded-full bg-surface2" />
        <div className="h-1.5 w-full rounded-full bg-surface2" />
      </div>
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-11 rounded bg-surface2" />
            <div className="h-9 w-9 rounded-full bg-surface2" />
            <div className="h-12 flex-1 rounded-lg bg-surface2" />
          </div>
        ))}
      </div>
    </div>
  )
}
