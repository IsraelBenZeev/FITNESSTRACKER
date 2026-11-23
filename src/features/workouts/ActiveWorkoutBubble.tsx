import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { draftStore, formatElapsedTime, shouldShowWorkoutBubble, useDraftStore, type BubblePosition, type WorkoutDraft } from './draftStore'
import { usePlan } from './hooks'
import { ProgressRing } from './ui/primitives'
import { useElapsedSeconds } from './ui/controls'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { useBbUserId } from '../nutrition/hooks'

export const BUBBLE_SIZE = 80
const EDGE = 12
const TAB_BAR = 80
const TRASH = 56
const TRASH_SNAP = 64

interface Metrics { width: number; height: number }

const bounds = ({ height }: Metrics) => ({ minY: 12, maxY: height - TAB_BAR - 16 - BUBBLE_SIZE })

/** Bubble's top-left corner on screen (physical pixels) */
export function getBubbleFrame(position: BubblePosition | null, m: Metrics) {
  const { minY, maxY } = bounds(m)
  const y = Math.min(maxY, Math.max(minY, position?.y ?? m.height * 0.6))
  const x = position?.side === 'left' ? EDGE : m.width - BUBBLE_SIZE - EDGE
  return { x, y }
}

export function useWindowSize(): Metrics {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const on = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return size
}

/** Ring that fills toward the plan's planned time, with the short title and elapsed time */
const BubbleContent = memo(({ startedAt, title, plannedMinutes }: { startedAt: string; title: string; plannedMinutes?: number | null }) => {
  const full = (plannedMinutes && plannedMinutes > 0 ? plannedMinutes : 120) * 60
  const elapsed = useElapsedSeconds(startedAt)
  const step = Math.min(30, Math.max(1, Math.round(full / 200)))
  const t = title.trim()
  const short = t.length > 10 ? `${t.slice(0, 10).trimEnd()}...` : t
  return (
    <ProgressRing progress={(Math.floor(elapsed / step) * step) / full} size={BUBBLE_SIZE - 4} strokeWidth={4}>
      <span className="typo-caption max-w-[64px] truncate text-background-400">{short}</span>
      <span dir="ltr" className="typo-caption-bold font-mono text-lime-300">{formatElapsedTime(elapsed)}</span>
    </ProgressRing>
  )
})
BubbleContent.displayName = 'BubbleContent'

function Bubble({ draft }: { draft: WorkoutDraft }) {
  const navigate = useNavigate()
  const metrics = useWindowSize()
  const position = useDraftStore((s) => s.bubblePosition)
  const { data: plan } = usePlan(draft.planId)
  const rest = getBubbleFrame(position, metrics)
  const [pos, setPos] = useState(rest)
  const [dragging, setDragging] = useState(false)
  const [overTrash, setOverTrash] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const start = useRef({ px: 0, py: 0, x: 0, y: 0, moved: false })
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { if (!dragging) setPos(getBubbleFrame(draftStore.get().bubblePosition, metrics)) }, [metrics, dragging])

  const trashX = metrics.width / 2
  const trashY = metrics.height - TAB_BAR - 32 - TRASH / 2

  const open = useCallback(() => {
    setLeaving(true)
    setTimeout(() => navigate(`/workout/plan/${draft.planId}?resume=1`), 140)
  }, [navigate, draft.planId])

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y, moved: false }
    longPress.current = setTimeout(() => { if (!start.current.moved) setDiscardOpen(true) }, 450)
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = start.current
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const dx = e.clientX - s.px
    const dy = e.clientY - s.py
    if (!s.moved && Math.hypot(dx, dy) < 6) return
    if (!s.moved) { s.moved = true; setDragging(true); if (longPress.current) clearTimeout(longPress.current) }
    const nx = Math.min(metrics.width - BUBBLE_SIZE, Math.max(0, s.x + dx))
    const ny = Math.min(metrics.height - BUBBLE_SIZE - 8, Math.max(12, s.y + dy))
    const near = Math.hypot(nx + BUBBLE_SIZE / 2 - trashX, ny + BUBBLE_SIZE / 2 - trashY) < TRASH_SNAP
    setOverTrash(near)
    setPos(near ? { x: trashX - BUBBLE_SIZE / 2, y: trashY - BUBBLE_SIZE / 2 } : { x: nx, y: ny })
  }
  function onPointerUp() {
    if (longPress.current) clearTimeout(longPress.current)
    const s = start.current
    if (!s.moved) { if (!discardOpen) open(); return }
    setDragging(false)
    if (overTrash) { setDiscardOpen(true); return }
    const side = pos.x + BUBBLE_SIZE / 2 < metrics.width / 2 ? 'left' : 'right'
    const { minY, maxY } = bounds(metrics)
    const y = Math.min(maxY, Math.max(minY, pos.y))
    draftStore.setBubblePosition({ side, y })
    setPos(getBubbleFrame({ side, y }, metrics))
  }

  return (
    <>
      <ConfirmDialog
        visible={discardOpen}
        title="ביטול האימון"
        message="האם אתה בטוח שברצונך לבטל את האימון? ההתקדמות לא תישמר."
        confirmLabel="בטל אימון"
        cancelLabel="המשך אימון"
        icon={X}
        onConfirm={() => { setDiscardOpen(false); draftStore.clearDraft() }}
        onCancel={() => { setDiscardOpen(false); setOverTrash(false); setPos(getBubbleFrame(draftStore.get().bubblePosition, metrics)) }}
      />
      <div dir="ltr" className="pointer-events-none fixed inset-0 z-[150]">
        <span
          aria-hidden
          className={`absolute flex items-center justify-center rounded-full border border-danger/45 bg-danger/[0.14] text-danger transition-[opacity,transform] duration-200 ${dragging ? 'opacity-100' : 'translate-y-6 opacity-0'} ${overTrash ? 'scale-[1.2]' : ''}`}
          style={{ left: trashX - TRASH / 2, top: trashY - TRASH / 2, width: TRASH, height: TRASH }}
        >
          <X size={26} />
        </span>
        <button
          type="button"
          aria-label={`חזור לאימון: ${draft.planTitle}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } if (e.key === 'Delete') setDiscardOpen(true) }}
          className={`pointer-events-auto absolute left-0 top-0 flex touch-none items-center justify-center rounded-full border border-lime-500/45 bg-background-900 shadow-lg shadow-black ${dragging ? '' : 'transition-transform duration-300 ease-out'} ${leaving ? 'opacity-0 transition-opacity duration-150' : 'animate-bb-land'}`}
          style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE, transform: `translate(${pos.x}px, ${pos.y}px) scale(${dragging ? (overTrash ? 0.85 : 1.08) : leaving ? 1.08 : 1})` }}
        >
          <BubbleContent startedAt={draft.startedAt} title={draft.planTitle} plannedMinutes={plan?.time} />
        </button>
      </div>
    </>
  )
}

/** Floating bubble while a workout is open but not on screen (minimized, or left by accident) */
export function ActiveWorkoutBubble() {
  const userId = useBbUserId()
  const draft = useDraftStore((s) => s.draft)
  const sessionOpen = useDraftStore((s) => s.openSession !== null)
  const { pathname } = useLocation()
  const onWorkoutScreen = useMemo(() => pathname.startsWith('/workout/plan/'), [pathname])
  if (!draft || !userId || draft.userId !== userId || !shouldShowWorkoutBubble(draft) || sessionOpen || onWorkoutScreen) return null
  return <Bubble draft={draft} />
}
