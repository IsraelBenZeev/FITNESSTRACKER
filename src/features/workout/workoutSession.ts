import type { WorkoutPlan } from '../../types/workout'

const SESSION_KEY = 'ft_workout_session'

export interface SessionSet {
  reps: string
  weight: string
}

export interface SessionExercise {
  exercise_id: string
  exercise_name: string
  gif_url?: string
  target_sets: number
  target_reps: number | null
  target_weight_kg: number | null
  sets: SessionSet[]
}

export interface WorkoutSessionData {
  planId: string | null
  planName: string
  startedAt: string          // ISO
  currentExerciseIndex: number
  exercises: SessionExercise[]
  notes: string
}

export function getSession(): WorkoutSessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as WorkoutSessionData) : null
  } catch {
    return null
  }
}

export function saveSession(data: WorkoutSessionData): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function hasActiveSession(): boolean {
  return localStorage.getItem(SESSION_KEY) !== null
}

export function initSession(plan: WorkoutPlan): WorkoutSessionData {
  const data: WorkoutSessionData = {
    planId: plan.id,
    planName: plan.name,
    startedAt: new Date().toISOString(),
    currentExerciseIndex: 0,
    notes: '',
    exercises: (plan.exercises ?? []).map((ex) => ({
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise_name,
      gif_url: ex.gif_url,
      target_sets: ex.target_sets,
      target_reps: ex.target_reps,
      target_weight_kg: ex.target_weight_kg,
      sets: [{ reps: '', weight: '' }],
    })),
  }
  saveSession(data)
  return data
}
