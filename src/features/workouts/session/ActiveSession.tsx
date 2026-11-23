import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'
import ReactDOM from 'react-dom'
import { useForm, type Control } from 'react-hook-form'
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import type { Exercise, ExerciseSet, Plan, SessionForm } from '../types'
import { useExercisesByIds, useLatestPlanSets, useSaveWorkoutSession } from '../hooks'
import {
  WORKOUT_DRAFT_VERSION, draftStore, isWorkoutDraftRestorable, type SessionExitMode, type WorkoutDraft,
} from '../draftStore'
import { ActionButton, Loading } from '../ui/primitives'
import { HistoryImportIsland } from '../ui/controls'
import { ExerciseCard } from './ExerciseCard'
import { ConfirmDialog } from '../../../ui/ConfirmDialog'
import { triggerFeedback } from '../../../store/uiStore'
import { useBbUserId } from '../../nutrition/hooks'

const DRAFT_SAVE_DELAY_MS = 500
const HISTORY_NOTICE_MS = 5000
const SLOW_SAVE_MS = 8000
const NO_SETS: Record<string, number>[] = []

const pickPlanExercises = <T,>(record: Record<string, T> | undefined, ids: string[]) =>
  Object.fromEntries(Object.entries(record ?? {}).filter(([id]) => ids.includes(id))) as Record<string, T>

/** utils/workoutDraft.buildExerciseSetsFromForm — empty unchecked sets are dropped; rest time from the ✓ times */
function buildExerciseSets(form: SessionForm, exercises: Exercise[] | undefined, userId: string, planId: string, sessionId: string) {
  const times = draftStore.get().completedTimes
  const out: Omit<ExerciseSet, 'id' | 'created_at'>[] = []
  for (const [exerciseId, ex] of Object.entries(form.exercises ?? {})) {
    const t = times[exerciseId] ?? []
    const required = exercises?.find((e) => e.exerciseId === exerciseId)?.input_fields.filter((f) => !f.optional).map((f) => f.key) ?? []
    let n = 0
    ;(ex?.sets ?? []).forEach((set, i) => {
      const empty = t[i] == null && required.length > 0 && required.every((k) => !Number(set[k]))
      if (empty) return
      n += 1
      const prev = t[i - 1] ?? null
      const curr = t[i] ?? null
      out.push({
        user_id: userId,
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: n,
        values: Object.fromEntries(Object.entries(set).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, Number(v)])),
        workout_plan_id: planId,
        rest_seconds: i > 0 && prev != null && curr != null ? Math.round((curr - prev) / 1000) : null,
      })
    })
  }
  return out
}

interface Props {
  plan: Plan
  initialDraft: WorkoutDraft | null
  exitModeRef: MutableRefObject<SessionExitMode>
  onFinished: () => void
  onLockChange: (locked: boolean) => void
  onStartedAt: (iso: string) => void
}

/** session/active/Session.tsx — one card per exercise in a swipeable pager, notes, finish */
export function ActiveSession({ plan, initialDraft, exitModeRef, onFinished, onLockChange, onStartedAt }: Props) {
  const userId = useBbUserId() ?? ''
  const [ids] = useState(() => plan.exercise_ids ?? [])
  const { data: exercises, isLoading } = useExercisesByIds(ids)
  const { data: historyDefaults = {}, isLoading: historyLoading } = useLatestPlanSets(plan.id)
  const { mutateAsync: save, isPending } = useSaveWorkoutSession()

  const [initialIndex] = useState(() => Math.max(0, Math.min(initialDraft?.activeIndex ?? 0, Math.max(0, ids.length - 1))))
  const timesInit = useRef(false)
  if (!timesInit.current) {
    timesInit.current = true
    draftStore.setCompletedTimes(pickPlanExercises(initialDraft?.completedTimes, ids))
  }
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [optionalVisibility, setOptionalVisibility] = useState<Record<string, boolean>>(() => initialDraft?.optionalFieldVisibility ?? {})

  const { control, handleSubmit, reset, getValues, watch, register } = useForm<SessionForm>({
    defaultValues: initialDraft
      ? { notes: initialDraft.form.notes ?? '', started_at: initialDraft.startedAt, exercises: pickPlanExercises(initialDraft.form.exercises, ids) }
      : { notes: '', started_at: new Date().toISOString(), exercises: {} },
  })
  const [startedAt] = useState(() => getValues('started_at'))
  const [sessionId] = useState(() => initialDraft?.sessionId ?? crypto.randomUUID())
  useEffect(() => { onStartedAt(startedAt) }, [startedAt, onStartedAt])

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [slowSave, setSlowSave] = useState(false)
  const locked = saving || saved
  useEffect(() => { onLockChange(locked) }, [locked, onLockChange])
  useEffect(() => () => onLockChange(false), [onLockChange])
  useEffect(() => {
    if (!saving) { setSlowSave(false); return }
    const id = setTimeout(() => setSlowSave(true), SLOW_SAVE_MS)
    return () => clearTimeout(id)
  }, [saving])

  // "last workout's sets were filled in" — shown 5s on a fresh start, with a cancel
  const hasHistory = Object.values(historyDefaults).some((s) => s.length > 0)
  const [useHistory, setUseHistory] = useState(true)
  const [noticeVisible, setNoticeVisible] = useState(!initialDraft)
  useEffect(() => {
    if (!hasHistory || !noticeVisible) return
    const id = setTimeout(() => setNoticeVisible(false), HISTORY_NOTICE_MS)
    return () => clearTimeout(id)
  }, [hasHistory, noticeVisible])
  const cancelHistoryImport = useCallback(() => {
    if (!exercises?.length) return
    reset({
      notes: '',
      started_at: startedAt,
      exercises: Object.fromEntries(exercises.map((e) => [e.exerciseId, { sets: [Object.fromEntries(e.input_fields.filter((f) => !f.optional).map((f) => [f.key, 0]))] }])),
    })
    setUseHistory(false)
    setNoticeVisible(false)
    draftStore.clearCompletedTimes()
  }, [exercises, reset, startedAt])

  // ---------- draft (kept on this device while the workout runs) ----------
  const finishedRef = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(activeIndex)
  activeRef.current = activeIndex
  const optionalRef = useRef(optionalVisibility)
  optionalRef.current = optionalVisibility

  const flushDraft = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    const mode = exitModeRef.current
    if (finishedRef.current || mode === 'discard' || !userId) return
    const draft: WorkoutDraft = {
      version: WORKOUT_DRAFT_VERSION,
      userId,
      planId: plan.id,
      planTitle: plan.title,
      sessionId,
      startedAt,
      updatedAt: new Date().toISOString(),
      form: getValues(),
      completedTimes: draftStore.get().completedTimes,
      optionalFieldVisibility: optionalRef.current,
      activeIndex: activeRef.current,
      minimized: mode === 'minimize',
    }
    if (draft.minimized || isWorkoutDraftRestorable(draft)) draftStore.saveDraft(draft)
    else if (draftStore.get().draft?.planId === plan.id) draftStore.clearDraft()
  }, [exitModeRef, getValues, plan.id, plan.title, sessionId, startedAt, userId])

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flushDraft, DRAFT_SAVE_DELAY_MS)
  }, [flushDraft])

  useEffect(() => {
    const sub = watch(() => schedule())
    return () => sub.unsubscribe()
  }, [watch, schedule])
  useEffect(() => {
    let prev = draftStore.get().completedTimes
    return draftStore.subscribe(() => {
      const next = draftStore.get().completedTimes
      if (next !== prev) { prev = next; schedule() }
    })
  }, [schedule])
  useEffect(() => { schedule() }, [activeIndex, optionalVisibility, schedule])
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushDraft() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flushDraft)
    return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', flushDraft) }
  }, [flushDraft])

  const flushRef = useRef(flushDraft)
  flushRef.current = flushDraft
  useEffect(() => {
    draftStore.setOpenSession({ planId: plan.id, planTitle: plan.title, startedAt })
    return () => {
      flushRef.current()
      draftStore.clearCompletedTimes()
      draftStore.setOpenSession(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- finish ----------
  const [finishOpen, setFinishOpen] = useState(false)
  const openFinish = () =>
    handleSubmit((data) => {
      if (!buildExerciseSets(data, exercises, userId, plan.id, '').length) {
        triggerFeedback('לא נרשם אף סט. הזן חזרות/משקל או סמן סט כבוצע לפני הסיום', 'failed')
        return
      }
      setFinishOpen(true)
    })()

  const onSubmit = async (data: SessionForm) => {
    const completedAt = new Date().toISOString()
    const sets = buildExerciseSets(data, exercises, userId, plan.id, sessionId)
    if (!sets.length) {
      triggerFeedback('לא נרשם אף סט. הזן חזרות/משקל או סמן סט כבוצע לפני הסיום', 'failed')
      return
    }
    setSaving(true)
    try {
      await save({
        session: {
          id: sessionId,
          user_id: userId,
          workout_plan_id: plan.id,
          started_at: data.started_at,
          completed_at: completedAt,
          total_time: Math.floor((new Date(completedAt).getTime() - new Date(data.started_at).getTime()) / 1000),
          notes: data.notes?.trim() || '',
        },
        sets,
      })
      finishedRef.current = true
      if (timer.current) clearTimeout(timer.current)
      draftStore.clearDraft()
      draftStore.clearCompletedTimes()
      setSaved(true)
      setSaving(false)
      setTimeout(() => {
        triggerFeedback('האימון נשמר בהצלחה', 'success')
        onFinished()
      }, 300)
    } catch {
      setSaving(false)
      setTimeout(() => triggerFeedback('שגיאה בשמירת האימון', 'failed'), 300)
    }
  }

  // ---------- pager ----------
  const pager = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = pager.current
    if (!el || !exercises?.length) return
    el.scrollLeft = initialIndex * el.clientWidth
    // first layout only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises?.length])
  const onPagerScroll = () => {
    const el = pager.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== activeRef.current) setActiveIndex(i)
  }
  const goTo = (i: number) => {
    const el = pager.current
    const count = exercises?.length ?? 0
    if (!el || !count) return
    el.scrollTo({ left: Math.max(0, Math.min(count - 1, i)) * el.clientWidth, behavior: 'smooth' })
  }
  const onOptionalChange = useCallback((id: string, enabled: boolean) => setOptionalVisibility((v) => ({ ...v, [id]: enabled })), [])

  if (isLoading || historyLoading) {
    return <div className="flex flex-1 items-center justify-center bg-background-900"><p className="typo-body text-heading">טוען...</p></div>
  }

  const active = exercises?.[activeIndex]
  return (
    <div className="relative flex min-h-0 flex-1 animate-[pageEnter_0.6s_ease] flex-col bg-background-900">
      <HistoryImportIsland visible={hasHistory && noticeVisible} durationMs={HISTORY_NOTICE_MS} onCancel={cancelHistoryImport} />

      <div className={`flex min-h-0 flex-1 flex-col ${locked ? 'pointer-events-none opacity-35' : ''}`}>
        <div className="mb-3 mt-4 flex items-center justify-between gap-4 px-3">
          <h2 className="typo-h3 min-w-0 flex-1 truncate text-heading">{active?.name_he ?? ''}</h2>
          <span className="typo-label flex-shrink-0 text-zinc-400">תרגיל {activeIndex + 1} מתוך {exercises?.length}</span>
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={pager}
            dir="ltr"
            onScroll={onPagerScroll}
            className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
          >
            {(exercises ?? []).map((ex, i) => (
              <div key={`${ex.exerciseId}-${useHistory ? 'history' : 'empty'}`} dir="rtl" className="flex h-full w-full flex-shrink-0 snap-center justify-center">
                <div className="h-full w-[95%]">
                  <ExerciseCard
                    item={ex}
                    isActive={i === activeIndex}
                    control={control as unknown as Control<any>}
                    defaultSets={useHistory ? historyDefaults[ex.exerciseId] ?? NO_SETS : NO_SETS}
                    optionalFieldVisibility={optionalVisibility}
                    onOptionalFieldVisibilityChange={onOptionalChange}
                  />
                </div>
              </div>
            ))}
          </div>
          <div dir="ltr" className="pointer-events-none absolute left-4 right-4 top-20 flex justify-between">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="התרגיל הקודם"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background-800 text-background-300 transition-opacity disabled:opacity-25"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex >= (exercises?.length ?? 0) - 1}
              aria-label="התרגיל הבא"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background-800 text-background-300 transition-opacity disabled:opacity-25"
            >
              <ChevronRight size={26} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 bg-background-900/95 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-3">
          <label className="flex flex-col gap-1.5">
            <span className="typo-label text-zinc-400">הערה לאימון</span>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="איך היה האימון? משהו לזכור לפעם הבאה"
              className="typo-input resize-none rounded-2xl border border-white/10 bg-background-800 px-4 py-3 text-heading placeholder:text-zinc-500 focus:border-lime-500/50 focus:outline-none"
            />
          </label>
          <ActionButton onPress={openFinish} label="סיים אימון" variant="outline" size="md" fullWidth disabled={locked || isPending} loading={isPending} />
        </div>
      </div>

      {saving && ReactDOM.createPortal(
        <div role="alertdialog" aria-label="שומר את האימון" className="fixed inset-0 z-[400] flex items-center justify-center bg-black/35 px-6">
          <div className="flex w-full max-w-[360px] flex-col items-center gap-3 rounded-3xl border border-white/10 bg-background-900 px-6 py-10 shadow-md shadow-black">
            <Loading size={96} label="שומר את האימון" />
            <p className="typo-body-primary text-heading">שומר את האימון...</p>
            {slowSave && (
              <div className="flex animate-[pageEnter_0.3s_ease] flex-col items-center gap-1 text-center">
                <p className="typo-label text-lime-300">החיבור איטי מהרגיל</p>
                <p className="typo-caption text-background-300">האימון שלך עדיין נשמר — זה עשוי לקחת עוד כמה רגעים. אין צורך לסגור את הדף.</p>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}

      <ConfirmDialog
        visible={finishOpen}
        variant="info"
        title="סיום אימון"
        message="האם לסיים את האימון? האימון יישמר ולא תוכל להמשיך אותו."
        icon={Flag}
        confirmLabel="כן"
        cancelLabel="לא"
        showCloseButton
        onConfirm={() => { setFinishOpen(false); void handleSubmit(onSubmit)() }}
        onCancel={() => setFinishOpen(false)}
      />
    </div>
  )
}
