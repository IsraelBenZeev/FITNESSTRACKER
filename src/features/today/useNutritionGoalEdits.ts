/**
 * Goal edits from the nutrition screen, like the app's NutritionScreen:
 * manual daily calories (or back to the automatic formula), protein per kg, and the carbs / fat bar visibility.
 * Each change writes the profile fields the app reads, plus today's row in nutrition_goals (the goal of record here).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bb } from '../../lib/supabaseBodyBuddy'
import { todayLocal } from '../../lib/date'
import { useBbUserId } from '../nutrition/hooks'
import { useToast } from '../../shared/context/ToastContext'
import { splitMacros, type GoalPeriod } from '../history/useGoalHistory'
import type { Profile } from '../profile/useProfileData'

export const DEFAULT_PROTEIN_PER_KG = 2

const TDEE_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
}
const GOAL_DIRECTION: Record<string, -1 | 0 | 1> = { cut: -1, bulk: 1, maintain: 0 }

export function ageFromProfile(p: Profile | null | undefined): number | null {
  if (p?.date_of_birth) {
    const dob = new Date(p.date_of_birth)
    if (!Number.isNaN(dob.getTime())) {
      const now = new Date()
      let age = now.getFullYear() - dob.getFullYear()
      if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--
      return age
    }
  }
  return p?.age ?? null
}

/** The app's automatic goal: Mifflin-St Jeor BMR × activity ± the chosen offset (null when data is missing) */
export function autoDailyCalories(p: Profile | null | undefined): number | null {
  const age = ageFromProfile(p)
  if (!p?.weight || !p.height || !age || !p.gender || !p.activity_level || !p.goal || p.calorie_offset == null) return null
  const mult = TDEE_MULTIPLIER[p.activity_level]
  const dir = GOAL_DIRECTION[p.goal]
  if (mult == null || dir == null || (p.gender !== 'male' && p.gender !== 'female')) return null
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * age + (p.gender === 'male' ? 5 : -161)
  return Math.round(bmr * mult) + dir * p.calorie_offset
}

interface GoalRowInput {
  calories: number
  protein: number
  isManual: boolean
  proteinPerKg: number | null
}

export function useNutritionGoalEdits(profile: Profile | null | undefined, current: GoalPeriod | null) {
  const uid = useBbUserId()
  const qc = useQueryClient()
  const { showSuccess, showError } = useToast()
  const weight = profile?.weight ?? current?.weight ?? null

  const updateProfile = async (fields: Partial<Profile>) => {
    const { error } = await bb().from('profiles').update(fields).eq('user_id', uid!)
    if (error) throw new Error(error.message)
  }

  const upsertGoal = async (g: GoalRowInput) => {
    const { carbs, fat } = splitMacros(g.calories, g.protein)
    const { error } = await bb()
      .from('nutrition_goals')
      .upsert({
        user_id: uid!,
        effective_date: todayLocal(),
        calories: g.calories,
        protein: g.protein,
        carbs,
        fat,
        is_manual_calories: g.isManual,
        weight,
        protein_per_kg: g.proteinPerKg,
        height: profile?.height ?? current?.height ?? null,
        age: ageFromProfile(profile) ?? current?.age ?? null,
        gender: profile?.gender ?? current?.gender ?? null,
        goal: profile?.goal ?? current?.goal ?? null,
        activity_level: profile?.activity_level ?? current?.activityLevel ?? null,
        calorie_offset: profile?.calorie_offset ?? current?.calorieOffset ?? null,
        source: 'fitnesstracker',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,effective_date' })
    if (error) throw new Error(error.message)
  }

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['bb', 'goal-history'] })
    void qc.invalidateQueries({ queryKey: ['bb', 'profile'] })
  }

  const proteinPerKg = profile?.protein_per_kg ?? DEFAULT_PROTEIN_PER_KG
  const currentProtein = current?.protein ?? (weight ? Math.round(weight * proteinPerKg) : 0)

  /** value = manual goal; null = back to the automatic formula */
  const setCalories = useMutation({
    mutationFn: async (value: number | null) => {
      if (!uid) throw new Error('not signed in')
      const calories = value ?? autoDailyCalories(profile)
      if (calories == null) throw new Error('missing profile data')
      await updateProfile({ manual_daily_calories: value })
      await upsertGoal({ calories, protein: currentProtein, isManual: value != null, proteinPerKg })
    },
    onSuccess: () => { refresh(); showSuccess('יעד הקלוריות עודכן') },
    onError: () => showError('שגיאה בשמירת היעד'),
  })

  const setProteinPerKg = useMutation({
    mutationFn: async (perKg: number) => {
      if (!uid) throw new Error('not signed in')
      if (!weight) throw new Error('missing weight')
      const calories = current?.calories ?? profile?.manual_daily_calories ?? autoDailyCalories(profile)
      if (calories == null) throw new Error('missing calories')
      await updateProfile({ protein_per_kg: perKg })
      await upsertGoal({ calories, protein: Math.round(weight * perKg), isManual: current?.isManual ?? true, proteinPerKg: perKg })
    },
    onSuccess: () => { refresh(); showSuccess('יעד החלבון עודכן') },
    onError: () => showError('שגיאה בשמירת היעד'),
  })

  /** Optimistic: the bar hides / shows at once, the profile is saved in the background */
  const setDisplay = useMutation({
    mutationFn: (fields: Pick<Partial<Profile>, 'show_carbs_bar' | 'show_fat_bar'>) => updateProfile(fields),
    onMutate: (fields) => {
      qc.setQueriesData<Profile | null>({ queryKey: ['bb', 'profile'] }, (old) => (old ? { ...old, ...fields } : old))
    },
    onError: () => { refresh(); showError('שגיאה בשמירת התצוגה') },
  })

  return { setCalories, setProteinPerKg, setDisplay, weight, proteinPerKg, canAuto: autoDailyCalories(profile) != null }
}
