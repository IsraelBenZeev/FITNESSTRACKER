/** Shapes of BodyBuddy's workout tables, as the app uses them (BodyBuddy-Client/src/types) */

export type DayLetter = 'א' | 'ב' | 'ג' | 'ד' | 'ה' | 'ו' | 'ש'
export const DAY_LETTERS: DayLetter[] = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
export const DAY_NAMES: Record<DayLetter, string> = {
  א: 'ראשון', ב: 'שני', ג: 'שלישי', ד: 'רביעי', ה: 'חמישי', ו: 'שישי', ש: 'שבת',
}

export interface InputField {
  key: string // reps | weight | added_weight | duration | speed | incline
  type: 'number' | 'duration'
  unit: string | null
  label: string
  optional?: boolean
}

export interface Plan {
  id: string
  created_at: string
  user_id: string
  title: string
  description: string | null
  /** Planned minutes */
  time: number | null
  /** 1–10 */
  difficulty: number | null
  days_per_week: DayLetter[]
  exercise_ids: string[]
  muscle_groups: string[] | null
  is_active: boolean
}

export interface Exercise {
  exerciseId: string
  name: string
  name_he: string
  imageUrls: string[]
  videoUrl: string | null
  targetMuscles: string[]
  targetMuscles_he: string[]
  bodyParts: string[]
  bodyParts_he: string[]
  equipments_he: string[]
  instructions_he: string[]
  input_fields: InputField[]
}

export interface Session {
  id: string
  user_id: string
  workout_plan_id: string
  started_at: string
  completed_at: string
  /** Seconds */
  total_time: number
  notes: string | null
}

export interface ExerciseSet {
  id?: string
  created_at?: string
  user_id: string
  session_id: string
  exercise_id: string
  set_number: number
  is_completed?: boolean
  workout_plan_id: string
  rest_seconds: number | null
  values: Record<string, number>
}

export interface ProgressSession {
  session_id: string
  date: string
  sets: number
  maxima: Record<string, number>
}

export interface ExerciseProgress {
  total_sets: number
  max_sets: number
  maxima: Record<string, number>
  sessions: ProgressSession[]
}

export interface WorkoutStats {
  total_count: number
  first_session_at: string | null
  streak: number
  week_sessions: { id: string; workout_plan_id: string; started_at: string; total_time: number }[]
  last_session_by_plan: Record<string, string>
}

/** Active-workout form: values per exercise per set, keyed by input field */
export interface SessionForm {
  notes: string
  started_at: string
  exercises: Record<string, { sets: Record<string, number>[] }>
}
