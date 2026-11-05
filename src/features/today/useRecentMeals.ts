import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export interface RecentMeal {
  meal_name: string
  food_items: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

/**
 * Distinct recently logged meals (by what was eaten + calories), newest first.
 * Powers one-tap "log it again".
 */
export function useRecentMeals(enabled: boolean, limit = 8) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['nutrition', 'recent', userId, limit],
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RecentMeal[]> => {
      const { data, error } = await supabase
        .from('nutrition_log')
        .select('meal_name, food_items, calories, protein_g, carbs_g, fat_g, created_at')
        .not('food_items', 'is', null)
        .order('created_at', { ascending: false })
        .limit(80)
      if (error) throw new Error(error.message)

      const seen = new Set<string>()
      const out: RecentMeal[] = []
      for (const r of data ?? []) {
        const food = (r.food_items as string | null)?.trim()
        if (!food) continue
        const key = `${food.toLowerCase()}|${r.calories}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({
          meal_name: r.meal_name,
          food_items: food,
          calories: r.calories ?? 0,
          protein_g: Math.round(Number(r.protein_g ?? 0)),
          carbs_g: Math.round(Number(r.carbs_g ?? 0)),
          fat_g: Math.round(Number(r.fat_g ?? 0)),
        })
        if (out.length >= limit) break
      }
      return out
    },
  })
}
