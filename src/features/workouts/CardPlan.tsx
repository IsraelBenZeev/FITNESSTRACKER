import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Dumbbell, Ellipsis, Loader2, Pencil, Trash2 } from 'lucide-react'
import type { Plan } from './types'
import { DAY_LETTERS, DAY_NAMES } from './types'
import { useArchivePlan, useDeletePlanForever, useDuplicatePlan, useWorkoutStats } from './hooks'
import { ActionButton, LevelBars, ProgressRing } from './ui/primitives'
import { formatLastDone, formatMinutesHebrew } from './format'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { triggerFeedback } from '../../store/uiStore'
import { draftStore, shouldShowWorkoutBubble } from './draftStore'
import { useBbUserId } from '../nutrition/hooks'

export const CARD_WIDTH = 280

/** BodyBuddy-Client/src/hooks/usePlanWeeklyProgress.ts */
function usePlanWeeklyProgress(plan: Plan) {
  const { data: stats } = useWorkoutStats()
  return useMemo(() => {
    const planned = new Set(plan.days_per_week ?? []).size
    const planSessions = (stats?.week_sessions ?? []).filter((s) => s.workout_plan_id === plan.id)
    return {
      planned,
      completed: planSessions.length,
      doneDays: [...new Set(planSessions.map((s) => new Date(s.started_at).getDay()))],
      lastDoneLabel: formatLastDone(stats?.last_session_by_plan?.[plan.id]),
    }
  }, [stats, plan.id, plan.days_per_week])
}

/** Plan card in the carousel (list/CardPlan.tsx) — the options button lifts it and shows actions */
export function CardPlan({ plan, isActive }: { plan: Plan; isActive: boolean }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { planned, completed, doneDays, lastDoneLabel } = usePlanWeeklyProgress(plan)
  const today = new Date().getDay()
  const hasSchedule = planned > 0
  const daysLabel = plan.days_per_week.map((d) => DAY_NAMES[d]).join(', ')

  useEffect(() => { if (!isActive) setOpen(false) }, [isActive])

  return (
    <div className="relative mt-[30px]">
      <article
        aria-label={plan.title}
        className={`flex h-[clamp(380px,calc(100dvh-330px),470px)] w-[280px] flex-col justify-between rounded-[40px] border border-white/[0.04] bg-background-900 px-6 pb-6 pt-8 transition-transform duration-500 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${open ? '-translate-y-[100px]' : ''}`}
      >
        <h2 className="typo-h2 line-clamp-2 leading-7 text-heading">{plan.title}</h2>

        <div className="flex items-center justify-center gap-7">
          <span role="progressbar" aria-label={hasSchedule ? `${completed} מתוך ${planned} אימונים הושלמו השבוע` : 'לא הוגדרו ימי אימון בתוכנית'}>
            <ProgressRing progress={hasSchedule ? completed / planned : 0} size={96} strokeWidth={9}>
              <span className="typo-h2 text-heading">{hasSchedule ? `${completed}/${planned}` : '—'}</span>
              <span className="typo-caption text-background-400">אימונים</span>
            </ProgressRing>
          </span>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-start">
              <span className="typo-caption text-background-400">בוצע לאחרונה</span>
              <span className="typo-body-primary text-heading">{lastDoneLabel}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="typo-caption text-background-400">משך משוער</span>
              <span className="typo-body-primary text-heading">{formatMinutesHebrew(plan.time ?? 0)}</span>
            </div>
          </div>
        </div>

        <div aria-label={`ימי אימון: ${daysLabel}`} className="flex justify-between">
          {DAY_LETTERS.map((letter, i) => {
            const planned = plan.days_per_week.includes(letter)
            const done = doneDays.includes(i)
            const isToday = i === today
            return (
              <span
                key={letter}
                aria-hidden
                className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full ${
                  isToday ? 'border-[1.5px] border-lime-300' : planned ? 'border border-lime-500/50' : 'border border-white/[0.08]'
                } ${planned ? 'bg-lime-500/20' : ''}`}
              >
                {done ? <Check size={14} strokeWidth={3} className="text-lime-300" /> : (
                  <span className={`typo-caption-bold ${planned ? 'text-lime-300' : 'text-background-400'}`}>{letter}</span>
                )}
              </span>
            )
          })}
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="flex items-center gap-1">
            <Dumbbell size={16} strokeWidth={1.5} className="text-lime-500" aria-hidden />
            <span className="typo-caption-bold me-1 text-heading">{plan.exercise_ids.length} תרגילים</span>
          </span>
          <span className="flex items-center gap-2" aria-label={`רמת קושי ${plan.difficulty ?? 0} מתוך 10`}>
            <span className="typo-caption text-background-400">קושי</span>
            <LevelBars level={(plan.difficulty ?? 0) / 2} />
          </span>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="flex-1">
            <ActionButton onPress={() => navigate(`/workout/plan/${plan.id}`)} label="הצג אימון" variant="primary" size="sm" fullWidth ariaLabel={`הצג אימון: ${plan.title}`} />
          </div>
          <button
            type="button"
            onClick={() => isActive && setOpen((o) => !o)}
            aria-label="אפשרויות"
            aria-expanded={open}
            className="flex items-center justify-center rounded-full border border-lime-500 p-1 text-lime-500 transition-opacity active:opacity-60"
          >
            <Ellipsis size={24} />
          </button>
        </div>
      </article>

      {isActive && open && <PlanOptions plan={plan} />}
    </div>
  )
}

/** list/Buttons.tsx: duplicate · edit · delete (share needs the app's server, so it isn't offered here) */
function PlanOptions({ plan }: { plan: Plan }) {
  const userId = useBbUserId()
  const { mutate: duplicate, isPending: duplicating } = useDuplicatePlan()
  const { mutateAsync: archive, isPending: archiving } = useArchivePlan()
  const { mutateAsync: remove, isPending: removing } = useDeletePlanForever()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [withHistory, setWithHistory] = useState(false)
  const navigate = useNavigate()

  function handleEdit() {
    const { draft, openSession } = draftStore.get()
    const hasOpenWorkout =
      openSession?.planId === plan.id || (!!draft && draft.planId === plan.id && draft.userId === userId && shouldShowWorkoutBubble(draft))
    if (hasOpenWorkout) {
      triggerFeedback('לא ניתן לערוך תוכנית כשהאימון שלה פתוח. סגור את האימון ונסה שוב', 'failed')
      return
    }
    navigate(`/workout/form/edit/${plan.id}`)
  }

  async function confirmDelete() {
    try {
      if (withHistory) await remove(plan.id)
      else await archive(plan.id)
      setDeleteOpen(false)
    } catch {
      triggerFeedback('שגיאה במחיקת התוכנית', 'failed')
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-[-80px] flex animate-[pageEnter_0.25s_ease] items-center justify-center gap-[25px]">
      <OptionButton label="שכפל" busy={duplicating} onPress={() => duplicate(plan)} icon={<Copy size={26} />} />
      <OptionButton label="ערוך" onPress={handleEdit} icon={<Pencil size={26} />} />
      <OptionButton label="מחק" onPress={() => { setWithHistory(false); setDeleteOpen(true) }} icon={<Trash2 size={26} />} />

      <ConfirmDialog
        visible={deleteOpen}
        title="מחיקת תוכנית"
        message={withHistory
          ? `התוכנית "${plan.title}" וכל היסטוריית האימונים שלה יימחקו לצמיתות.`
          : `האם למחוק את "${plan.title}"? התוכנית תעבור לארכיון וההיסטוריה שלה תישמר.`}
        infoNote={withHistory ? undefined : 'את הארכיון אפשר למצוא במסך האימונים (אייקון הארכיון למעלה), ומשם אפשר לשחזר את התוכנית. האימונים שבוצעו בתוכנית ימשיכו להיספר בסטטיסטיקות.'}
        checkboxLabel="מחק גם את כל היסטוריית האימונים של התוכנית, והם לא ייספרו יותר בסטטיסטיקות. לא ניתן לשחזר!"
        checkboxChecked={withHistory}
        onCheckboxChange={setWithHistory}
        confirmLabel={withHistory ? 'מחק הכול' : 'העבר לארכיון'}
        isLoading={archiving || removing}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}

function OptionButton({ label, onPress, icon, busy }: { label: string; onPress: () => void; icon: React.ReactNode; busy?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onPress}
        disabled={busy}
        aria-label={label}
        className="flex rounded-full bg-background-900 p-3 text-lime-500 transition-transform duration-150 active:scale-90"
      >
        <span className="flex h-[26px] w-[26px] items-center justify-center">{busy ? <Loader2 size={20} className="animate-spin" /> : icon}</span>
      </button>
      <span aria-hidden className={`typo-caption text-lime-500 ${busy ? 'opacity-0' : ''}`}>{label}</span>
    </div>
  )
}
