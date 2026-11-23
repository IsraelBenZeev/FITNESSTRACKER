import { useEffect, useMemo, useRef } from 'react'
import { Calendar, ChevronLeft, Clock, NotepadText } from 'lucide-react'
import type { Session } from '../types'
import { useInfiniteSessions } from '../hooks'
import { formatDayMonth, formatDurationHebrew, hhmm, sessionTitle } from '../format'

/** review/History.tsx — the plan's workouts, newest first, loading more on scroll */
export function History({ planId, onSelect }: { planId: string; onSelect: (s: Session) => void }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteSessions(planId)
  const sessions = useMemo(() => data?.pages.flat() ?? [], [data])
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isLoading) return <p className="typo-body text-heading">טוען היסטוריית אימונים...</p>

  return (
    <div className="pb-24">
      <p className="typo-body-primary mb-3 text-heading">{`${sessions.length} אימונים נטענו`}</p>
      {sessions.length === 0 ? (
        <p className="typo-h2 text-heading">אין אימונים עדיין</p>
      ) : (
        <ul className="flex flex-col">
          {sessions.map((s) => <SessionReviewCard key={s.id} session={s} onSelect={onSelect} />)}
        </ul>
      )}
      <div ref={sentinel} />
      {isFetchingNextPage && <p className="typo-body py-6 text-center text-lime-400">טוען אימונים נוספים...</p>}
    </div>
  )
}

/** review/SessionReviewCard.tsx */
function SessionReviewCard({ session, onSelect }: { session: Session; onSelect: (s: Session) => void }) {
  const time = session.completed_at ? `${hhmm(new Date(session.started_at))}–${hhmm(new Date(session.completed_at))}` : hhmm(new Date(session.started_at))
  return (
    <li className="mb-3 flex items-center justify-between rounded-2xl border border-gray-800 bg-background-850 p-4">
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="mb-1 flex items-center">
          <Calendar size={14} className="text-lime-500" aria-hidden />
          <span className="typo-caption ms-2 text-gray-400">{formatDayMonth(session.started_at)}</span>
          <span dir="ltr" className="typo-caption-bold ms-2 tabular-nums text-gray-300">{time}</span>
        </div>
        <span className="typo-h4 mb-2 text-heading">{sessionTitle(session.started_at)}</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center">
            <Clock size={14} className="text-background-400" aria-hidden />
            <span className="typo-caption ms-1 text-gray-400">{formatDurationHebrew(session.total_time)}</span>
          </span>
          {session.notes ? (
            <span className="flex items-center">
              <NotepadText size={14} className="text-background-400" aria-hidden />
              <span className="typo-caption ms-1 text-gray-400">יש הערות</span>
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSelect(session)}
        aria-label={`פרטי ${sessionTitle(session.started_at)} מ${formatDayMonth(session.started_at)}`}
        className="ms-4 flex rounded-full bg-background-800 p-3 text-lime-500 transition-transform active:scale-90"
      >
        <ChevronLeft size={20} />
      </button>
    </li>
  )
}
