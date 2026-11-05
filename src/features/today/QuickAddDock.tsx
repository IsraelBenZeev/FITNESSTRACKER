import { Plus } from 'lucide-react'
import { MealIcon } from '../../shared/icons/MealIcon'

/** Meal names must match AddMealModal's MEAL_OPTIONS */
const QUICK_MEALS = [
  { name: 'ארוחת בוקר', label: 'בוקר' },
  { name: 'ארוחת צהריים', label: 'צהריים' },
  { name: 'ארוחת ערב', label: 'ערב' },
  { name: 'חטיף', label: 'חטיף' },
  { name: 'שייק', label: 'שייק' },
] as const

/** Suggest the meal type that fits the current hour */
export function suggestedMeal(date = new Date()): string {
  const h = date.getHours()
  if (h >= 5 && h < 11) return 'ארוחת בוקר'
  if (h >= 11 && h < 16) return 'ארוחת צהריים'
  if (h >= 18 && h < 22) return 'ארוחת ערב'
  return 'חטיף'
}

interface QuickAddDockProps {
  onAdd: (mealName: string) => void
}

/**
 * Always-visible logging bar pinned above the TabBar (TabBar = 56px + 1px border + safe area).
 * The meal type that fits "now" is pre-highlighted; + opens with that suggestion.
 */
export function QuickAddDock({ onAdd }: QuickAddDockProps) {
  const suggested = suggestedMeal()

  return (
    <div className="fixed inset-x-0 bottom-[calc(57px+env(safe-area-inset-bottom,0px))] z-40 border-t border-border-col bg-bg/90 backdrop-blur-md">
      <div className="flex items-center gap-2 py-2.5 pe-4">
        <div className="hide-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto ps-4 [mask-image:linear-gradient(to_left,transparent,black_16px,black_calc(100%-16px),transparent)]">
          {QUICK_MEALS.map(({ name, label }) => {
            const isSuggested = name === suggested
            return (
              <button
                key={name}
                type="button"
                onClick={() => onAdd(name)}
                className={`flex h-11 flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 font-body text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]
                  ${isSuggested
                    ? 'border-accent/60 bg-accent-soft font-medium text-accent'
                    : 'border-border-col bg-surface text-text-col hover:border-muted active:bg-surface2'}`}
              >
                <MealIcon mealName={name} size={16} color="currentColor" />
                {label}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => onAdd(suggested)}
          aria-label="הוסף ארוחה"
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent text-bg shadow-[0_6px_18px_-6px_rgba(150,200,40,0.55)] transition-transform duration-150 ease-out active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
