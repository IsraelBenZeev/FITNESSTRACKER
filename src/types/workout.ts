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
}

export interface WorkoutPlan {
  id: string
  name: string
  description: string | null
  difficulty: 'קל' | 'בינוני' | 'קשה' | null
  training_days: number[] // 0=ראשון...6=שבת
  created_at: string
  exercises?: WorkoutPlanExercise[]
}

export interface WorkoutPlanExercise {
  id: string
  workout_plan_id: string
  exercise_id: string
  exercise_name: string
  gif_url?: string
  target_sets: number
  target_reps: number | null
  target_weight_kg: number | null
  order_index: number
  created_at: string
}

export interface WorkoutLog {
  id: string
  date: string
  workout_plan_id: string | null
  notes: string | null
  created_at: string
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
  created_at: string
}
