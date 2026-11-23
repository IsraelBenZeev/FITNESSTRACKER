import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, Dumbbell, ListPlus } from 'lucide-react'
import { usePlans } from './hooks'
import { Loading } from './ui/primitives'
import { CardPlan, CARD_WIDTH } from './CardPlan'

const GAP = 15

/**
 * "האימונים שלי" — BodyBuddy-Client/src/Features/workoutsPlans/list/WorkoutList.tsx:
 * title, archive button, centered snap carousel of plan cards (newest in the middle on entry), add button.
 */
export function WorkoutsPage() {
  const navigate = useNavigate()
  const { data: plans, isLoading } = usePlans()

  if (isLoading) return <div className="flex flex-1 items-center justify-center bg-background-1200"><Loading size={96} /></div>

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-between bg-background-1200 pt-6">
      <div className="mt-2 flex w-full items-start justify-between px-6">
        <div>
          <h1 className="typo-h1 tracking-tight text-heading">האימונים שלי</h1>
          <span aria-hidden className="mt-2 block h-[5px] w-[60px] rounded-[10px] bg-lime-500" />
          {!!plans?.length && (
            <p className="typo-label mt-2 text-gray-400">
              {plans.length === 1 ? 'יש לך תוכנית אימון אחת' : `יש לך ${plans.length} תוכניות אימון`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => navigate('/workout/archive')}
              aria-label="ארכיון תוכניות"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-lime-500 transition-opacity active:opacity-70"
            >
              <Archive size={22} />
            </button>
            <span aria-hidden className="typo-caption text-background-400">ארכיון</span>
          </div>
        </div>
      </div>

      {plans && plans.length > 0 ? (
        <PlansCarousel plans={plans} />
      ) : (
        <div className="mx-6 my-auto flex flex-col items-center gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/80 px-6 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-500/15 text-lime-500"><Dumbbell size={32} /></span>
          <h2 className="typo-h3 text-heading">עדיין אין לך תוכניות אימון</h2>
          <p className="typo-label text-zinc-400">זה הזמן ליצור את האימון הראשון שלך ולהתחיל להתקדם למטרה!</p>
          <button type="button" onClick={() => navigate('/workout/form/create')} className="typo-btn-cta flex items-center gap-2 rounded-full border border-lime-500 bg-background-700 px-6 py-3 text-lime-300">
            <ListPlus size={22} /> צור אימון חדש
          </button>
        </div>
      )}

      {!!plans?.length && (
        <div className="flex w-full justify-end px-10 pb-4">
          <button
            type="button"
            onClick={() => navigate('/workout/form/create')}
            aria-label="צור אימון חדש"
            className="flex h-16 w-16 items-center justify-center rounded-full border border-lime-500/50 bg-lime-500/20 text-lime-300 shadow-md shadow-black transition-opacity active:opacity-70"
          >
            <ListPlus size={36} />
          </button>
        </div>
      )}
    </div>
  )
}

/** Centered snap carousel: side cards shrink to 0.9 and fade to 0.5 (CustomCarousel variant="center") */
function PlansCarousel({ plans }: { plans: NonNullable<ReturnType<typeof usePlans>['data']> }) {
  // The app reverses the list and opens on the last item, so the newest plan starts in the middle
  const ordered = useMemo(() => [...plans].reverse(), [plans])
  const scroller = useRef<HTMLDivElement>(null)
  const [scrollX, setScrollX] = useState(0)
  const [pad, setPad] = useState(0)
  const step = CARD_WIDTH + GAP
  const activeIndex = Math.round(scrollX / step)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => setPad(Math.max(16, (el.clientWidth - CARD_WIDTH) / 2))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el || !pad) return
    el.scrollLeft = (ordered.length - 1) * step
    setScrollX(el.scrollLeft)
    // only on first layout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pad])

  const onScroll = useCallback(() => setScrollX(scroller.current?.scrollLeft ?? 0), [])

  return (
    <div className="flex w-full flex-1 items-center">
      <div
        ref={scroller}
        dir="ltr"
        onScroll={onScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-visible pb-24 pt-2 [scrollbar-width:none]"
        style={{ paddingInline: pad, gap: GAP }}
        aria-label="תוכניות אימון"
      >
        {ordered.map((plan, i) => {
          const d = Math.min(1, Math.abs(scrollX - i * step) / step)
          return (
            <div
              key={plan.id}
              dir="rtl"
              className="flex-shrink-0 snap-center"
              style={{ width: CARD_WIDTH, transform: `scale(${1 - 0.1 * d})`, opacity: 1 - 0.5 * d, zIndex: i === activeIndex ? 10 : 1 }}
            >
              <CardPlan plan={plan} isActive={i === activeIndex} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
