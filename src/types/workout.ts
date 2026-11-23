export interface Exercise {
  exerciseId: string
  name: string
  name_he: string
  bodyParts: string[]
  bodyParts_he: string[]
  targetMuscles: string[]
  targetMuscles_he: string[]
  secondaryMuscles: string[]
  secondaryMuscles_he: string[]
  equipments: string[]
  equipments_he: string[]
  instructions: string[]
  instructions_he: string[]
  gifUrl?: string
  gif_available?: boolean
  input_fields?: ExerciseInputField[]
}

/** One input of an exercise in BodyBuddy (exercises_v2.input_fields / user_custom_exercises.input_fields) */
export interface ExerciseInputField {
  key: string // reps | weight | added_weight | duration | speed | incline
  type: 'number' | 'duration'
  unit: string | null
  label: string
  optional?: boolean
}

export interface WorkoutPlan {
  id: string
  name: string
  description: string | null
  difficulty: 'קל' | 'בינוני' | 'קשה' | null
  training_days: number[] // 0=ראשון...6=שבת
  created_at: string
  /** BodyBuddy's 1–10 difficulty, kept so edits don't round it to a label */
  difficulty_value?: number | null
  /** Planned minutes (BodyBuddy workouts_plans.time) */
  time?: number | null
  exercises?: WorkoutPlanExercise[]
}

export interface WorkoutPlanExercise {
  id: string
  workout_plan_id: string
  exercise_id: string
  exercise_name: string
  gif_url?: string
  order_index: number
  is_bodyweight: boolean
  input_fields?: ExerciseInputField[]
  created_at: string
}

export interface WorkoutLog {
  id: string
  date: string
  workout_plan_id: string | null
  notes: string | null
  created_at: string
  started_at?: string
  completed_at?: string
  /** Seconds */
  total_time?: number
  plan?: Pick<WorkoutPlan, 'id' | 'name'>
  set_logs?: WorkoutSetLog[]
}

export interface WorkoutSetLog {
  id: string
  workout_log_id: string
  exercise_id: string
  exercise_name: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  is_bodyweight: boolean
  added_weight_kg: number | null
  duration_sec?: number | null
  /** Raw BodyBuddy values ({ reps, weight, added_weight, duration, speed, incline }) */
  values?: Record<string, number | undefined>
  notes: string | null
  created_at: string
}
