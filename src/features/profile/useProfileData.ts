/**
 * Data behind the profile screen — the app's useProfile, useAICredits, useDeleteAccount, useWeeklyProgress,
 * useNutritionTotalsInRange and the custom-exercise hooks (BodyBuddy-Client/src/hooks + service).
 */
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bb } from '../../lib/supabaseBodyBuddy'
import { authedServerFetch, UPLOAD_TIMEOUT_MS } from '../../lib/bodyBuddyServer'
import { toLocalDateStr } from '../../lib/date'
import { triggerFeedback } from '../../store/uiStore'
import { useBbUserId } from '../nutrition/hooks'
import { useArchivedPlans, usePlans, useWorkoutStats } from '../workouts/hooks'
import { draftStore } from '../workouts/draftStore'
import { DAY_LETTERS } from '../workouts/types'
import type { InputField } from '../workouts/types'

// ---------- profile ----------

export interface Profile {
  user_id: string
  full_name: string | null
  age: number | null
  date_of_birth: string | null
  height: number | null
  weight: number | null
  gender: string | null
  activity_level: string | null
  goal: string | null
  avatar_url: string | null
  calorie_offset?: number | null
  manual_daily_calories?: number | null
  protein_per_kg?: number | null
  show_carbs_bar?: boolean | null
  show_fat_bar?: boolean | null
}

export const GENDER_LABELS: Record<string, string> = { male: 'זכר', female: 'נקבה' }
export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'יושבני' },
  { value: 'lightly_active', label: 'פעילות קלה' },
  { value: 'moderately_active', label: 'פעילות בינונית' },
  { value: 'very_active', label: 'פעילות גבוהה' },
  { value: 'extra_active', label: 'פעילות אינטנסיבית' },
] as const

export function useProfile() {
  const uid = useBbUserId()
  return useQuery({
    queryKey: ['bb', 'profile', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await bb().from('profiles').select('*').eq('user_id', uid!).maybeSingle()
      if (error) throw error
      return data as Profile | null
    },
  })
}

// ---------- AI credits ----------

export interface AICredits { balance: number; dailyAllowance: number; costPerAnalysis: number; nextResetAt: string }

/** The balance resets on the server at 07:00, so it reloads on every visit */
export function useAICredits() {
  const uid = useBbUserId()
  return useQuery({
    queryKey: ['bb', 'ai-credits', uid],
    enabled: !!uid,
    staleTime: 30_000,
    refetchOnMount: 'always',
    queryFn: async (): Promise<AICredits> => {
      const { data, error } = await bb().rpc('get_my_ai_credits')
      if (error) throw error
      const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>
      return {
        balance: Number(row?.balance ?? 0),
        dailyAllowance: Number(row?.daily_allowance ?? 25),
        costPerAnalysis: Number(row?.cost_per_analysis ?? 5),
        nextResetAt: String(row?.next_reset_at ?? ''),
      }
    },
  })
}

export const aiCreditsInfo = (c: AICredits | undefined) =>
  `כל ניתוח של מאכל או ארוחה צורך ${c?.costPerAnalysis ?? 5} קרדיטים מחשבונך. הקרדיטים מתאפסים ל-${c?.dailyAllowance ?? 25} כל יום בשעה 07:00 בבוקר.`

export const aiCreditsCaption = (c: AICredits) => {
  const left = Math.floor(c.balance / c.costPerAnalysis)
  const leftText = left === 0 ? 'לא נותרו ניתוחים' : left === 1 ? 'נותר ניתוח אחד' : `נותרו ${left} ניתוחים`
  const reset = new Date(c.nextResetAt)
  const isToday = !Number.isNaN(reset.getTime()) && reset.toDateString() === new Date().toDateString()
  return `${leftText} · מתחדש ${isToday ? 'היום' : 'מחר'} ב-07:00`
}

// ---------- delete account ----------

/** Deletes the account and all its data on the server (irreversible), then signs out here */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const res = await authedServerFetch('/account/me', { method: 'DELETE' })
      if (!res.ok) throw new Error(`deleteAccount ${res.status}`)
    },
    onSuccess: async () => {
      draftStore.clearDraft()
      await bb().auth.signOut({ scope: 'local' })
    },
  })
}

// ---------- weekly workouts ----------

export interface WeeklyWorkoutItem {
  id: string
  name: string
  dayLabel: string
  dayIndex: number
  dateLabel: string
  minutes: number
  status: 'done' | 'pending'
  /** Done on a day the plan didn't schedule: all of the plan's days (0 = Sunday) */
  plannedDays?: number[]
  isArchived?: boolean
}

const DAY_LABELS = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת']
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
/** What the ring shows when no plan has days set */
const DEFAULT_PLANNED = 5

export const weekStartOf = (date: Date) => {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}
const dayMonth = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}`

/**
 * This week vs. the user's plans (hooks/useWeeklyProgress.ts): workouts done, planned days still pending,
 * the adherence estimate, and plans trained more than planned.
 */
export function useWeeklyProgress() {
  const { data: rawStats } = useWorkoutStats()
  const { data: plans } = usePlans()
  const { data: archived } = useArchivedPlans()

  return useMemo(() => {
    const weekSessions = (rawStats?.week_sessions ?? []).map((s) => ({
      id: s.id ?? s.started_at,
      planId: s.workout_plan_id,
      startedAt: s.started_at,
      minutes: Math.round((s.total_time ?? 0) / 60),
    }))
    const weeklySeconds = (rawStats?.week_sessions ?? []).reduce((sum, s) => sum + (s.total_time ?? 0), 0)
    const activePlans = plans ?? []
    const weekStart = weekStartOf(new Date())

    const slots = activePlans.flatMap((p) =>
      (p.days_per_week ?? []).map((l) => DAY_LETTERS.indexOf(l)).filter((d) => d >= 0).map((dayIndex) => ({ planId: p.id, title: p.title, minutes: p.time ?? 0, dayIndex })),
    )
    const titleById = new Map([...activePlans, ...(archived ?? [])].map((p) => [p.id, p.title]))
    const archivedIds = new Set((archived ?? []).map((p) => p.id))

    // Sessions claim planned days per plan: same day first, then the nearest free planned day; the rest are extra
    const plannedDaysByPlan = new Map<string, number[]>()
    const pending: typeof slots = []
    const overPlanned: { name: string; done: number; planned: number }[] = []
    activePlans.forEach((plan) => {
      const free = slots.filter((s) => s.planId === plan.id).map((s) => s.dayIndex)
      const plannedCount = free.length
      plannedDaysByPlan.set(plan.id, [...free].sort((a, b) => a - b))
      const planSessions = weekSessions.filter((s) => s.planId === plan.id)
      const offDay = planSessions.filter((s) => {
        const i = free.indexOf(new Date(s.startedAt).getDay())
        if (i < 0) return true
        free.splice(i, 1)
        return false
      })
      offDay.forEach((s) => {
        if (!free.length) return
        const day = new Date(s.startedAt).getDay()
        const nearest = free.reduce((best, d) => (Math.abs(d - day) < Math.abs(best - day) ? d : best))
        free.splice(free.indexOf(nearest), 1)
      })
      free.forEach((dayIndex) => pending.push({ planId: plan.id, title: plan.title, minutes: plan.time ?? 0, dayIndex }))
      if (plannedCount > 0 && planSessions.length > plannedCount) overPlanned.push({ name: plan.title, done: planSessions.length, planned: plannedCount })
    })

    const done = weekSessions.map((s) => {
      const date = new Date(s.startedAt)
      const plannedDays = plannedDaysByPlan.get(s.planId)
      const offPlan = !!plannedDays?.length && !plannedDays.includes(date.getDay())
      return {
        id: s.id,
        name: titleById.get(s.planId) ?? 'אימון',
        dayLabel: DAY_LABELS[date.getDay()]!,
        dayIndex: date.getDay(),
        dateLabel: dayMonth(date),
        minutes: s.minutes,
        status: 'done' as const,
        plannedDays: offPlan ? plannedDays : undefined,
        isArchived: archivedIds.has(s.planId),
        ts: date.getTime(),
      }
    })

    const archivedCount = new Map<string, number>()
    done.forEach((d) => { if (d.isArchived) archivedCount.set(d.name, (archivedCount.get(d.name) ?? 0) + 1) })

    const pendingItems = pending.map((slot) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + slot.dayIndex)
      return {
        id: `${slot.planId}-${slot.dayIndex}`,
        name: slot.title,
        dayLabel: DAY_LABELS[slot.dayIndex]!,
        dayIndex: slot.dayIndex,
        dateLabel: dayMonth(date),
        minutes: slot.minutes,
        status: 'pending' as const,
        ts: date.getTime(),
      }
    })

    const workouts: WeeklyWorkoutItem[] = [...done, ...pendingItems].sort((a, b) => a.ts - b.ts).map(({ ts: _ts, ...w }) => w)

    let adherencePercent: number | null = null
    let totalPlannedCount: number | null = null
    if (slots.length > 0 && rawStats?.first_session_at) {
      const firstWeek = weekStartOf(new Date(rawStats.first_session_at))
      const weeks = Math.round((weekStart.getTime() - firstWeek.getTime()) / MS_PER_WEEK) + 1
      totalPlannedCount = slots.length * weeks
      adherencePercent = Math.min(100, Math.round(((rawStats.total_count ?? 0) / totalPlannedCount) * 100))
    }

    return {
      loaded: !!rawStats,
      workouts,
      plannedThisWeek: slots.length > 0 ? slots.length : DEFAULT_PLANNED,
      completedThisWeek: weekSessions.length,
      weeklyMinutes: Math.floor(weeklySeconds / 60),
      streak: rawStats?.streak ?? 0,
      totalCount: rawStats?.total_count ?? 0,
      overPlanned,
      archivedThisWeek: [...archivedCount].map(([name, n]) => ({ name, done: n })),
      adherencePercent,
      totalPlannedCount,
    }
  }, [rawStats, plans, archived])
}

// ---------- weekly nutrition ----------

/** Calories + protein per day in a date range (nutritionService.getNutritionTotalsInRange) */
export function useNutritionTotals(from: string, to: string) {
  const uid = useBbUserId()
  return useQuery({
    queryKey: ['bb', 'nutrition-totals', uid, from, to],
    enabled: !!uid,
    staleTime: 60_000,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await bb().from('nutrition_entries').select('date, calories, protein').eq('user_id', uid!).gte('date', from).lte('date', to)
      if (error) throw error
      const byDate = new Map<string, { calories: number; protein: number }>()
      for (const r of data ?? []) {
        const cur = byDate.get(r.date as string) ?? { calories: 0, protein: 0 }
        cur.calories += Number(r.calories ?? 0)
        cur.protein += Number(r.protein ?? 0)
        byDate.set(r.date as string, cur)
      }
      return byDate
    },
  })
}

export const addDaysLocal = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return toLocalDateStr(x)
}

// ---------- custom exercises ----------

export interface CustomExercise {
  id: string
  user_id: string
  name: string
  body_part: string
  equipment: string | null
  target_muscle: string | null
  home_friendly: boolean
  instructions: string[]
  image_urls: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  input_fields: InputField[]
}

export type CustomExercisePayload = Pick<CustomExercise, 'name' | 'body_part' | 'equipment' | 'target_muscle' | 'home_friendly' | 'instructions' | 'image_urls' | 'input_fields'>

const ceKey = (uid: string | undefined) => ['bb', 'custom-exercises', uid] as const

function useCustomList(active: boolean) {
  const uid = useBbUserId()
  return useQuery({
    queryKey: [...ceKey(uid), active ? 'active' : 'deleted'],
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await bb()
        .from('user_custom_exercises')
        .select('*')
        .eq('user_id', uid!)
        .eq('is_active', active)
        .order(active ? 'created_at' : 'updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as CustomExercise[]
    },
  })
}
export const useCustomExercises = () => useCustomList(true)
export const useDeletedCustomExercises = () => useCustomList(false)

/** Refreshes everything a custom exercise shows up in (lists, picker, plans, history) */
function useInvalidateCustom() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['bb', 'custom-exercises'] })
    void qc.invalidateQueries({ queryKey: ['bb', 'picker'] })
    void qc.invalidateQueries({ queryKey: ['bb', 'wk'] })
  }
}

export function useSetCustomExerciseActive() {
  const uid = useBbUserId()
  const invalidate = useInvalidateCustom()
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await bb().from('user_custom_exercises').update({ is_active: active }).eq('id', id).eq('user_id', uid!)
      if (error) throw error
    },
    onSuccess: (_d, { active }) => { invalidate(); triggerFeedback(active ? 'התרגיל שוחזר' : 'התרגיל נמחק', 'success') },
    onError: (_e, { active }) => triggerFeedback(active ? 'שגיאה בשחזור התרגיל' : 'שגיאה במחיקת התרגיל', 'failed'),
  })
}

/** Permanent delete on the server: removes it from plans, its sets from history, favorites and its images */
export function usePurgeCustomExercise() {
  const invalidate = useInvalidateCustom()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authedServerFetch(`/custom-exercises/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`purge ${res.status}`)
    },
    onSuccess: () => { invalidate(); triggerFeedback('התרגיל נמחק', 'success') },
    onError: () => triggerFeedback('שגיאה במחיקת התרגיל', 'failed'),
  })
}

/** Uploads picked images through the server (which stores them on Cloudinary) and returns their URLs, in order */
export async function uploadCustomExerciseImages(files: File[]): Promise<string[]> {
  if (!files.length) return []
  const form = new FormData()
  files.forEach((f, i) => form.append('images', f, f.name || `exercise-${i}.jpg`))
  const res = await authedServerFetch('/uploads/custom-exercise-images', { method: 'POST', body: form }, UPLOAD_TIMEOUT_MS)
  if (!res.ok) throw new Error(`upload ${res.status}`)
  const body = (await res.json()) as { urls: string[] }
  return body.urls
}

export function useSaveCustomExercise() {
  const uid = useBbUserId()
  const invalidate = useInvalidateCustom()
  return useMutation({
    mutationFn: async ({ id, payload, removedImageUrls = [] }: { id?: string; payload: CustomExercisePayload; removedImageUrls?: string[] }) => {
      if (id) {
        const { error } = await bb().from('user_custom_exercises').update(payload).eq('id', id).eq('user_id', uid!)
        if (error) throw error
        // Images taken out of the exercise are cleaned up on the server; a failure here doesn't fail the save
        if (removedImageUrls.length) {
          void authedServerFetch('/custom-exercises/images/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: removedImageUrls }),
          }).catch(() => {})
        }
      } else {
        const { error } = await bb().from('user_custom_exercises').insert({ ...payload, user_id: uid! })
        if (error) throw error
      }
    },
    onSuccess: (_d, { id }) => { invalidate(); triggerFeedback(id ? 'התרגיל עודכן בהצלחה' : 'התרגיל נוסף בהצלחה', 'success') },
    onError: (_e, { id }) => triggerFeedback(id ? 'שגיאה בעדכון התרגיל' : 'שגיאה בהוספת התרגיל', 'failed'),
  })
}
