import { ChevronLeft } from 'lucide-react'
import { MealIcon } from '../../shared/icons/MealIcon'
import type { NutritionLog } from '../../types/nutrition'

interface MealCardProps {
  meal: NutritionLog
  /** When provided the whole card becomes a button that opens the editor */
  onEdit?: (meal: NutritionLog) => void
}

export function MealCard({ meal, onEdit }: MealCardProps) {
  const interactive = !!onEdit
  const Root = interactive ? 'button' : 'div'

  return (
    <Root
      {...(interactive ? { type: 'button' as const, onClick: () => onEdit(meal) } : {})}
      aria-label={interactive ? `עריכת ${meal.meal_name}` : undefined}
      className={`flex w-full items-start gap-3 rounded-xl border border-border-col border-t-2 border-t-lime bg-surface p-3.5 text-right
        ${interactive
          ? 'transition-colors duration-200 hover:border-lime active:bg-surface2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime [-webkit-tap-highlight-color:transparent]'
          : ''}`}
    >
      {/* Icon */}
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface2 text-muted">
        <MealIcon mealName={meal.meal_name} size={20} color="currentColor" />
      </span>

      {/* Content */}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-body text-[15px] font-medium text-text-col">{meal.meal_name}</span>
            {meal.time && (
              <span className="font-body text-xs tabular-nums text-muted">{meal.time.slice(0, 5)}</span>
            )}
          </span>
          <span className="flex flex-shrink-0 items-baseline gap-1">
            <span className="font-display text-2xl font-semibold leading-none tabular-nums text-lime">
              {Math.round(meal.calories).toLocaleString('he-IL')}
            </span>
            <span className="font-body text-xs text-muted">קל'</span>
          </span>
        </span>

        {meal.food_items && (
          <span className="line-clamp-2 font-body text-sm leading-snug text-muted">{meal.food_items}</span>
        )}

        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs tabular-nums text-muted">
          {meal.protein_g != null && (
            <span>
              חלבון <span className="font-medium text-text-col">{Math.round(meal.protein_g)}g</span>
            </span>
          )}
          {meal.carbs_g != null && <span>פחמ' {Math.round(meal.carbs_g)}g</span>}
          {meal.fat_g != null && <span>שומן {Math.round(meal.fat_g)}g</span>}
        </span>
      </span>

      {interactive && (
        <ChevronLeft size={18} strokeWidth={2} className="mt-2.5 flex-shrink-0 text-muted" aria-hidden />
      )}
    </Root>
  )
}
