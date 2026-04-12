import {
  Sunrise, Sun, Moon, Apple, Dumbbell, Flame, UtensilsCrossed, Coffee,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

const MEAL_ICON_MAP: Record<string, React.FC<LucideProps>> = {
  בוקר: Sunrise,
  'ארוחת בוקר': Sunrise,
  צהריים: Sun,
  'ארוחת צהריים': Sun,
  ערב: Moon,
  'ארוחת ערב': Moon,
  חטיף: Apple,
  נשנוש: Apple,
  שייק: Coffee,
  שייקר: Coffee,
  ספורט: Flame,
  'אחרי ספורט': Dumbbell,
}

interface MealIconProps {
  mealName: string
  size?: number
  color?: string
}

export function MealIcon({ mealName, size = 20, color = '#D7FF00' }: MealIconProps) {
  // Try exact match first, then partial match
  const IconComponent =
    MEAL_ICON_MAP[mealName] ??
    Object.entries(MEAL_ICON_MAP).find(([key]) =>
      mealName.includes(key) || key.includes(mealName)
    )?.[1] ??
    UtensilsCrossed

  return <IconComponent size={size} color={color} strokeWidth={1.5} />
}
