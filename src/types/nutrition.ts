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
  created_at: string
}

export interface DayTotals {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
}
