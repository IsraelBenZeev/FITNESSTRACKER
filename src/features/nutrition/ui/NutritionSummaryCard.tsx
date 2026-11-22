import { useEffect, useState } from 'react'
import type { Macros } from '../types'

const fmtAbs = (n: number) => Math.round(Math.abs(n)).toLocaleString('he-IL')

interface NutritionSummaryCardProps {
  /** The food / meal being added */
  totals: Macros
  goals: { calories: number; protein: number }
  /** Already eaten today */
  consumed: { calories: number; protein: number }
  /** Ingredients already in the meal being built — they count toward what's left */
  baseTotals?: Macros
}

/**
 * The app's summary card: a double ring (outer (lime) = share of the calorie goal, inner (blue) = share of the protein goal)
 * around the calories, the macros beside it, and "what will be left for today" under it.
 */
export function NutritionSummaryCard({ totals, goals, consumed, baseTotals }: NutritionSummaryCardProps) {
  const afterCalories = consumed.calories + (baseTotals?.calories ?? 0) + totals.calories
  const afterProtein = consumed.protein + (baseTotals?.protein ?? 0) + totals.protein
  const caloriesLeft = goals.calories - afterCalories
  const proteinLeft = goals.protein - afterProtein
  const hasGoals = goals.calories > 0 && goals.protein > 0

  return (
    <section aria-label="סיכום ערכים" className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center gap-4">
        <div className="relative flex h-28 w-28 flex-shrink-0 items-center justify-center">
          {hasGoals && (
            <DoubleRing
              outer={totals.calories / goals.calories}
              inner={totals.protein / goals.protein}
            />
          )}
          <span className="relative flex flex-col items-center">
            <span className="font-display text-3xl font-bold leading-none tabular-nums text-heading">{fmtAbs(totals.calories)}</span>
            <span className="font-body text-xs text-muted">קק״ל</span>
          </span>
        </div>

        <ul className="flex flex-1 flex-col gap-2">
          {[
            { label: 'חלבון', value: totals.protein, dot: 'bg-macro-protein' },
            { label: 'פחמימות', value: totals.carbs, dot: 'bg-macro-carbs' },
            { label: 'שומן', value: totals.fat, dot: 'bg-macro-fat' },
          ].map((m) => (
            <li key={m.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span aria-hidden className={`h-2 w-2 rounded-full ${m.dot}`} />
                <span className="font-body text-sm text-muted">{m.label}</span>
              </span>
              <span className="font-body text-base font-semibold tabular-nums text-heading">{Math.round(m.value)}g</span>
            </li>
          ))}
        </ul>
      </div>

      {hasGoals && (
        <div className="flex flex-col gap-2 border-t border-white/[0.08] pt-3" aria-live="polite">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-muted">מה יישאר לך להיום</span>
          <p className="font-body text-sm text-muted">
            <span className={`text-base font-semibold tabular-nums ${caloriesLeft < 0 ? 'text-danger' : 'text-accent'}`}>{fmtAbs(caloriesLeft)}</span>
            {caloriesLeft < 0 ? ' קלוריות מעל היעד להיום' : ' קלוריות יישארו לך להיום'}
          </p>
          <p className="font-body text-sm text-muted">
            <span className={`text-base font-semibold tabular-nums ${proteinLeft < 0 ? 'text-danger' : 'text-macro-protein'}`}>{fmtAbs(proteinLeft)}</span>
            {proteinLeft < 0 ? ' גרם חלבון מעל היעד להיום' : ' גרם חלבון יישארו לך להיום'}
          </p>
        </div>
      )}
    </section>
  )
}

const SIZE = 112
const STROKE = 9

/** Two concentric rings (Apple Activity style); each fills with an animation */
function DoubleRing({ outer, inner }: { outer: number; inner: number }) {
  const c = SIZE / 2
  const outerR = (SIZE - STROKE) / 2
  const innerR = outerR - STROKE - 2
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden>
      <Arc c={c} r={outerR} progress={outer} color="stroke-accent" delay="delay-0" />
      <Arc c={c} r={innerR} progress={inner} color="stroke-macro-protein" delay="delay-150" />
    </svg>
  )
}

function Arc({ c, r, progress, color, delay }: { c: number; r: number; progress: number; color: string; delay: string }) {
  const circumference = 2 * Math.PI * r
  // Start empty, then fill — so the ring animates on open and on every change
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0))))
    return () => cancelAnimationFrame(id)
  }, [progress])
  return (
    <>
      <circle cx={c} cy={c} r={r} fill="none" strokeWidth={STROKE} className="stroke-white/[0.08]" />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - shown)}
        className={`${color} transition-[stroke-dashoffset] duration-700 ease-out ${delay}`}
      />
    </>
  )
}
