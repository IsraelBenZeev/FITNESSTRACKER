/**
 * Interactive pieces ported from the app: SlideToConfirm, BottomSheet (ModalBottom), TabsManager,
 * PremiumCheck, StepInput, DurationInput, RestTimer, HistoryImportIsland, WorkoutTimer.
 * `style` only carries values computed while dragging / ticking.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import ReactDOM from 'react-dom'
import { Controller, type Control } from 'react-hook-form'
import { Check, ChevronLeft, History, Minus, Play, Plus, X, type LucideIcon } from 'lucide-react'
import { formatElapsedTime } from '../draftStore'

// ---------- elapsed seconds ----------

export function useElapsedSeconds(startedAt: string | null | undefined): number {
  const calc = () => (startedAt ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)) : 0)
  const [s, setS] = useState(calc)
  useEffect(() => {
    if (!startedAt) return
    setS(calc())
    const id = setInterval(() => setS(calc()), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt])
  return s
}

export function WorkoutTimer({ startedAt }: { startedAt: string }) {
  const s = useElapsedSeconds(startedAt)
  return (
    <span role="timer" aria-label={`זמן אימון ${formatElapsedTime(s)}`} className="rounded-2xl border border-white/5 bg-background-800 px-3 py-1.5">
      <span dir="ltr" className="typo-h4 font-mono tabular-nums text-lime-500">{formatElapsedTime(s)}</span>
    </span>
  )
}

// ---------- SlideToConfirm ----------

const SLIDE_H = 64
const SLIDE_PAD = 5
const THUMB = SLIDE_H - SLIDE_PAD * 2

/** "Slide to start": drag the circle across the track (right → left in RTL). Enter/Space also confirm. */
export function SlideToConfirm({ label, onConfirm, ariaLabel }: { label: string; onConfirm: () => void; ariaLabel: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const start = useRef({ px: 0, x: 0 })
  const maxX = () => Math.max(1, (trackRef.current?.clientWidth ?? 300) - THUMB - SLIDE_PAD * 2)

  const complete = useCallback(() => {
    setConfirmed(true)
    setX(maxX())
    onConfirm()
    setTimeout(() => { setConfirmed(false); setX(0) }, 900)
  }, [onConfirm])

  function onPointerDown(e: React.PointerEvent) {
    if (confirmed) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { px: e.clientX, x }
    setDragging(true)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return
    // the thumb starts at the right edge and travels left
    setX(Math.min(maxX(), Math.max(0, start.current.x + (start.current.px - e.clientX))))
  }
  function onPointerUp() {
    if (!dragging) return
    setDragging(false)
    if (x >= maxX() * 0.9) complete()
    else setX(0)
  }

  const progress = x / maxX()
  return (
    <div
      ref={trackRef}
      dir="ltr"
      className="relative h-16 w-full select-none overflow-hidden rounded-full border border-lime-500/60 bg-background-900 touch-none"
    >
      <div className="pointer-events-none absolute inset-0 bg-lime-500/20" />
      <div
        className={`pointer-events-none absolute bottom-0 right-0 top-0 rounded-full bg-lime-500/[0.34] ${dragging ? '' : 'transition-[width] duration-300'}`}
        style={{ width: THUMB + SLIDE_PAD + x }}
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 px-[74px]"
        style={{ opacity: Math.max(0, 1 - progress / 0.6) }}
      >
        <ChevronLeft size={18} className="animate-bb-nudge text-lime-500 motion-reduce:animate-none" aria-hidden />
        <span className="typo-btn-cta animate-bb-shimmer truncate text-lime-300 motion-reduce:animate-none">{label}</span>
      </div>
      <button
        type="button"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); complete() } }}
        className={`absolute top-[5px] flex h-[54px] w-[54px] cursor-grab items-center justify-center rounded-full border border-lime-300/75 bg-lime-500/45 shadow-md shadow-black active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 ${dragging ? '' : 'transition-[right] duration-300'}`}
        style={{ right: SLIDE_PAD + x }}
      >
        {confirmed ? <Check size={26} className="text-lime-300" /> : <Play size={24} fill="currentColor" className="text-lime-300" />}
      </button>
    </div>
  )
}

// ---------- BottomSheet ----------

/** The app's ModalBottom: a sheet from the bottom with a title and a close button */
export function BottomSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="סגור" onClick={onClose} className="absolute inset-0 animate-[pageEnter_0.2s_ease] bg-black/60" />
      <div className="relative flex max-h-[90dvh] min-h-[50dvh] animate-[trayIn_0.28s_cubic-bezier(0.2,0.8,0.2,1)] flex-col rounded-t-3xl border-t border-white/10 bg-background-900 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex justify-center pt-2.5"><span className="h-1 w-10 rounded-full bg-white/20" /></div>
        <div className="flex items-center justify-between px-5 pb-2 pt-2">
          <h2 className="typo-h4 text-heading">{title}</h2>
          <CloseX onPress={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function CloseX({ onPress }: { onPress: () => void }) {
  return (
    <button type="button" onClick={onPress} aria-label="סגור" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background-800 text-heading active:scale-90">
      <X size={22} />
    </button>
  )
}

// ---------- TabsManager ----------

/** Pill tabs with a sliding capsule (BodyBuddy-Client/src/Features/exercises/TabsMenager) */
export function TabsManager({ tabs }: { tabs: { title: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0)
  const touch = useRef<number | null>(null)
  return (
    <div className="w-full">
      <div role="tablist" className="relative mx-6 mb-2 mt-4 flex h-12 items-center overflow-hidden rounded-full border border-gray-800 bg-background-850 p-1">
        <span
          aria-hidden
          className="absolute top-1 h-10 rounded-3xl border border-lime-500 bg-background-700 transition-[right] duration-300 ease-out"
          style={{ width: `calc((100% - 8px) / ${tabs.length})`, right: `calc(4px + (100% - 8px) / ${tabs.length} * ${active})` }}
        />
        {tabs.map((t, i) => (
          <button
            key={t.title}
            type="button"
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`typo-body-primary relative z-10 flex h-10 flex-1 items-center justify-center ${active === i ? 'text-lime-500' : 'text-gray-500'}`}
          >
            {t.title}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        className="p-6"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touch.current == null) return
          const dx = e.changedTouches[0].clientX - touch.current
          touch.current = null
          // RTL: swipe left → next tab
          if (dx < -50 && active < tabs.length - 1) setActive(active + 1)
          if (dx > 50 && active > 0) setActive(active - 1)
        }}
      >
        {tabs[active].content}
      </div>
    </div>
  )
}

// ---------- PremiumCheck ----------

/** Set "done" check with a ring burst (BodyBuddy-Client PremiumCheck) */
export function PremiumCheck({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  const [burst, setBurst] = useState(0)
  return (
    <span className="relative flex items-center justify-center">
      {burst > 0 && <span key={burst} aria-hidden className="pointer-events-none absolute h-9 w-9 animate-bb-burst rounded-xl border-2 border-lime-300" />}
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={() => { if (checked) return; setBurst((b) => b + 1); onPress() }}
        className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-colors duration-200 active:scale-[0.82] ${checked ? 'border-lime-300 bg-lime-300' : 'border-background-600 bg-transparent'}`}
      >
        {checked && <Check size={20} strokeWidth={3.5} className="animate-bb-zoom text-black" />}
      </button>
    </span>
  )
}

// ---------- StepInput / DurationInput ----------

function useHoldRepeat() {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    if (delay.current) clearTimeout(delay.current)
    timer.current = null
    delay.current = null
  }, [])
  useEffect(() => stop, [stop])
  /** fires once now, then every 100ms after a 300ms hold */
  const start = useCallback((fn: () => void) => {
    stop()
    fn()
    delay.current = setTimeout(() => { timer.current = setInterval(fn, 100) }, 300)
  }, [stop])
  return { start, stop }
}

function StepButton({ kind, onStep, stop, label }: { kind: 'minus' | 'plus'; onStep: () => void; stop: () => void; label: string }) {
  const Icon = kind === 'plus' ? Plus : Minus
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); onStep() }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStep(); stop() } }}
      className={`flex h-10 w-10 flex-shrink-0 touch-none items-center justify-center rounded-full border transition-transform duration-100 active:scale-90 ${
        kind === 'plus' ? 'border-lime-500/45 bg-lime-500/20 text-lime-300' : 'border-white/10 bg-background-800 text-heading'
      }`}
    >
      <Icon size={22} strokeWidth={2.5} />
    </button>
  )
}

function TenToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label="קפיצות של 10"
      onClick={onToggle}
      className={`rounded-full border px-2 py-1 transition-colors ${on ? 'border-lime-500/60 bg-lime-500/20 text-lime-400' : 'border-white/10 bg-background-800 text-zinc-400'}`}
    >
      <span className="typo-caption">10+</span>
    </button>
  )
}

/** −/+ number field with hold-to-repeat and a ×10 toggle (BodyBuddy-Client StepInput) */
export function StepInput({ control, name, label, unit, icon: Icon }: { control: Control<any>; name: string; label: string; unit?: string; icon: LucideIcon }) {
  const [ten, setTen] = useState(false)
  const step = ten ? 10 : 1
  const { start, stop } = useHoldRepeat()
  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <div className="flex items-center justify-center gap-2">
        <Icon size={18} className="text-background-300" aria-hidden />
        <span className="typo-caption-bold uppercase text-zinc-400">{label}</span>
        <TenToggle on={ten} onToggle={() => setTen((t) => !t)} />
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => {
          const ref = { v: Number(value) || 0 }
          const bump = (d: number) => {
            const next = Math.max(0, ref.v + d)
            if (next === ref.v) return
            ref.v = next
            onChange(next)
          }
          return (
            <div className="flex items-center rounded-2xl border border-white/5 bg-zinc-900">
              <StepButton kind="minus" label={`הפחת ${label}`} onStep={() => start(() => bump(-step))} stop={stop} />
              <span className="flex min-w-[30px] items-center justify-center px-4">
                <AnimatedNumber value={Number(value) || 0} />
              </span>
              <StepButton kind="plus" label={`הוסף ${label}`} onStep={() => start(() => bump(step))} stop={stop} />
            </div>
          )
        }}
      />
      {!!unit && <span className="typo-caption -mt-1 text-zinc-400">{unit}</span>}
    </div>
  )
}

/** Minutes : seconds steppers for duration fields (BodyBuddy-Client DurationInput) */
export function DurationInput({ control, name, label, icon: Icon }: { control: Control<any>; name: string; label: string; icon: LucideIcon }) {
  const [ten, setTen] = useState(false)
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-2">
        <Icon size={18} className="text-background-300" aria-hidden />
        <span className="typo-caption-bold uppercase text-zinc-400">{label}</span>
        <TenToggle on={ten} onToggle={() => setTen((t) => !t)} />
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => {
          const total = Math.max(0, Number(value) || 0)
          const unitBox = (amount: number, unit: string, step: number) => {
            const s = ten ? step * 10 : step
            return (
              <div className="flex flex-1 flex-col items-center gap-1">
                <div className="flex items-center rounded-2xl border border-white/5 bg-zinc-900 p-1">
                  <button type="button" aria-label={`הפחת ${unit}`} onClick={() => total - s >= 0 && onChange(total - s)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-background-800 text-heading active:scale-90">
                    <Minus size={22} />
                  </button>
                  <span dir="ltr" className="min-w-[44px] text-center text-2xl font-black tabular-nums text-heading">{String(amount).padStart(2, '0')}</span>
                  <button type="button" aria-label={`הוסף ${unit}`} onClick={() => onChange(total + s)} className="flex h-9 w-9 items-center justify-center rounded-full border border-lime-500/45 bg-lime-500/20 text-lime-300 active:scale-90">
                    <Plus size={22} />
                  </button>
                </div>
                <span className="typo-caption text-zinc-400">{unit}</span>
              </div>
            )
          }
          return (
            <div className="flex w-full items-start gap-3">
              {unitBox(Math.floor(total / 60), 'דקות', 60)}
              <span className="pt-2 text-2xl font-black text-zinc-500">:</span>
              {unitBox(total % 60, 'שניות', 1)}
            </div>
          )
        }}
      />
    </div>
  )
}

/** Number that slides when it changes (stand-in for react-native-animated-numbers) */
function AnimatedNumber({ value }: { value: number }) {
  return (
    <span key={value} dir="ltr" className="animate-bb-tick text-2xl font-black tabular-nums text-heading motion-reduce:animate-none">
      {value}
    </span>
  )
}

// ---------- RestTimer ----------

const mmss = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** Rest between two sets: counts up until the next set is checked, then freezes */
export function RestTimer({ startTime, endTime }: { startTime: number; endTime: number | null }) {
  const frozen = endTime != null
  const [elapsed, setElapsed] = useState(() => (frozen ? endTime - startTime : Date.now() - startTime))
  useEffect(() => {
    if (frozen) { setElapsed(endTime - startTime); return }
    const id = setInterval(() => setElapsed(Date.now() - startTime), 1000)
    return () => clearInterval(id)
  }, [startTime, endTime, frozen])
  return (
    <div className="flex animate-[pageEnter_0.3s_ease] items-center justify-center gap-2 py-2">
      <span className="h-px flex-1 bg-white/10" />
      <span className={`flex items-center gap-1.5 rounded-full border bg-background-800 px-3 py-1.5 ${frozen ? 'border-lime-500/30' : 'border-white/10'}`}>
        {frozen ? <span className="typo-caption text-lime-500">✓</span> : <span className="h-1.5 w-1.5 animate-bb-blink rounded-full bg-lime-400" />}
        <span className={`typo-caption-bold font-mono ${frozen ? 'text-lime-500' : 'text-white/50'}`}>
          מנוחה: <span dir="ltr">{mmss(elapsed)}</span>
        </span>
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  )
}

// ---------- HistoryImportIsland ----------

/** Floating notice: last workout's sets were filled in, with a countdown ring and "cancel" */
export function HistoryImportIsland({ visible, durationMs, onCancel }: { visible: boolean; durationMs: number; onCancel: () => void }) {
  if (!visible) return null
  const R = 14.75
  const C = 2 * Math.PI * R
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-2 z-50 flex justify-center">
      <div role="status" className="pointer-events-auto flex animate-bb-drop items-center gap-2.5 rounded-full border border-lime-500/35 bg-background-1000 p-1.5 shadow-md shadow-black">
        <span className="relative flex h-8 w-8 items-center justify-center">
          <svg width={32} height={32} className="absolute -rotate-90" aria-hidden>
            <circle cx={16} cy={16} r={R} strokeWidth={2.5} fill="none" className="stroke-lime-500/20" />
            <circle
              cx={16} cy={16} r={R} strokeWidth={2.5} fill="none" strokeLinecap="round"
              strokeDasharray={C}
              className="animate-bb-countdown stroke-lime-300"
              style={{ ['--bb-circ' as string]: `${C}px`, animationDuration: `${durationMs}ms` }}
            />
          </svg>
          <History size={16} className="text-lime-300" aria-hidden />
        </span>
        <span className="typo-caption-bold text-heading">הסטים מהאימון הקודם הוכנסו</span>
        <button type="button" onClick={onCancel} className="flex min-h-8 items-center justify-center rounded-full border border-lime-500/45 bg-lime-500/[0.18] px-3">
          <span className="typo-caption-bold text-lime-300">בטל</span>
        </button>
      </div>
    </div>
  )
}
