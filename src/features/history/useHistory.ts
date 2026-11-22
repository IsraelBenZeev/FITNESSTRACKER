import { useMemo } from 'react'
import type { DayTotals, NutritionLog } from '../../types/nutrition'
import { getDaysInMonth, localDateStr } from './calendarUtils'
import { daysAgoLocal, todayLocal, toLocalDateStr } from '../../lib/date'
import { useMealGroups } from '../nutrition/hooks'
import { fetchEntries } from '../nutrition/api'
import { groupEntries, groupToLog } from '../nutrition/foodMath'
import { supabaseBodyBuddy } from '../../lib/supabaseBodyBuddy'
import type { MealGroup, NutritionEntry } from '../nutrition/types'

/** Day totals from entries. BodyBuddy has no per-day goal snapshot → goals fall back to the configured goals */
function toDayMap(entries: NutritionEntry[]): Map<string, DayTotals> {
  const map = new Map<string, DayTotals>()
  for (const e of entries) {
    const d = map.get(e.date) ?? { date: e.date, calories: 0, protein: 0, carbs: 0, fat: 0 }
    d.calories += e.calories
    d.protein += e.protein
    d.carbs += e.carbs
    d.fat += e.fat
    map.set(e.date, d)
  }
  return map
}

interface UseHistoryResult {
  days: DayTotals[]
  loading: boolean
  error: string | null
}

export function useHistory(daysBack = 14): UseHistoryResult {
  const { entries, loading, error } = useMealGroups(daysAgoLocal(daysBack), todayLocal())
  const days = useMemo(() => [...toDayMap(entries).values()], [entries])
  return { days, loading, error }
}

/**
 * A month's days. Also loads the neighbouring days that share its first/last week,
 * so a week that crosses months averages over all 7 days (`weekDayMap`).
 * `dayMap` holds only the month's own days (month stats, calendar colors).
 */
export function useCalendarMonth(year: number, month: number): { dayMap: Map<string, DayTotals>; weekDayMap: Map<string, DayTotals>; loading: boolean } {
  const firstDay = localDateStr(year, month, 1)
  const lastDay = localDateStr(year, month, getDaysInMonth(year, month))
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month - 1, getDaysInMonth(year, month))
  const weekStart = toLocalDateStr(new Date(year, month - 1, 1 - first.getDay()))
  const weekEnd = toLocalDateStr(new Date(year, month - 1, last.getDate() + (6 - last.getDay())))
  const { entries, loading } = useMealGroups(weekStart, weekEnd)
  const weekDayMap = useMemo(() => toDayMap(entries), [entries])
  const dayMap = useMemo(
    () => new Map([...weekDayMap].filter(([d]) => d >= firstDay && d <= lastDay)),
    [weekDayMap, firstDay, lastDay],
  )
  return { dayMap, weekDayMap, loading }
}

/** Export: one row per meal (group) in the legacy shape the PDF/JSON exporters use */
export async function fetchNutritionForExport(sinceDate: string | null, untilDate?: string | null): Promise<NutritionLog[]> {
  const { data } = (await supabaseBodyBuddy?.auth.getUser()) ?? { data: { user: null } }
  if (!data.user) throw new Error('לא מחובר ל-BodyBuddy')
  const entries = await fetchEntries(data.user.id, sinceDate, untilDate ?? null)
  return groupEntries(entries).map(groupToLog)
}

export function useDayMeals(date: string | null): { meals: NutritionLog[]; groups: MealGroup[]; loading: boolean } {
  const { groups, loading } = useMealGroups(date, date, !!date)
  const meals = useMemo(() => groups.map(groupToLog), [groups])
  return { meals, groups, loading }
}
