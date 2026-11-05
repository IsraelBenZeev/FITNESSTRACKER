export interface NutritionLog {
  id: string
  date: string
  time: string | null
  meal_name: string
  food_items: string | null
  calories: number
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  notes: string | null
  /** Goal in effect for this day when the meal was logged (snapshot) */
  goal_calories: number | null
  goal_protein: number | null
  created_at: string
}

export interface DayTotals {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  /** Day's goal snapshot; null for legacy rows → fall back to configured goals */
  goalCalories?: number | null
  goalProtein?: number | null
}
