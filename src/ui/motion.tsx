/**
 * Animated building blocks of the profile screen, ported from BodyBuddy-Client/src/ui:
 * AnimatedNumber, InfoBubble, PagedCardCarousel, HoldButton, DoubleRing.
 * Reanimated becomes requestAnimationFrame / CSS transitions; `style` only carries values computed at runtime.
 */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import ReactDOM from 'react-dom'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- AnimatedNumber ----------

/** A number that counts up/down to its new value (ease-out cubic), with thousands separators */
export function AnimatedNumber({ value, duration = 800, initialValue = 0, className = '' }: { value: number; duration?: number; initialValue?: number; className?: string }) {
  const [shown, setShown] = useState(prefersReducedMotion() ? value : initialValue)
  const fromRef = useRef(shown)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = from + (value - from) * eased
      fromRef.current = v
      setShown(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span className={`tabular-nums ${className}`}>{Math.max(0, Math.round(shown)).toLocaleString('en-US')}</span>
}

// ---------- InfoBubble ----------

const BUBBLE_MAX = 260
const EDGE = 24

/** An info icon; tapping it opens a bubble above it with an arrow pointing at it. Closes on any tap, Escape, or after 6s. */
export function InfoBubble({ message, label, autoHideMs = 6000 }: { message: string; label: string; autoHideMs?: number }) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ left: number; bottom: number; width: number; tail: number } | null>(null)

  const close = useCallback(() => setPos(null), [])

  const toggle = () => {
    if (pos) return close()
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const vw = document.documentElement.clientWidth
    const width = Math.min(BUBBLE_MAX, vw - EDGE * 2)
    const center = r.left + r.width / 2
    const left = Math.min(Math.max(center - width / 2, EDGE), vw - EDGE - width)
    const tail = Math.min(Math.max(center - left, 26), width - 26)
    setPos({ left, bottom: window.innerHeight - r.top + 2, width, tail })
  }

  useEffect(() => {
    if (!pos) return
    const timer = setTimeout(close, autoHideMs)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    const onScroll = () => close()
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [pos, autoHideMs, close])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-expanded={!!pos}
        className={`-my-3 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${pos ? 'text-lime-300' : 'text-background-400 hover:text-heading'}`}
      >
        <Info size={18} strokeWidth={pos ? 2.5 : 2} />
      </button>
      {pos &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[400]" onClick={close}>
            <div
              role="status"
              aria-live="polite"
              className="absolute animate-[bbZoomIn_180ms_cubic-bezier(0.33,1,0.68,1)_both] rounded-2xl border border-zinc-600 bg-zinc-800 p-4 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7)] motion-reduce:animate-none"
              style={{ left: pos.left, bottom: pos.bottom + 10, width: pos.width, transformOrigin: `${pos.tail}px 100%` }}
            >
              <p className="typo-label text-zinc-200">{message}</p>
              <span aria-hidden className="absolute -bottom-[7px] h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-zinc-600 bg-zinc-800" style={{ left: pos.tail }} />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

// ---------- PagedCardCarousel ----------

const PageActiveContext = createContext(true)
/** Whether this carousel page is the one showing (always true outside a carousel) — page animations replay on reveal */
export const useIsCarouselPageActive = () => useContext(PageActiveContext)

/** Horizontal paged cards with dots and arrows; the height follows the active card */
/** Matches gap-6 on the carousel track */
const PAGE_GAP_PX = 24

export function PagedCardCarousel({ pages, label }: { pages: ReactNode[]; label: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const [index, setIndex] = useState(0)
  const [height, setHeight] = useState<number | undefined>(undefined)

  // Height of the active page (pages are different heights), kept in sync as content loads
  useLayoutEffect(() => {
    const el = pageRefs.current[index]
    if (!el) return
    const update = () => setHeight(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [index])

  const onScroll = () => {
    const s = scrollRef.current
    if (!s || !s.clientWidth) return
    // Pages are a gap apart, so one page = its width + the gap
    const pageSpan = s.clientWidth + PAGE_GAP_PX
    const i = Math.round(Math.abs(s.scrollLeft) / pageSpan)
    if (i !== index) setIndex(Math.min(pages.length - 1, Math.max(0, i)))
  }

  const goTo = (i: number) => {
    const el = pageRefs.current[i]
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest', inline: 'start' })
    setIndex(i)
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        // gap-6: the next card's border no longer peeks in at the edge next to the rounded corner
        className="flex snap-x snap-mandatory items-start gap-6 overflow-x-auto overflow-y-hidden transition-[height] duration-300 ease-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height }}
      >
        {pages.map((page, i) => (
          <div
            key={i}
            ref={(n) => { pageRefs.current[i] = n }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} מתוך ${pages.length}`}
            aria-hidden={i !== index}
            className="w-full flex-shrink-0 snap-start"
          >
            <PageActiveContext.Provider value={i === index}>{page}</PageActiveContext.Provider>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-4">
        <CarouselArrow dir="prev" visible={index > 0} onPress={() => goTo(index - 1)} />
        <div className="flex items-center gap-2" aria-hidden>
          {pages.map((_, i) => (
            <span key={i} className={`h-2 rounded-full bg-lime-300 transition-all duration-300 ${i === index ? 'w-6 opacity-100' : 'w-2 opacity-25'}`} />
          ))}
        </div>
        <CarouselArrow dir="next" visible={index < pages.length - 1} onPress={() => goTo(index + 1)} />
      </div>
    </div>
  )
}

function CarouselArrow({ dir, visible, onPress }: { dir: 'prev' | 'next'; visible: boolean; onPress: () => void }) {
  // RTL: "previous" points right, "next" points left
  const Icon = dir === 'next' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={!visible}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label={dir === 'next' ? 'הכרטיס הבא' : 'הכרטיס הקודם'}
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-lime-500/45 bg-lime-500/[0.18] text-lime-300 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <Icon size={16} />
    </button>
  )
}

// ---------- HoldButton ----------

/**
 * Fires only after being held for `holdMs` — a tinted layer fills in while held and drains on release
 * (fillVariant "darken" in the app). Keyboard: hold Space or Enter.
 */
export function HoldButton({
  onComplete, holdMs = 1000, onPressIn, onPressOut, label, className = '', fillClass = 'bg-danger/40', children,
}: { onComplete: () => void; holdMs?: number; onPressIn?: () => void; onPressOut?: () => void; label: string; className?: string; fillClass?: string; children: ReactNode }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = () => {
    if (timer.current) return
    setHolding(true)
    onPressIn?.()
    timer.current = setTimeout(() => {
      timer.current = null
      setHolding(false)
      onPressOut?.()
      onComplete()
    }, holdMs)
  }
  const cancel = () => {
    if (!timer.current) return
    clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
    onPressOut?.()
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => { if (e.button === 0) start() }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start() } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') cancel() }}
      onBlur={cancel}
      className={`relative touch-none select-none overflow-hidden ${className}`}
    >
      <span
        aria-hidden
        className={`absolute inset-0 ${fillClass} ${holding ? 'opacity-100 ease-linear' : 'opacity-0 duration-200 ease-out'} transition-opacity`}
        style={holding ? { transitionDuration: `${holdMs}ms` } : undefined}
      />
      <span className="relative z-10">{children}</span>
    </button>
  )
}

// ---------- DoubleRing ----------

/** Two concentric progress rings (outer = calories, inner = protein) that fill in with a delay */
export function DoubleRing({
  outer, inner, size = 38, strokeWidth = 4, delay = 0,
}: { outer: { progress: number; colorClass: string }; inner: { progress: number; colorClass: string }; size?: number; strokeWidth?: number; delay?: number }) {
  const gap = 2
  const c = size / 2
  const rOuter = c - strokeWidth / 2
  const rInner = rOuter - strokeWidth - gap
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const arc = (r: number, progress: number, colorClass: string, extraDelay: number) => {
    const circ = 2 * Math.PI * r
    const p = on ? Math.min(1, Math.max(0, progress)) : 0
    return (
      <>
        <circle cx={c} cy={c} r={r} strokeWidth={strokeWidth} fill="none" className="stroke-white/[0.08]" />
        <circle
          cx={c}
          cy={c}
          r={r}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - p)}
          className={`${colorClass} transition-[stroke-dashoffset] duration-[800ms] ease-out motion-reduce:transition-none`}
          style={{ transitionDelay: `${delay + extraDelay}ms` }}
        />
      </>
    )
  }

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      {arc(rOuter, outer.progress, outer.colorClass, 0)}
      {arc(rInner, inner.progress, inner.colorClass, 120)}
    </svg>
  )
}
