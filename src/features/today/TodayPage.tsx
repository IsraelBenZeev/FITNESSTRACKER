import { useState } from 'react'
import { useToday } from './useToday'
import { useGoalHistory, splitMacros } from '../history/useGoalHistory'
import { useProfile } from '../profile/useProfileData'
import { GOAL_CALORIES, GOAL_PROTEIN } from '../../lib/constants'
import { useNutritionGoalEdits } from './useNutritionGoalEdits'
import {
  GoalInfoCard, HiddenMacrosChips, MacroBar, MacroRingCard, ManualCaloriesDialog, ManualProteinDialog, MotivationCard,
  motivationMessage, type MacroKey,
} from './NutritionGoalCards'
import { DayTimeline } from './DayTimeline'
import { AddOptionsFab } from '../nutrition/AddOptionsFab'
import { AddFoodFlow } from '../nutrition/AddFoodFlow'
import { MyListSheet, type MyListTab } from '../nutrition/MyListSheet'
import { MealBuilderSheet } from '../nutrition/MealBuilderSheet'
import { MealGroupSheet } from '../nutrition/MealGroupSheet'
import type { NutritionLog } from '../../types/nutrition'
import type { MealGroup } from '../nutrition/types'

export function TodayPage() {
  const { meals, groups, totals, loading } = useToday()
  const { current } = useGoalHistory()
  const { data: profile } = useProfile()
  const edits = useNutritionGoalEdits(profile, current)
  const [caloriesOpen, setCaloriesOpen] = useState(false)
  const [proteinOpen, setProteinOpen] = useState(false)

  // Goal of record (nutrition_goals); the constants only until a goal exists
  const goalCalories = current?.calories ?? GOAL_CALORIES
  const goalProtein = current?.protein ?? GOAL_PROTEIN
  const split = splitMacros(goalCalories, goalProtein)
  const goalCarbs = current?.carbs ?? split.carbs
  const goalFat = current?.fat ?? split.fat
  const isManualCalories = profile?.manual_daily_calories != null || (current?.isManual ?? false)

  const progress = goalCalories > 0 ? Math.min(100, Math.round((totals.calories / goalCalories) * 100)) : 0
  const motivation = motivationMessage(goalCalories - totals.calories, progress)

  const showCarbs = profile?.show_carbs_bar ?? true
  const showFat = profile?.show_fat_bar ?? true
  const setShown = (m: MacroKey, shown: boolean) => edits.setDisplay.mutate(m === 'carbs' ? { show_carbs_bar: shown } : { show_fat_bar: shown })
  const hidden: MacroKey[] = [...(showCarbs ? [] : ['carbs' as const]), ...(showFat ? [] : ['fat' as const])]
  const [openGroup, setOpenGroup] = useState<MealGroup | null>(null)
  // The app's add flow: "מאכל" → food search; "ארוחה" → my meals; both reach my list and the meal builder
  const [foodFlowOpen, setFoodFlowOpen] = useState(false)
  const [myList, setMyList] = useState<{ tab: MyListTab; overSearch: boolean } | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const closeAll = () => { setFoodFlowOpen(false); setMyList(null); setBuilderOpen(false) }
  const selectMeal = (m: NutritionLog) => setOpenGroup(groups.find((g) => g.key === m.id) ?? null)

  return (
    <>
      {/* pb: room for the + button above the TabBar */}
      <div className="flex flex-col gap-7 px-4 pb-32 pt-4">
        {loading ? (
          <TodaySkeleton />
        ) : (
          <>
            {/* The app's nutrition screen: title, motivation line, protein / calories ring, carbs / fat bars, how we calculate */}
            <div className="rounded-3xl bg-background-950 px-5 py-6 shadow-md shadow-black">
              <div className="mb-8 mt-2">
                <h1 className="typo-h1 mb-2 text-heading">תזונה</h1>
                <span aria-hidden className="block h-[5px] w-[60px] rounded-[10px] bg-lime-500" />
              </div>

              <MotivationCard content={motivation} progress={progress} />
              <MacroRingCard
                proteinConsumed={totals.protein}
                proteinGoal={goalProtein}
                caloriesConsumed={totals.calories}
                caloriesGoal={goalCalories}
                isManualCalories={isManualCalories}
                onEditCalories={() => setCaloriesOpen(true)}
                onEditProtein={() => setProteinOpen(true)}
              />
              {showCarbs && <MacroBar macro="carbs" consumed={totals.carbs} goal={goalCarbs} onHide={() => setShown('carbs', false)} />}
              {showFat && <MacroBar macro="fat" consumed={totals.fat} goal={goalFat} onHide={() => setShown('fat', false)} />}
              <HiddenMacrosChips hidden={hidden} onShow={(m) => setShown(m, true)} />
              <GoalInfoCard proteinPerKg={edits.proteinPerKg} weight={edits.weight} isManualCalories={isManualCalories} />
            </div>

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
                  <p className="font-body text-sm text-muted">לחץ על + כדי להוסיף מאכל או ארוחה</p>
                </div>
              ) : (
                <DayTimeline meals={meals} onSelect={selectMeal} />
              )}
            </section>
          </>
        )}
      </div>

      <AddOptionsFab onAddFood={() => setFoodFlowOpen(true)} onAddMeal={() => setMyList({ tab: 'meals', overSearch: false })} />

      <AddFoodFlow
        isOpen={foodFlowOpen}
        onClose={closeAll}
        mode="standalone"
        level={1}
        onOpenMyList={() => setMyList({ tab: 'foods', overSearch: true })}
      />
      <MyListSheet
        isOpen={myList != null}
        initialTab={myList?.tab ?? 'foods'}
        level={myList?.overSearch ? 2 : 1}
        onClose={() => setMyList(null)}
        onDone={closeAll}
        // Opened from the search: just go back to it. Opened from "ארוחה": open the search
        onAddNewFood={() => { setMyList(null); setFoodFlowOpen(true) }}
        onCreateMeal={() => { closeAll(); setBuilderOpen(true) }}
      />
      <ManualCaloriesDialog
        open={caloriesOpen}
        initialValue={goalCalories}
        isManual={isManualCalories}
        canReset={edits.canAuto}
        saving={edits.setCalories.isPending}
        onClose={() => setCaloriesOpen(false)}
        onSave={(v) => edits.setCalories.mutate(v, { onSuccess: () => setCaloriesOpen(false) })}
        onReset={() => edits.setCalories.mutate(null, { onSuccess: () => setCaloriesOpen(false) })}
      />
      <ManualProteinDialog
        open={proteinOpen}
        initialValue={edits.proteinPerKg}
        weight={edits.weight}
        saving={edits.setProteinPerKg.isPending}
        onClose={() => setProteinOpen(false)}
        onSave={(v) => edits.setProteinPerKg.mutate(v, { onSuccess: () => setProteinOpen(false) })}
      />
      <MealBuilderSheet isOpen={builderOpen} onClose={() => setBuilderOpen(false)} />
      <MealGroupSheet
        group={openGroup && (groups.find((g) => g.key === openGroup.key) ?? null)}
        onClose={() => setOpenGroup(null)}
      />
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
