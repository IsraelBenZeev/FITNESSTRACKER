import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Dumbbell, LogOut } from 'lucide-react'
import { usePlan } from './hooks'
import type { Plan } from './types'
import { CloseButton, Loading } from './ui/primitives'
import { WorkoutTimer } from './ui/controls'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { triggerFeedback } from '../../store/uiStore'
import { draftStore, shouldShowWorkoutBubble, useDraftStore, type SessionExitMode, type WorkoutDraft } from './draftStore'
import { BUBBLE_SIZE, getBubbleFrame, useWindowSize } from './ActiveWorkoutBubble'
import { ReviewPlan } from './review/ReviewPlan'
import { ActiveSession } from './session/ActiveSession'
import { useBbUserId } from '../nutrition/hooks'

/**
 * Plan screen — BodyBuddy-Client/src/Features/workoutsPlans/session/SessionManager.tsx:
 * header, then the plan review or the active workout. Minimize shrinks the screen into the floating bubble.
 */
export function PlanScreen() {
  const { planId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const userId = useBbUserId()
  const { data: plan, isLoading, isSuccess } = usePlan(planId)
  const metrics = useWindowSize()
  const bubblePosition = useDraftStore((s) => s.bubblePosition)

  const pickResumeDraft = useCallback((): WorkoutDraft | null => {
    const d = draftStore.get().draft
    return d && d.planId === planId && d.userId === userId ? d : null
  }, [planId, userId])

  const [resumeDraft] = useState(() => (params.get('resume') === '1' ? pickResumeDraft() : null))
  const [sessionDraft, setSessionDraft] = useState<WorkoutDraft | null>(resumeDraft)
  const [isStart, setIsStart] = useState(!!resumeDraft)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const exitModeRef = useRef<SessionExitMode>('save')
  const [prompt, setPrompt] = useState<{ kind: 'samePlan' | 'otherPlan'; draft: WorkoutDraft } | null>(null)
  const [exitOpen, setExitOpen] = useState(false)

  // minimize ⇄ bubble: 1 = shrunk into the bubble, 0 = full screen
  const [shrink, setShrink] = useState(resumeDraft ? 1 : 0)
  useEffect(() => {
    if (!resumeDraft || !plan) return
    const id = requestAnimationFrame(() => setShrink(0))
    return () => cancelAnimationFrame(id)
  }, [resumeDraft, plan])

  const frame = getBubbleFrame(bubblePosition, metrics)
  const tx = frame.x + BUBBLE_SIZE / 2 - metrics.width / 2
  const ty = frame.y + BUBBLE_SIZE / 2 - metrics.height / 2
  const scale = 1 - (1 - BUBBLE_SIZE / Math.max(metrics.width, 1)) * shrink

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/workout', { replace: true })
  }, [navigate])

  const handleMinimize = useCallback(() => {
    exitModeRef.current = 'minimize'
    setShrink(1)
    setTimeout(goBack, 380)
  }, [goBack])

  const handleExitWithoutSaving = useCallback(() => {
    exitModeRef.current = 'discard'
    if (draftStore.get().draft?.planId === planId) draftStore.clearDraft()
  }, [planId])

  const startFresh = useCallback(() => { setSessionDraft(null); setIsStart(true) }, [])

  const handleStart = useCallback(() => {
    const existing = draftStore.get().draft
    if (!existing || existing.userId !== userId || !shouldShowWorkoutBubble(existing)) { startFresh(); return }
    setPrompt({ kind: existing.planId === planId ? 'samePlan' : 'otherPlan', draft: existing })
  }, [planId, startFresh, userId])

  // the plan was deleted under an open workout
  useEffect(() => {
    if (!isSuccess || plan) return
    if (draftStore.get().draft?.planId === planId) {
      draftStore.clearDraft()
      triggerFeedback('תוכנית האימון נמחקה, ולכן האימון שלא הסתיים בוטל', 'failed')
    }
    navigate('/workout', { replace: true })
  }, [isSuccess, plan, planId, navigate])

  if (isLoading || !plan) {
    return <div className="flex h-[100dvh] items-center justify-center bg-background-1200"><Loading size={96} /></div>
  }

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-background-900 transition-[transform,opacity,border-radius] duration-[380ms] ease-[cubic-bezier(0.5,0,0.75,0)] motion-reduce:transition-none"
      style={{
        transform: `translate(${tx * shrink}px, ${ty * shrink}px) scale(${scale})`,
        opacity: shrink < 0.6 ? 1 : 1 - (shrink - 0.6) / 0.4,
        borderRadius: shrink * 48,
      }}
    >
      <header className={`flex flex-col gap-2 border-b border-background-1200 px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] ${locked ? 'pointer-events-none opacity-35' : ''}`}>
        <div className="flex items-center gap-2">
          {isStart && startedAt ? <WorkoutTimer startedAt={startedAt} /> : null}
          <span className="flex-1" />
          {isStart && <CloseButton kind="minimize" onPress={handleMinimize} label="מזער את האימון" />}
          <CloseButton onPress={() => (isStart ? setExitOpen(true) : goBack())} label={isStart ? 'צא מהאימון' : 'סגור'} />
        </div>
        <h1 className="typo-h2 truncate text-center text-lime-500">{plan.title}</h1>
      </header>

      {!isStart && <ReviewPlan plan={plan as Plan} onStart={handleStart} />}
      {isStart && (
        <ActiveSession
          plan={plan as Plan}
          initialDraft={sessionDraft}
          exitModeRef={exitModeRef}
          onFinished={() => setIsStart(false)}
          onLockChange={setLocked}
          onStartedAt={setStartedAt}
        />
      )}

      <ConfirmDialog
        visible={exitOpen}
        title="יציאה מהאימון"
        message="האם אתה בטוח שברצונך לצאת? ההתקדמות לא תישמר."
        icon={LogOut}
        confirmLabel="צא"
        cancelLabel="המשך אימון"
        onConfirm={() => { setExitOpen(false); handleExitWithoutSaving(); goBack() }}
        onCancel={() => setExitOpen(false)}
      />
      <ConfirmDialog
        visible={prompt?.kind === 'samePlan'}
        variant="info"
        title="יש לך אימון שלא הסתיים"
        message="התחלת את האימון הזה ולא סיימת אותו. להמשיך מאיפה שעצרת או להתחיל מחדש?"
        icon={Dumbbell}
        confirmLabel="המשך אימון"
        onConfirm={() => { const d = prompt?.draft ?? null; setPrompt(null); setSessionDraft(d); setIsStart(true) }}
        onCancel={() => setPrompt(null)}
        secondaryAction={{ label: 'התחל מחדש', tone: 'danger', onPress: () => { setPrompt(null); draftStore.clearDraft(); startFresh() } }}
      />
      <ConfirmDialog
        visible={prompt?.kind === 'otherPlan'}
        title="יש לך אימון פתוח"
        message={`האימון "${prompt?.draft.planTitle ?? ''}" עדיין לא הסתיים. התחלת אימון חדש תמחק אותו.`}
        icon={Dumbbell}
        confirmLabel="התחל אימון חדש"
        onConfirm={() => { setPrompt(null); draftStore.clearDraft(); startFresh() }}
        onCancel={() => setPrompt(null)}
      />
    </div>
  )
}
