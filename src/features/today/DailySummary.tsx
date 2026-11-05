import { useEffect, useRef, useState } from 'react'
import { Check, SlidersHorizontal } from 'lucide-react'
import { ProgressBar } from '../../shared/components/ProgressBar'

interface Totals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface DailySummaryProps {
  totals: Totals
  goalCalories: number
  goalProtein: number
  isTrainingDay: boolean
  onEditGoals: () => void
}

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

/**
 * The day's answer, written as a sentence ("1,240 calories and 47g protein left"),
 * plus a compact strip that pins to the top once the full block scrolls away.
 */
export function DailySummary({ totals, goalCalories, goalProtein, isTrainingDay, onEditGoals }: DailySummaryProps) {
  const calLeft = goalCalories - totals.calories
  const proteinLeft = goalProtein - totals.protein
  const calOver = calLeft < 0
  const proteinDone = proteinLeft <= 0

  const sectionRef = useRef<HTMLElement>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    // <main> starts under the ~60px sticky Header; collapse once the block's bottom passes under it.
    const io = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry!.isIntersecting && entry!.boundingClientRect.top < 120),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* Compact strip: zero-height sticky anchor so it never shifts layout */}
      <div className="sticky top-0 z-20 -mx-4 -mb-7 h-0">
        <div
          aria-hidden={!collapsed}
          className={`flex items-center gap-4 border-b border-border-col bg-bg/85 px-4 py-2.5 backdrop-blur-md transition-[opacity,transform] duration-200 ease-out
            ${collapsed ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}
        >
          <StripStat
            value={calOver ? `+${fmt(-calLeft)}` : fmt(calLeft)}
            label={calOver ? "קל' חריגה" : "קל' נשארו"}
            danger={calOver}
          />
          <span className="h-5 w-px bg-border-col" aria-hidden />
          <StripStat
            value={proteinDone ? fmt(totals.protein) : fmt(proteinLeft)}
            label={proteinDone ? 'g חלבון, הושג' : 'g חלבון חסר'}
            done={proteinDone}
          />
        </div>
      </div>

      <section ref={sectionRef} aria-label="סיכום יומי" className="flex flex-col gap-5 rounded-2xl border border-border-col bg-surface px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-body text-sm text-muted">
            {isTrainingDay ? 'יום אימון' : 'יום מנוחה'}
            <span className="mx-1.5" aria-hidden>·</span>
            יעד {fmt(goalCalories)} קל'
          </span>
          <button
            type="button"
            onClick={onEditGoals}
            aria-label="עריכת יעדים"
            className="-me-2.5 flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors duration-200 hover:bg-surface2 hover:text-text-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]"
          >
            <SlidersHorizontal size={19} strokeWidth={1.75} />
          </button>
        </div>

        {/* The answer, as a sentence */}
        <p className="font-body text-xl leading-snug text-text-col [text-wrap:balance]">
          {calOver ? (
            <>
              חרגת ב-
              <span className="font-display text-[44px] font-bold leading-none tabular-nums text-danger">{fmt(-calLeft)}</span>
              {' '}קלוריות
            </>
          ) : (
            <>
              נשארו{' '}
              <span className="font-display text-[44px] font-bold leading-none tabular-nums text-accent">{fmt(calLeft)}</span>
              {' '}קלוריות
            </>
          )}
          <br />
          {proteinDone ? (
            <span className="inline-flex items-center gap-1.5 text-base text-muted">
              <Check size={16} strokeWidth={2.5} className="text-accent" />
              יעד החלבון הושג
            </span>
          ) : (
            <span className="text-base text-muted">
              ועוד <span className="font-medium tabular-nums text-text-col">{fmt(proteinLeft)}g</span> חלבון ליעד
            </span>
          )}
        </p>

        <div className="flex flex-col gap-3.5">
          <ProgressBar value={totals.calories} goal={goalCalories} label="נאכלו" unit=" קל'" size="primary" />
          <ProgressBar value={totals.protein} goal={goalProtein} label="חלבון" unit="g" />
        </div>

        <p className="font-body text-sm tabular-nums text-muted">
          פחמימות <span className="text-text-col">{fmt(totals.carbs)}g</span>
          <span className="mx-2" aria-hidden>·</span>
          שומן <span className="text-text-col">{fmt(totals.fat)}g</span>
        </p>
      </section>
    </>
  )
}

function StripStat({ value, label, danger, done }: { value: string; label: string; danger?: boolean; done?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`font-display text-xl font-bold leading-none tabular-nums ${danger ? 'text-danger' : done ? 'text-text-col' : 'text-accent'}`}>
        {value}
      </span>
      <span className="font-body text-xs text-muted">{label}</span>
    </span>
  )
}
