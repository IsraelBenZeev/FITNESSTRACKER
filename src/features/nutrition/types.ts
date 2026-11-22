/** BodyBuddy `nutrition_entries` row — one food inside a meal group */
export interface NutritionEntry {
  id: string
  user_id: string
  date: string
  food_name: string
  portion_size: number
  portion_unit: 'g' | 'ml' | 'unit'
  calories: number
  protein: number
  carbs: number
  fat: number
  food_item_id: string | null
  group_id: string | null
  group_name: string | null
  source: string | null
  unit_weight_g: number | null
  unit_name: string | null
  unit_name_plural: string | null
  created_at: string
}

/** A meal = all entries that share a group_id (or a single ungrouped entry) */
export interface MealGroup {
  key: string
  groupId: string | null
  date: string
  name: string
  /** Local HH:MM of the first entry */
  time: string
  createdAt: string
  entries: NutritionEntry[]
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type FoodSource = 'personal' | 'catalog'

export interface Macros {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/**
 * A food the user can pick: a personal `food_items` row or a catalog `foods` row,
 * normalized the same way the BodyBuddy app does.
 * - measurement 'units': amount = number of units, values per unit
 * - measurement 'grams': amount = grams/ml, values per 100; optional unit for "+1 unit"
 */
export interface Food {
  id: string
  source: FoodSource
  name: string
  measurement: 'grams' | 'units'
  amountUnit: 'g' | 'ml'
  per100: Macros | null
  perUnit: Macros | null
  unitWeightG: number | null
  unitName: string | null
  unitNamePlural: string | null
  defaultAmount: number | null
  category: string | null
  /** Lower-cased name + English name + aliases, for instant local search */
  keywords: string
  /** When it joined "my foods" (created, or saved from the catalog) — for newest-first lists */
  createdAt: string | null
}

/** A food with an amount, ready to be logged */
export interface CartItem {
  key: string
  food: Food
  amount: number
}

export interface SavedMealItem {
  /** meal_items.id */
  id: string
  food: Food
  amount: number
}

export interface SavedMeal {
  id: string
  name: string
  createdAt: string
  items: SavedMealItem[]
}
