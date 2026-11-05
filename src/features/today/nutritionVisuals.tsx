/**
 * Small data visuals for the meal / goals forms.
 * Drawn as SVG so segment sizes are attributes (no inline styles), and RTL-aware:
 * segments start at the right edge, like the text.
 */

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const

export function macroKcal(p: number, c: number, f: number) {
  return p * KCAL_PER_G.protein + c * KCAL_PER_G.carbs + f * KCAL_PER_G.fat
}

interface Segment {
  value: number
  className: string // Tailwind fill-* class
}

/** Horizontal stacked bar, right-to-left. Values are absolute; `total` sets the scale. */
function StackedBar({ segments, total, height = 8, label }: { segments: Segment[]; total: number; height?: number; label: string }) {
  const safeTotal = Math.max(total, 1)
  let cursor = 100
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" role="img" aria-label={label} className="block w-full overflow-hidden rounded-full" height={height}>
      <rect x="0" y="0" width="100" height={height} className="fill-bg" />
      {segments.map((s, i) => {
        const w = Math.max(0, Math.min(cursor, (s.value / safeTotal) * 100))
        cursor -= w
        return <rect key={i} x={cursor} y="0" width={w} height={height} className={`${s.className} transition-[x,width] duration-300 ease-out`} />
      })}
    </svg>
  )
}

/** What the calories are made of: protein / carbs / fat share */
export function MacroComposition({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const p = protein * KCAL_PER_G.protein
  const c = carbs * KCAL_PER_G.carbs
  const f = fat * KCAL_PER_G.fat
  const total = p + c + f
  if (total <= 0) return null
  const pct = (n: number) => Math.round((n / total) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <StackedBar
        total={total}
        height={6}
        label={`חלבון ${pct(p)}%, פחמימות ${pct(c)}%, שומן ${pct(f)}%`}
        segments={[
          { value: p, className: 'fill-macro-protein' },
          { value: c, className: 'fill-macro-carbs' },
          { value: f, className: 'fill-macro-fat' },
        ]}
      />
      <div className="flex justify-between font-body text-xs tabular-nums text-muted" aria-hidden>
        <span><span className="text-macro-protein">{pct(p)}%</span> חלבון</span>
        <span><span className="text-macro-carbs">{pct(c)}%</span> פחמ'</span>
        <span><span className="text-macro-fat">{pct(f)}%</span> שומן</span>
      </div>
    </div>
  )
}

/**
 * The day so far + this meal, against the goal.
 * Already eaten = quiet, this meal = accent, anything past the goal = danger.
 */
export function DayFillBar({ before, meal, goal }: { before: number; meal: number; goal: number }) {
  const total = Math.max(goal, before + meal)
  const mealWithin = Math.max(0, Math.min(meal, goal - before))
  const over = Math.max(0, before + meal - Math.max(goal, before))
  return (
    <StackedBar
      total={total}
      height={8}
      label={`נאכלו ${Math.round(before)}, הארוחה ${Math.round(meal)}, יעד ${goal}`}
      segments={[
        { value: before, className: 'fill-subtle' },
        { value: mealWithin, className: 'fill-accent' },
        { value: over, className: 'fill-danger' },
      ]}
    />
  )
}
