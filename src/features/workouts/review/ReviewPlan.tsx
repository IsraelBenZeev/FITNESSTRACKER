import { useMemo, useState } from 'react'
import { BicepsFlexed, CalendarDays, Clock, Dumbbell, Target, Zap } from 'lucide-react'
import type { Plan, Session } from '../types'
import { useExercisesByIds } from '../hooks'
import { Loading } from '../ui/primitives'
import { BottomSheet, SlideToConfirm, TabsManager } from '../ui/controls'
import { deriveMuscleKeys, formatMinutesHebrew, getMuscleLabels } from '../format'
import { triggerFeedback } from '../../../store/uiStore'
import { History } from './History'
import { ExercisesProgress } from './ExercisesProgress'
import { SessionInformation } from './SessionInformation'

/** review/ReviewWorkoutPlan.tsx — exercises, training areas, plan facts, history/progress tabs, slide to start */
export function ReviewPlan({ plan, onStart }: { plan: Plan; onStart: () => void }) {
  const [selected, setSelected] = useState<Session | null>(null)
  const hasExercises = plan.exercise_ids.length > 0

  function handleStart() {
    if (!hasExercises) { triggerFeedback('הוסף תרגילים לתוכנית כדי להתחיל אימון', 'failed'); return }
    onStart()
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col animate-[pageEnter_0.6s_ease]">
      <div className="min-h-0 flex-1 overflow-y-auto pb-32">
        <section className="mt-4 max-h-[45dvh] overflow-y-auto px-4 animate-bb-rise-in">
          <h2 className="mb-2 me-2 font-bold text-zinc-400">תרגילים באימון</h2>
          <ExerciseListPreview ids={plan.exercise_ids} />
        </section>
        <div className="px-5"><PlanMuscleGroups plan={plan} /></div>
        <CardWorkoutPlan plan={plan} />
        <TabsManager
          tabs={[
            { title: 'היסטוריה', content: <History planId={plan.id} onSelect={setSelected} /> },
            { title: 'התקדמות', content: <ExercisesProgress planId={plan.id} /> },
          ]}
        />
      </div>

      <div className="absolute bottom-10 left-0 right-0 px-6">
        <SlideToConfirm label="החלק להתחלה" onConfirm={handleStart} ariaLabel="התחל אימון" />
      </div>

      <BottomSheet open={!!selected} title="פרטי האימון" onClose={() => setSelected(null)}>
        {selected && <SessionInformation session={selected} planTitle={plan.title} />}
      </BottomSheet>
    </div>
  )
}

/** form/ListExercises.tsx in preview mode */
function ExerciseListPreview({ ids }: { ids: string[] }) {
  const { data: exercises, isLoading } = useExercisesByIds(ids)
  if (isLoading) return <Loading />
  return (
    <ul className="flex flex-col">
      {(exercises ?? []).map((ex, i) => (
        <li
          key={ex.exerciseId}
          className="mb-3 flex animate-bb-rise-in items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <span className="flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
            {ex.imageUrls[0] ? (
              <img src={ex.imageUrls[0]} alt="" className="h-14 w-14 object-cover" loading="lazy" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center text-lime-500"><Dumbbell size={28} /></span>
            )}
          </span>
          <span className="me-4 flex min-w-0 flex-1 flex-col items-start">
            <span className="typo-body-primary w-full truncate text-heading">{ex.name_he || ex.name}</span>
            <span className="mt-1 flex items-center gap-1">
              <span className="typo-caption me-1 text-zinc-400">{ex.targetMuscles_he?.[0] || ex.targetMuscles?.[0] || ex.bodyParts_he?.[0]}</span>
              <BicepsFlexed size={12} className="text-background-300" aria-hidden />
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** review/PlanMuscleGroups.tsx */
function PlanMuscleGroups({ plan }: { plan: Plan }) {
  const { data: exercises = [] } = useExercisesByIds(plan.exercise_ids)
  const labels = useMemo(
    () => getMuscleLabels(Array.isArray(plan.muscle_groups) ? plan.muscle_groups : deriveMuscleKeys(exercises)),
    [plan.muscle_groups, exercises],
  )
  if (!labels.length) return null
  return (
    <section aria-label={`אזורי אימון: ${labels.map((l) => l.label).join(', ')}`} className="mt-6 animate-bb-rise-in rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 [animation-delay:150ms]">
      <div className="mb-4 flex items-center gap-2" aria-hidden>
        <Target size={20} className="text-lime-400" />
        <span className="typo-label text-zinc-500">אזורי אימון</span>
      </div>
      <div className="flex flex-wrap gap-2" aria-hidden>
        {labels.map((l) => (
          <span key={l.key} className="typo-label rounded-2xl border border-zinc-800 bg-zinc-800/60 px-4 py-2 text-heading">{l.label}</span>
        ))}
      </div>
    </section>
  )
}

const WEEK = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

/** review/CardWorkouPlan.tsx */
function CardWorkoutPlan({ plan }: { plan: Plan }) {
  const days = [...(plan.days_per_week ?? [])].sort((a, b) => WEEK.indexOf(a) - WEEK.indexOf(b))
  return (
    <section className="mt-6 animate-bb-rise-in px-5 [animation-delay:200ms]">
      <div className="flex justify-around rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="flex flex-col items-center">
          <CalendarDays size={24} className="text-lime-400" aria-hidden />
          <span className="typo-body-primary mt-1 text-heading">{plan.days_per_week.length}</span>
          <span className="typo-caption text-zinc-500">ימים בשבוע</span>
          {!!days.length && <span className="typo-caption mt-1 text-center text-zinc-600">({days.join(', ')})</span>}
        </div>
        <div className="flex flex-col items-center border-x border-zinc-800 px-8">
          <Zap size={24} className="text-lime-400" aria-hidden />
          <span className="typo-body-primary mt-1 text-heading">{plan.difficulty ?? 0}/10</span>
          <span className="typo-caption text-zinc-500">רמת קושי</span>
        </div>
        <div className="flex flex-col items-center">
          <Clock size={24} className="text-lime-400" aria-hidden />
          <span className="typo-body-primary mt-1 text-heading">{formatMinutesHebrew(plan.time ?? 0)}</span>
          <span className="typo-caption text-zinc-500">זמן משוער</span>
        </div>
      </div>
      {plan.description && (
        <p className="typo-label mt-6 rounded-2xl border-s-4 border-lime-500 bg-zinc-900/40 p-4 leading-6 text-zinc-300">{plan.description}</p>
      )}
      {plan.created_at && (
        <p className="typo-caption mt-3 text-zinc-500">
          נוצר בתאריך {new Date(plan.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      )}
    </section>
  )
}
