import { useMemo } from 'react'
import { Dumbbell, NotepadText } from 'lucide-react'
import type { ExerciseSet, Session } from '../types'
import { useExercisesByIds, useSessionSets } from '../hooks'
import { Loading } from '../ui/primitives'
import { formatFieldValue, formatFullDate, formatMinutesHebrew } from '../format'

/**
 * review/SessionInformation.tsx — the workout's exercises and sets in a table per exercise.
 * The app keeps notes for the PDF only; here they are shown on screen too, since the web writes them.
 */
export function SessionInformation({ session }: { session: Session; planTitle: string }) {
  const { data: sets, isLoading } = useSessionSets(session.id)
  const grouped = useMemo(() => {
    const map = new Map<string, ExerciseSet[]>()
    for (const s of sets ?? []) map.set(s.exercise_id, [...(map.get(s.exercise_id) ?? []), s])
    return [...map.entries()].map(([exercise_id, list]) => ({ exercise_id, sets: list.sort((a, b) => a.set_number - b.set_number) }))
  }, [sets])
  const { data: exercises, isLoading: loadingExercises } = useExercisesByIds(grouped.map((g) => g.exercise_id))

  if (isLoading) return <Loading />

  return (
    <div className="mt-4 px-2 pb-10">
      <div className="mb-6 flex flex-col gap-1">
        <h3 className="typo-h3 text-heading">סיכום אימון</h3>
        <p className="typo-caption text-zinc-400">{formatFullDate(session.started_at)} · {formatMinutesHebrew(session.total_time / 60)}</p>
      </div>

      {session.notes && (
        <div className="mb-6 rounded-2xl border border-lime-500/25 bg-lime-500/[0.08] px-4 py-3">
          <p className="typo-caption-bold mb-1 flex items-center gap-1.5 text-lime-300"><NotepadText size={14} aria-hidden /> הערות</p>
          <p className="typo-label whitespace-pre-line leading-6 text-zinc-300">{session.notes}</p>
        </div>
      )}

      {grouped.map((group) => {
        const info = exercises?.find((e) => e.exerciseId === group.exercise_id)
        const fields = info?.input_fields ?? []
        const valid = group.sets.filter((s) => s.is_completed !== false)
        return (
          <section key={group.exercise_id} className="mb-6 overflow-hidden rounded-2xl border border-gray-800 bg-background-850 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-gray-800 bg-background-800 px-4 py-3">
              <span className="overflow-hidden rounded-3xl border border-gray-700 bg-white/10">
                {info?.imageUrls?.[0] ? (
                  <img src={info.imageUrls[0]} alt="" className="h-12 w-12 object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center text-lime-500"><Dumbbell size={24} /></span>
                )}
              </span>
              <div className="flex-1 pe-3">
                <p className="typo-caption-bold uppercase tracking-widest text-gray-400">תרגיל</p>
                <p className="typo-h4 text-lime-500">{loadingExercises ? 'טוען...' : info?.name_he}</p>
              </div>
            </div>
            {valid.length ? (
              <table className="w-full">
                <thead className="bg-background-900/50">
                  <tr>
                    {fields.map((f) => <th key={f.key} className="typo-caption-bold px-1 py-2 text-center text-gray-500">{f.label}</th>)}
                    <th className="typo-caption-bold px-1 py-2 text-center text-gray-500">סט</th>
                  </tr>
                </thead>
                <tbody>
                  {valid.map((s, i) => (
                    <tr key={s.id ?? i} className={i !== valid.length - 1 ? 'border-b border-gray-800/50' : ''}>
                      {fields.map((f) => (
                        <td key={f.key} dir="ltr" className="typo-body-primary py-3 text-center font-black text-heading">
                          {s.values[f.key] !== undefined ? formatFieldValue(f, s.values[f.key]) : '—'}
                        </td>
                      ))}
                      <td className="typo-label py-3 text-center text-gray-400">{s.set_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="typo-label py-6 text-center text-gray-500">לא בוצעו חזרות לתרגיל זה</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
