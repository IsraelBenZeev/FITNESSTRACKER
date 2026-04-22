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
  sets: SessionSet[]
  notes: string
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

export function getSessionAgeMinutes(): number {
  const session = getSession()
  if (!session) return 0
  return Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 60000)
}

export function isSessionExpired(): boolean {
  const session = getSession()
  if (!session) return false
  const sessionDate = new Date(session.startedAt).toDateString()
  const today = new Date().toDateString()
  if (sessionDate !== today) return true
  return getSessionAgeMinutes() > 24 * 60
}

export function formatSessionAge(): string {
  const minutes = getSessionAgeMinutes()
  if (minutes < 1) return 'עכשיו'
  if (minutes < 60) return `לפני ${minutes} דקות`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `לפני ${hours} שעות`
  const session = getSession()
  if (!session) return 'ישן'
  const sessionDate = new Date(session.startedAt)
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / 86400000)
  if (diffDays === 1) return 'מאתמול'
  return `לפני ${diffDays} ימים`
}

export function formatElapsedFromSession(): string {
  const session = getSession()
  if (!session) return '00:00'
  const totalSec = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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
      sets: [{ reps: '', weight: '' }],
      notes: '',
    })),
  }
  saveSession(data)
  return data
}
