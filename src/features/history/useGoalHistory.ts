import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { bb } from '../../lib/supabaseBodyBuddy'
import { todayLocal } from '../../lib/date'
import { useBbUserId } from '../nutrition/hooks'
import { useToast } from '../../shared/context/ToastContext'

/**
 * One row of BodyBuddy's nutrition_goals: a goal that applies from `from` until the next row.
 * Same table the app writes; one row per change, a second change on the same day overwrites that day.
 */
export interface GoalPeriod {
  from: string
  calories: number
  protein: number
  carbs: number
  fat: number
  isManual: boolean
  weight: number | null
  height: number | null
  age: number | null
  gender: string | null
  goal: string | null
  activityLevel: string | null
  calorieOffset: number | null
}

/** A goal clipped to a date range (e.g. one month) */
export interface GoalSpan {
  from: string
  to: string
  calories: number
  protein: number
}

const goalKey = (uid: string | undefined) => ['bb', 'goal-history', uid] as const

async function fetchGoalHistory(userId: string): Promise<GoalPeriod[]> {
  const { data, error } = await bb()
    .from('nutrition_goals')
    .select('effective_date, calories, protein, carbs, fat, is_manual_calories, weight, height, age, gender, goal, activity_level, calorie_offset')
    .eq('user_id', userId)
    .order('effective_date', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({
    from: r.effective_date as string,
    calories: r.calories as number,
    protein: r.protein as number,
    carbs: r.carbs as number,
    fat: r.fat as number,
    isManual: !!r.is_manual_calories,
    weight: r.weight as number | null,
    height: r.height as number | null,
    age: r.age as number | null,
    gender: r.gender as string | null,
    goal: r.goal as string | null,
    activityLevel: r.activity_level as string | null,
    calorieOffset: r.calorie_offset as number | null,
  }))
}

/** The user's goal history (oldest first), from BodyBuddy */
export function useGoalHistory() {
  const uid = useBbUserId()
  const q = useQuery({
    queryKey: goalKey(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchGoalHistory(uid!),
  })
  const history = q.data ?? []
  return { history, current: goalOn(history, todayLocal()), loading: q.isLoading }
}

/** Macro split the app uses for a manual calorie goal: fat 25% of calories, carbs = the rest */
export function splitMacros(calories: number, protein: number): { carbs: number; fat: number } {
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.max(0, Math.floor((calories - protein * 4 - fat * 9) / 4))
  return { carbs, fat }
}

/**
 * Save a manual goal effective today, like the app: a new row per change,
 * and a second change on the same day overwrites that day's row (unique user_id + effective_date).
 * Body/profile fields are carried from the previous goal; weight is the latest weigh-in.
 */
export function useSaveGoal() {
  const uid = useBbUserId()
  const qc = useQueryClient()
  const { showSuccess, showError } = useToast()
  return useMutation({
    mutationFn: async (input: { calories: number; protein: number; weight: number | null; previous: GoalPeriod | null }) => {
      if (!uid) throw new Error('לא מחובר ל-BodyBuddy')
      const { carbs, fat } = splitMacros(input.calories, input.protein)
      const p = input.previous
      const weight = input.weight ?? p?.weight ?? null
      const { error } = await bb()
        .from('nutrition_goals')
        .upsert({
          user_id: uid,
          effective_date: todayLocal(),
          calories: input.calories,
          protein: input.protein,
          carbs,
          fat,
          is_manual_calories: true,
          weight,
          protein_per_kg: weight ? Math.round((input.protein / weight) * 100) / 100 : null,
          height: p?.height ?? null,
          age: p?.age ?? null,
          gender: p?.gender ?? null,
          goal: p?.goal ?? null,
          activity_level: p?.activityLevel ?? null,
          calorie_offset: p?.calorieOffset ?? null,
          source: 'fitnesstracker',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,effective_date' })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bb', 'goal-history'] })
      showSuccess('היעד עודכן')
    },
    onError: () => showError('שגיאה בשמירת היעד'),
  })
}

/** The goal in effect on `date` (null before the first goal) */
export function goalOn(history: GoalPeriod[], date: string): GoalPeriod | null {
  let found: GoalPeriod | null = null
  for (const g of history) {
    if (g.from <= date) found = g
    else break
  }
  return found
}

function dayBefore(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(y!, m! - 1, d! - 1)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

/**
 * The goals that applied between `first` and `last` (inclusive), in order.
 * Consecutive rows with the same calories + protein are merged, so only real changes show.
 */
export function goalsInRange(history: GoalPeriod[], first: string, last: string): GoalSpan[] {
  const spans: GoalSpan[] = []
  history.forEach((g, i) => {
    const next = history[i + 1]
    const end = next ? dayBefore(next.from) : last
    const from = g.from > first ? g.from : first
    const to = end < last ? end : last
    if (from > to) return
    const prev = spans[spans.length - 1]
    if (prev && prev.calories === g.calories && prev.protein === g.protein) prev.to = to
    else spans.push({ from, to, calories: g.calories, protein: g.protein })
  })
  return spans
}
