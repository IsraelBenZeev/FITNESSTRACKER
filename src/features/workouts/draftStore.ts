import { useSyncExternalStore } from 'react'
import type { SessionForm } from './types'

/**
 * Web twin of the app's useWorkoutDraftStore + workoutsStore.completedTimes:
 * the open workout is kept on this device while it runs, so leaving the screen (minimize,
 * back, refresh) never loses it. Persisted in localStorage instead of a file.
 */

export const WORKOUT_DRAFT_VERSION = 1
const DRAFT_KEY = 'bb_workout_draft'
const BUBBLE_KEY = 'bb_workout_bubble'

export type CompletedTimes = Record<string, (number | null)[]>

export interface WorkoutDraft {
  version: typeof WORKOUT_DRAFT_VERSION
  userId: string
  planId: string
  planTitle: string
  sessionId: string
  startedAt: string
  updatedAt: string
  form: SessionForm
  completedTimes: CompletedTimes
  optionalFieldVisibility: Record<string, boolean>
  activeIndex: number
  /** The user minimized it — show the bubble even before any meaningful set */
  minimized?: boolean
}

/** save — left by accident; minimize — the minimize button; discard — X + "exit" */
export type SessionExitMode = 'save' | 'minimize' | 'discard'

export interface BubblePosition {
  side: 'left' | 'right'
  y: number
}

export interface OpenSession {
  planId: string
  planTitle: string
  startedAt: string
}

interface State {
  draft: WorkoutDraft | null
  bubblePosition: BubblePosition | null
  openSession: OpenSession | null
  completedTimes: CompletedTimes
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function write(key: string, value: unknown) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full / blocked — the workout still runs, it just won't survive a reload */
  }
}

const storedDraft = read<WorkoutDraft>(DRAFT_KEY)
let state: State = {
  draft: storedDraft?.version === WORKOUT_DRAFT_VERSION ? storedDraft : null,
  bubblePosition: read<BubblePosition>(BUBBLE_KEY),
  openSession: null,
  completedTimes: {},
}
const listeners = new Set<() => void>()
function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export const draftStore = {
  get: () => state,
  subscribe,
  saveDraft(draft: WorkoutDraft) {
    set({ draft })
    write(DRAFT_KEY, draft)
  },
  clearDraft() {
    set({ draft: null })
    write(DRAFT_KEY, null)
  },
  setBubblePosition(bubblePosition: BubblePosition) {
    set({ bubblePosition })
    write(BUBBLE_KEY, bubblePosition)
  },
  setOpenSession(openSession: OpenSession | null) {
    set({ openSession })
  },
  // completed (✓) time per set, per exercise
  setCompletedTimes(completedTimes: CompletedTimes) {
    set({ completedTimes })
  },
  clearCompletedTimes() {
    set({ completedTimes: {} })
  },
  setSetDone(exerciseId: string, index: number) {
    const times = state.completedTimes[exerciseId] ?? []
    if (times[index] != null) return
    const next = [...times]
    next[index] = Date.now()
    set({ completedTimes: { ...state.completedTimes, [exerciseId]: next } })
  },
  addSetTime(exerciseId: string) {
    const times = state.completedTimes[exerciseId] ?? []
    set({ completedTimes: { ...state.completedTimes, [exerciseId]: [...times, null] } })
  },
  removeSetTime(exerciseId: string, index: number) {
    const times = state.completedTimes[exerciseId] ?? []
    set({ completedTimes: { ...state.completedTimes, [exerciseId]: times.filter((_, i) => i !== index) } })
  },
}

export function useDraftStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}

// ---------- helpers (BodyBuddy-Client/src/utils/workoutDraft.ts) ----------

/** A "real" set: reps ≥ 1 (and weight ≥ 1 where the set has a weight), or duration ≥ 1s */
const isMeaningfulSet = (set: Record<string, number> | undefined): boolean => {
  if (!set) return false
  if (Number(set.duration) >= 1) return true
  if (!(Number(set.reps) >= 1)) return false
  return !('weight' in set) || Number(set.weight) >= 1
}

export const hasMeaningfulSet = (form: SessionForm | undefined): boolean =>
  Object.values(form?.exercises ?? {}).some((ex) => (ex?.sets ?? []).some(isMeaningfulSet))

export const isWorkoutDraftRestorable = (draft: WorkoutDraft | null | undefined) => !!draft && hasMeaningfulSet(draft.form)

export const shouldShowWorkoutBubble = (draft: WorkoutDraft | null | undefined) =>
  !!draft && (!!draft.minimized || isWorkoutDraftRestorable(draft))

/** 00:00 up to an hour, then 1:05:09 */
export const formatElapsedTime = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(safe / 3600)
  const mm = String(Math.floor((safe % 3600) / 60)).padStart(2, '0')
  const ss = String(safe % 60).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
