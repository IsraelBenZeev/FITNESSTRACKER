/**
 * BodyBuddy workout data — same tables, queries and RPCs as BodyBuddy-Client
 * (service/workoutService.ts, sessionService.ts, exercisesService.ts, customExercisesService.ts).
 */
import { bb } from '../../lib/supabaseBodyBuddy'
import type { Exercise, ExerciseProgress, ExerciseSet, InputField, Plan, Session, WorkoutStats } from './types'

export const CUSTOM_PREFIX = 'custom-'
export const isCustomId = (id: string) => id.startsWith(CUSTOM_PREFIX)

// ---------- plans ----------

export async function getPlans(userId: string): Promise<Plan[]> {
  const { data, error } = await bb()
    .from('workouts_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Plan[]
}

export async function getPlan(id: string): Promise<Plan | null> {
  const { data, error } = await bb().from('workouts_plans').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Plan | null
}

export async function setPlanActive(id: string, userId: string, isActive: boolean) {
  const { error } = await bb().from('workouts_plans').update({ is_active: isActive }).eq('id', id).eq('user_id', userId)
  if (error) throw error
}

/** Permanent delete — sessions and sets go with it (FK cascade), like the app's "delete with history" */
export async function deletePlan(id: string, userId: string) {
  const { error } = await bb().from('workouts_plans').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function duplicatePlan(plan: Plan) {
  const { error } = await bb().from('workouts_plans').insert({
    user_id: plan.user_id,
    title: `${plan.title} (עותק)`,
    description: plan.description,
    exercise_ids: plan.exercise_ids,
    time: plan.time,
    difficulty: plan.difficulty,
    days_per_week: plan.days_per_week,
  })
  if (error) throw error
}

// ---------- exercises (catalog v2 + the user's own) ----------

const V2_FIELDS =
  'exerciseId, name, name_he, imageUrls, videoUrl, targetMuscles, targetMuscles_he, bodyParts, bodyParts_he, equipments_he, instructions_he, input_fields'

interface CustomRow {
  id: string
  name: string
  body_part: string
  target_muscle: string | null
  equipment: string | null
  instructions: string[] | null
  image_urls: string[] | null
  input_fields: InputField[]
}

const BODY_PART_HE: Record<string, string> = {
  neck: 'צוואר', chest: 'חזה', shoulders: 'כתפיים', 'upper arms': 'ידיים', 'lower arms': 'אמות',
  waist: 'בטן', 'upper legs': 'רגל', 'lower legs': 'שוק', glutes: 'ישבן', back: 'גב', general: 'כללי', cardio: 'אירובי',
}

const fromCustom = (r: CustomRow): Exercise => ({
  exerciseId: CUSTOM_PREFIX + r.id,
  name: r.name,
  name_he: r.name,
  imageUrls: r.image_urls ?? [],
  videoUrl: null,
  targetMuscles: r.target_muscle ? [r.target_muscle] : [],
  targetMuscles_he: [],
  bodyParts: [r.body_part],
  bodyParts_he: [BODY_PART_HE[r.body_part] ?? r.body_part],
  equipments_he: [],
  instructions_he: r.instructions ?? [],
  input_fields: r.input_fields ?? [],
})

/** In the order of `ids` (like the app's getExerciseByIds + select) */
export async function getExercisesByIds(ids: string[]): Promise<Exercise[]> {
  const unique = [...new Set(ids)]
  const catalogIds = unique.filter((id) => !isCustomId(id))
  const customIds = unique.filter(isCustomId).map((id) => id.slice(CUSTOM_PREFIX.length))
  const [v2, custom] = await Promise.all([
    catalogIds.length
      ? bb().from('exercises_v2').select(V2_FIELDS).in('exerciseId', catalogIds)
      : Promise.resolve({ data: [], error: null }),
    customIds.length
      ? bb().from('user_custom_exercises').select('id, name, body_part, target_muscle, equipment, instructions, image_urls, input_fields').in('id', customIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (v2.error) throw v2.error
  if (custom.error) throw custom.error
  const all = [
    ...((v2.data ?? []) as unknown as Exercise[]).map((e) => ({ ...e, imageUrls: e.imageUrls ?? [], input_fields: e.input_fields ?? [] })),
    ...((custom.data ?? []) as CustomRow[]).map(fromCustom),
  ]
  const byId = new Map(all.map((e) => [e.exerciseId, e]))
  return unique.map((id) => byId.get(id)).filter((e): e is Exercise => !!e)
}

// ---------- sessions ----------

export async function getSessionsPage(userId: string, planId: string, page: number, pageSize: number): Promise<Session[]> {
  const from = (page - 1) * pageSize
  const { data, error } = await bb()
    .from('sessions')
    .select('id, user_id, workout_plan_id, started_at, completed_at, total_time, notes')
    .eq('user_id', userId)
    .eq('workout_plan_id', planId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)
  if (error) throw error
  return (data ?? []) as Session[]
}

export async function getSessionSets(sessionId: string): Promise<ExerciseSet[]> {
  const { data, error } = await bb()
    .from('exercise_sets')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as ExerciseSet[]
}

/** Sets of the plan's most recent workout, per exercise — the "import last time" defaults */
export async function getLatestPlanSets(userId: string, planId: string): Promise<Record<string, Record<string, number>[]>> {
  const { data, error } = await bb()
    .from('sessions')
    .select('exercise_sets(*)')
    .eq('user_id', userId)
    .eq('workout_plan_id', planId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  const sets = ((data as { exercise_sets: ExerciseSet[] | null } | null)?.exercise_sets ?? [])
  const byExercise: Record<string, ExerciseSet[]> = {}
  for (const s of sets) (byExercise[s.exercise_id] ??= []).push(s)
  return Object.fromEntries(
    Object.entries(byExercise).map(([id, list]) => [id, list.sort((a, b) => a.set_number - b.set_number).map((s) => s.values ?? {})]),
  )
}

export async function getUserWorkoutStats(): Promise<WorkoutStats> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const { data, error } = await bb().rpc('get_user_workout_stats', { p_tz: tz })
  if (error) throw error
  return data as WorkoutStats
}

export async function getPlanProgress(planId: string): Promise<Record<string, ExerciseProgress>> {
  const { data, error } = await bb().rpc('get_exercise_progress', { p_workout_plan_id: planId })
  if (error) throw error
  return (data ?? {}) as Record<string, ExerciseProgress>
}

/**
 * Saves a finished workout the way the app's server does (Workouts_Router /sessions):
 * upsert the session by its id, replace its sets. The browser can't reach that server (CORS),
 * so this writes the same rows directly; RLS limits it to the signed-in user.
 */
export async function saveWorkoutSession(session: Session, sets: Omit<ExerciseSet, 'id' | 'created_at'>[]) {
  const { error } = await bb().from('sessions').upsert(session, { onConflict: 'id' })
  if (error) throw error
  const { error: delErr } = await bb().from('exercise_sets').delete().eq('session_id', session.id)
  if (delErr) throw delErr
  if (sets.length) {
    const base = new Date(session.completed_at).getTime()
    // created_at in set order: the app lists a session's sets by it
    const rows = sets.map((s, i) => ({ ...s, is_completed: true, created_at: new Date(base + i).toISOString() }))
    const { error: setErr } = await bb().from('exercise_sets').insert(rows)
    if (setErr) {
      await bb().from('sessions').delete().eq('id', session.id)
      throw setErr
    }
  }
}

export async function getArchivedPlans(userId: string): Promise<Plan[]> {
  const { data, error } = await bb()
    .from('workouts_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Plan[]
}
