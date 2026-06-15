import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import type { DayTotals, NutritionLog } from '../../types/nutrition'
import { getDaysInMonth, localDateStr } from './calendarUtils'

interface UseHistoryResult {
  days: DayTotals[]
  loading: boolean
  error: string | null
}

export function useHistory(daysBack = 14): UseHistoryResult {
  const { user } = useAuth()
  const userId = user?.id

  const { data: days = [], isLoading, error } = useQuery({
    queryKey: ['nutrition', 'history', daysBack, userId],
    enabled: !!userId,
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - daysBack)
      const sinceStr = since.toISOString().split('T')[0]

      const { data, error: err } = await supabase
        .from('nutrition_log')
        .select('date, calories, protein_g, carbs_g, fat_g')
        .gte('date', sinceStr)
        .order('date', { ascending: true })

      if (err) throw new Error(err.message)

      const map = new Map<string, DayTotals>()
      for (const row of data ?? []) {
        const existing = map.get(row.date) ?? {
          date: row.date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }
        map.set(row.date, {
          ...existing,
          calories: existing.calories + (row.calories ?? 0),
          protein: existing.protein + (row.protein_g ?? 0),
          carbs: existing.carbs + (row.carbs_g ?? 0),
          fat: existing.fat + (row.fat_g ?? 0),
        })
      }
      return Array.from(map.values())
    },
  })

  return { days, loading: isLoading, error: error ? (error as Error).message : null }
}

interface UseCalendarMonthResult {
  dayMap: Map<string, DayTotals>
  loading: boolean
}

export function useCalendarMonth(year: number, month: number): UseCalendarMonthResult {
  const { user } = useAuth()
  const userId = user?.id
  const firstDay = localDateStr(year, month, 1)
  const lastDay = localDateStr(year, month, getDaysInMonth(year, month))

  const { data: dayMap = new Map(), isLoading } = useQuery({
    queryKey: ['nutrition', 'calendar', year, month, userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('nutrition_log')
        .select('date, calories, protein_g, carbs_g, fat_g')
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date', { ascending: true })

      if (err) throw new Error(err.message)

      const map = new Map<string, DayTotals>()
      for (const row of data ?? []) {
        const existing = map.get(row.date) ?? { date: row.date, calories: 0, protein: 0, carbs: 0, fat: 0 }
        map.set(row.date, {
          ...existing,
          calories: existing.calories + (row.calories ?? 0),
          protein: existing.protein + (row.protein_g ?? 0),
          carbs: existing.carbs + (row.carbs_g ?? 0),
          fat: existing.fat + (row.fat_g ?? 0),
        })
      }
      return map
    },
  })

  return { dayMap, loading: isLoading }
}

interface UseDayMealsResult {
  meals: NutritionLog[]
  loading: boolean
}

export async function fetchNutritionForExport(
  sinceDate: string | null,
  untilDate?: string | null,
): Promise<NutritionLog[]> {
  let query = supabase
    .from('nutrition_log')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (sinceDate != null) query = query.gte('date', sinceDate)
  if (untilDate != null) query = query.lte('date', untilDate)

  const { data, error: err } = await query
  if (err) throw new Error(err.message)
  return (data ?? []) as NutritionLog[]
}

export function useDayMeals(date: string | null): UseDayMealsResult {
  const { user } = useAuth()
  const userId = user?.id

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ['nutrition', 'day', date, userId],
    enabled: !!date && !!userId,
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('nutrition_log')
        .select('*')
        .eq('date', date!)
        .order('time', { ascending: true })

      if (err) throw new Error(err.message)
      return (data ?? []) as NutritionLog[]
    },
  })

  return { meals, loading: isLoading }
}
