import { useMemo } from 'react'
import type { NutritionLog } from '../../types/nutrition'
import { todayLocal } from '../../lib/date'
import { useMealGroups } from '../nutrition/hooks'
import { groupToLog } from '../nutrition/foodMath'
import type { MealGroup } from '../nutrition/types'

interface Totals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface UseTodayResult {
  /** Today's meals (BodyBuddy meal groups) in the timeline's card shape */
  meals: NutritionLog[]
  groups: MealGroup[]
  totals: Totals
  loading: boolean
  error: string | null
}

export function useToday(): UseTodayResult {
  const today = todayLocal()
  const { groups, loading, error } = useMealGroups(today, today)

  const meals = useMemo(() => groups.map(groupToLog), [groups])
  const totals: Totals = useMemo(
    () =>
      groups.reduce(
        (acc, g) => ({ calories: acc.calories + g.calories, protein: acc.protein + g.protein, carbs: acc.carbs + g.carbs, fat: acc.fat + g.fat }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [groups],
  )

  return { meals, groups, totals, loading, error }
}
