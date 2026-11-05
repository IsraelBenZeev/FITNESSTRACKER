import { Fragment } from 'react'
import { MealIcon } from '../../shared/icons/MealIcon'
import type { NutritionLog } from '../../types/nutrition'

interface DayTimelineProps {
  meals: NutritionLog[]
  onSelect: (meal: NutritionLog) => void
}

const nowHHMM = () => new Date().toTimeString().slice(0, 5)

/**
 * The day as a vertical timeline (RTL: time column on the right).
 * A "now" marker sits between what was eaten and what is still ahead.
 */
export function DayTimeline({ meals, onSelect }: DayTimelineProps) {
  const now = nowHHMM()
  const nowIndex = (() => {
    const i = meals.findIndex((m) => m.time != null && m.time.slice(0, 5) > now)
    return i === -1 ? meals.length : i
  })()

  return (
    <ol className="relative flex flex-col">
      {/* Rail */}
      <span aria-hidden className="absolute bottom-3 start-[73.5px] top-3 w-px bg-border-col" />

      {meals.map((meal, i) => (
        <Fragment key={meal.id}>
          {i === nowIndex && <NowMarker time={now} />}
          <li>
            <button
              type="button"
              onClick={() => onSelect(meal)}
              aria-label={`עריכת ${meal.meal_name}${meal.time ? ` משעה ${meal.time.slice(0, 5)}` : ''}`}
              className="group flex w-full items-start gap-3 rounded-xl py-3 pe-2 text-right transition-colors duration-150 hover:bg-surface active:bg-surface2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]"
            >
              {/* Time */}
              <span className="w-11 flex-shrink-0 pt-2 text-left font-body text-xs tabular-nums text-muted">
                {meal.time ? meal.time.slice(0, 5) : '—'}
              </span>

              {/* Node on the rail */}
              <span className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border-col bg-bg text-muted transition-colors duration-150 group-hover:border-accent/50 group-hover:text-accent">
                <MealIcon mealName={meal.meal_name} size={17} color="currentColor" />
              </span>

              {/* Content */}
              <span className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-body text-[15px] font-medium text-text-col">{meal.meal_name}</span>
                  <span className="flex flex-shrink-0 items-baseline gap-1">
                    <span className="font-display text-[22px] font-semibold leading-none tabular-nums text-text-col">
                      {Math.round(meal.calories).toLocaleString('he-IL')}
                    </span>
                    <span className="font-body text-xs text-muted">קל'</span>
                  </span>
                </span>
                {meal.food_items && (
                  <span className="line-clamp-2 font-body text-sm leading-snug text-muted">{meal.food_items}</span>
                )}
                <span className="flex flex-wrap gap-x-3 font-body text-xs tabular-nums text-muted">
                  {meal.protein_g != null && (
                    <span>
                      חלבון <span className="font-medium text-accent">{Math.round(meal.protein_g)}g</span>
                    </span>
                  )}
                  {meal.carbs_g != null && <span>פחמ' {Math.round(meal.carbs_g)}g</span>}
                  {meal.fat_g != null && <span>שומן {Math.round(meal.fat_g)}g</span>}
                </span>
              </span>
            </button>
          </li>
        </Fragment>
      ))}
      {nowIndex === meals.length && <NowMarker time={now} />}
    </ol>
  )
}

function NowMarker({ time }: { time: string }) {
  return (
    <li aria-label={`עכשיו ${time}`} className="flex items-center gap-3 py-2">
      <span className="w-11 flex-shrink-0 text-left font-body text-xs font-medium tabular-nums text-accent">{time}</span>
      <span className="relative z-10 flex w-9 flex-shrink-0 justify-center">
        <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px_rgba(150,200,40,0.15)]" />
      </span>
      <span className="flex flex-1 items-center gap-2">
        <span className="font-body text-xs font-medium text-accent">עכשיו</span>
        <span className="h-px flex-1 bg-gradient-to-l from-accent/50 to-transparent" />
      </span>
    </li>
  )
}
