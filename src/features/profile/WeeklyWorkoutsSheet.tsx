import { useEffect, useMemo, useState } from 'react'
import { Archive, ArrowLeftRight } from 'lucide-react'
import { BottomSheet } from '../workouts/ui/controls'
import type { WeeklyWorkoutItem } from './useProfileData'

const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const BAR_MAX = 48
const BAR_MIN = 6

type SortMode = 'done' | 'date'
const SORTS: { value: SortMode; label: string }[] = [
  { value: 'done', label: 'בוצעו תחילה' },
  { value: 'date', label: 'לפי תאריך' },
]

const plannedDaysText = (days: number[]) => `${days.length > 1 ? 'תוכנן לימים' : 'תוכנן ליום'} ${days.map((d) => DAY_LETTERS[d]).join(', ')}`
const minutesText = (m: number) => {
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}:${String(m % 60).padStart(2, '0')} שע׳` : `${m} דק׳`
}

/** This week's workouts: bars per day (tap to filter), sort toggle, and a card per workout (WeeklyWorkoutsSheet) */
export function WeeklyWorkoutsSheet({ open, onClose, workouts }: { open: boolean; onClose: () => void; workouts: WeeklyWorkoutItem[] }) {
  const [day, setDay] = useState<number | null>(null)
  const [sort, setSort] = useState<SortMode>('done')

  useEffect(() => {
    if (!open) {
      setDay(null)
      setSort('done')
    }
  }, [open])

  const dayStats = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5, 6].map((d) => {
        const items = workouts.filter((w) => w.dayIndex === d)
        return {
          d,
          count: items.length,
          done: items.filter((w) => w.status === 'done').reduce((s, w) => s + w.minutes, 0),
          pending: items.filter((w) => w.status === 'pending').reduce((s, w) => s + w.minutes, 0),
        }
      }),
    [workouts],
  )
  const maxDay = Math.max(1, ...dayStats.map((s) => s.done + s.pending))
  const maxWorkout = Math.max(1, ...workouts.map((w) => w.minutes))

  const visible = useMemo(() => {
    const list = day === null ? workouts : workouts.filter((w) => w.dayIndex === day)
    // Already sorted by date; a stable sort lifts the done ones
    return sort === 'date' ? list : [...list].sort((a, b) => Number(b.status === 'done') - Number(a.status === 'done'))
  }, [workouts, day, sort])

  const summary = useMemo(() => {
    const done = visible.filter((w) => w.status === 'done')
    const pending = visible.length - done.length
    const prefix = day === null ? '' : `יום ${DAY_LETTERS[day]} · `
    return `${prefix}${done.length} בוצעו${pending > 0 ? ` · ${pending} ממתינים` : ''} · ${minutesText(done.reduce((s, w) => s + w.minutes, 0))} פעילות`
  }, [visible, day])

  return (
    <BottomSheet open={open} title="אימונים השבוע" onClose={onClose}>
      <div className="flex flex-col gap-3 pb-6">
        <p className="typo-label text-center text-background-400" aria-live="polite">{workouts.length === 0 ? 'עוד לא בוצעו אימונים השבוע' : summary}</p>

        <div className="flex rounded-3xl border border-white/5 bg-background-950 px-2 pb-1 pt-2" role="group" aria-label="דקות אימון לפי יום">
          {dayStats.map((s) => {
            const selected = day === s.d
            const empty = s.count === 0
            const total = s.done + s.pending
            const h = empty ? BAR_MIN : Math.max(BAR_MIN + 4, Math.round((total / maxDay) * BAR_MAX))
            const doneH = total > 0 ? Math.round((s.done / total) * h) : 0
            return (
              <button
                key={s.d}
                type="button"
                disabled={empty}
                onClick={() => setDay((cur) => (cur === s.d ? null : s.d))}
                aria-pressed={selected}
                aria-label={empty ? `יום ${DAY_LETTERS[s.d]}, אין אימונים` : `יום ${DAY_LETTERS[s.d]}, ${s.count} אימונים, ${total} דקות`}
                className={`flex min-h-[44px] flex-1 flex-col items-center gap-1 rounded-2xl pb-1 pt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${empty ? 'opacity-40' : ''}`}
              >
                <span className="flex h-12 w-full items-end justify-center" aria-hidden>
                  <span className="flex w-[62%] flex-col" style={{ height: h }}>
                    {empty ? (
                      <span className="flex-1 rounded-full border-[1.5px] border-white/15" />
                    ) : (
                      <>
                        {s.pending > 0 && (
                          <span className={`rounded-t-2xl ${doneH === 0 ? 'rounded-b' : ''} ${selected ? 'bg-lime-500/40' : 'bg-white/[0.14]'}`} style={{ height: h - doneH }} />
                        )}
                        {s.done > 0 && (
                          <span className={`rounded-b ${s.pending === 0 ? 'rounded-t-xl' : ''} ${selected ? 'bg-lime-300' : 'bg-lime-500'}`} style={{ height: doneH }} />
                        )}
                      </>
                    )}
                  </span>
                </span>
                <span className={`typo-label ${selected ? 'text-lime-300' : 'text-background-400'}`}>{DAY_LETTERS[s.d]}</span>
                <span className={`typo-caption min-h-[16px] ${selected ? 'text-lime-300' : 'text-background-400'}`}>{empty ? '' : total}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div role="radiogroup" aria-label="מיון אימונים" className="flex rounded-full border border-white/5 bg-white/5 p-0.5">
            {SORTS.map((o) => {
              const on = sort === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSort(o.value)}
                  className={`flex min-h-[32px] items-center justify-center rounded-full border px-3 ${on ? 'typo-caption-bold border-lime-500/45 bg-lime-500/[0.18] text-lime-300' : 'typo-caption border-transparent text-background-400'}`}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
          {day !== null && (
            <button type="button" onClick={() => setDay(null)} className="typo-label min-h-[44px] px-2 text-lime-300">הצג הכל</button>
          )}
        </div>

        {visible.length === 0 && workouts.length > 0 && <p className="typo-label py-8 text-center text-background-400">אין אימונים ביום הזה</p>}

        <ul className="flex flex-col gap-3">
          {visible.map((w) => {
            const done = w.status === 'done'
            return (
              <li key={w.id} className={`flex flex-col gap-2 rounded-3xl p-4 ${done ? 'border border-white/5 bg-background-800' : 'border border-dashed border-white/10 bg-white/[0.02]'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`typo-body-primary flex-1 ${done ? 'text-heading' : 'text-white/60'}`}>{w.name}</p>
                  <span className={`typo-caption rounded-full border px-3 py-1 ${done ? 'border-lime-500/45 bg-lime-500/[0.18] text-lime-300' : 'border-white/10 bg-white/5 text-background-400'}`}>
                    {done ? `${w.minutes} דק׳` : 'ממתין'}
                  </span>
                </div>
                <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
                  <span className="block h-full rounded-full bg-lime-500" style={{ width: `${done ? Math.round((w.minutes / maxWorkout) * 100) : 0}%` }} />
                </span>
                <p className="typo-caption text-background-400">{`${w.dayLabel} · ${w.dateLabel}`}</p>
                {w.plannedDays && (
                  <p className="typo-caption flex items-center gap-1 text-lime-300"><ArrowLeftRight size={14} aria-hidden />{plannedDaysText(w.plannedDays)}</p>
                )}
                {w.isArchived && (
                  <p className="typo-caption flex items-center gap-1 text-lime-300"><Archive size={14} aria-hidden />תוכנית בארכיון</p>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </BottomSheet>
  )
}
