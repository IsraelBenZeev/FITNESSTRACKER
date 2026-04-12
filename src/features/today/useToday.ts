import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { NutritionLog } from '../../types/nutrition'

interface Totals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface UseTodayResult {
  meals: NutritionLog[]
  totals: Totals
  loading: boolean
  error: string | null
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

export function useToday(): UseTodayResult {
  const today = todayDateString()

  const { data: meals = [], isLoading, error } = useQuery({
    queryKey: ['nutrition', 'today', today],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('nutrition_log')
        .select('*')
        .eq('date', today)
        .order('time', { ascending: true })
      if (err) throw new Error(err.message)
      return (data ?? []) as NutritionLog[]
    },
  })

  const totals: Totals = useMemo(
    () =>
      meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories ?? 0),
          protein: acc.protein + (meal.protein_g ?? 0),
          carbs: acc.carbs + (meal.carbs_g ?? 0),
          fat: acc.fat + (meal.fat_g ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [meals]
  )

  return { meals, totals, loading: isLoading, error: error ? (error as Error).message : null }
}
