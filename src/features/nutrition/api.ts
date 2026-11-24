import { bb } from '../../lib/supabaseBodyBuddy'
import { fetchAllRows } from '../../lib/fetchAllRows'
import { entryRow, normalizeCatalogFood, normalizeEntry, normalizeFoodItem } from './foodMath'
import type { CartItem, Food, NutritionEntry, SavedMeal, SavedMealItem } from './types'

const FOOD_ITEM_COLS = `id, name, category, is_active, user_id, measurement_type, amount_unit, default_amount, unit_weight_g, unit_name, unit_name_plural,
  calories_per_100, protein_per_100, carbs_per_100, fat_per_100, calories_per_unit, protein_per_unit, carbs_per_unit, fat_per_unit, created_at`
const CATALOG_COLS = `id, name, name_en, aliases, default_measurement_type, default_serving_weight_g, default_serving_name, default_unit_name, default_unit_name_plural,
  amount_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, nutrition_category, culinary_category, popularity`

// ── entries ────────────────────────────────────────────────────────────────────

export async function fetchEntries(userId: string, fromDate: string | null, toDate: string | null): Promise<NutritionEntry[]> {
  const rows = await fetchAllRows<Record<string, unknown>>((from, to) => {
    let q = bb().from('nutrition_entries').select('*').eq('user_id', userId)
    if (fromDate) q = q.gte('date', fromDate)
    if (toDate) q = q.lte('date', toDate)
    // Final order (by eaten time) is set in groupEntries
    return q.order('date', { ascending: true }).order('created_at', { ascending: true }).order('id', { ascending: true }).range(from, to)
  })
  return rows.map(normalizeEntry)
}

export async function fetchEntryDates(userId: string): Promise<string[]> {
  const rows = await fetchAllRows<{ date: string }>((from, to) =>
    bb().from('nutrition_entries').select('date').eq('user_id', userId).order('date', { ascending: false }).order('id', { ascending: true }).range(from, to),
  )
  return rows.map((r) => r.date)
}

export async function addMeal(userId: string, items: CartItem[], opts: { date: string; groupName: string; createdAt: string; groupId?: string }) {
  // A new meal gets a fresh group; "add to this meal" reuses the existing one
  const groupId = opts.groupId ?? crypto.randomUUID()
  // Keep item order: each entry 1ms after the previous one
  const base = new Date(opts.createdAt).getTime()
  const rows = items.map((it, i) =>
    entryRow(it, { userId, date: opts.date, groupId, groupName: opts.groupName, createdAt: new Date(base + i).toISOString() }),
  )
  const { error } = await bb().from('nutrition_entries').insert(rows)
  if (error) throw new Error(error.message)
  // "Recent foods" like the app (best effort)
  await Promise.all(items.filter((it) => it.food.id).map((it) => trackFoodUsage(userId, it.food).catch(() => undefined)))
}

/** One food on its own (no group_id / group_name) — what the app writes for "add food" */
export async function addSingleFood(userId: string, item: CartItem, opts: { date: string; createdAt: string }) {
  const { error } = await bb().from('nutrition_entries').insert(entryRow(item, { userId, date: opts.date, groupId: null, groupName: null, createdAt: opts.createdAt }))
  if (error) throw new Error(error.message)
  // A food that was only logged (not saved) has no id to track
  if (item.food.id) await trackFoodUsage(userId, item.food).catch(() => undefined)
}

export async function deleteEntry(userId: string, id: string) {
  const { error } = await bb().from('nutrition_entries').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

/** Set when entries were eaten (a whole meal, or one food) */
export async function updateEatenAt(userId: string, ids: string[], eatenAt: string) {
  const { error } = await bb().from('nutrition_entries').update({ eaten_at: eatenAt }).in('id', ids).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function deleteGroup(userId: string, groupId: string) {
  const { error } = await bb().from('nutrition_entries').delete().eq('group_id', groupId).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ── foods ──────────────────────────────────────────────────────────────────────

/** The whole BodyBuddy catalog (~170 foods), most popular first — browsed by category and searched locally */
export async function fetchCatalog(): Promise<Food[]> {
  const { data, error } = await bb().from('foods').select(CATALOG_COLS).order('popularity', { ascending: false }).order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map(normalizeCatalogFood)
}

/** "My foods": personal items + catalog foods saved to the list */
export async function fetchMyFoods(userId: string): Promise<Food[]> {
  const [items, saved] = await Promise.all([
    bb().from('food_items').select(FOOD_ITEM_COLS).eq('user_id', userId).eq('is_active', true).order('name'),
    bb().from('user_saved_foods').select(`created_at, foods (${CATALOG_COLS})`).eq('user_id', userId),
  ])
  if (items.error) throw new Error(items.error.message)
  if (saved.error) throw new Error(saved.error.message)
  const catalog = (saved.data ?? [])
    .filter((r) => r.foods != null)
    .map((r) => ({ ...normalizeCatalogFood(r.foods as unknown as Record<string, unknown>), createdAt: (r.created_at as string | null) ?? null }))
  // Newest first, like the app
  return [...(items.data ?? []).map(normalizeFoodItem), ...catalog].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}

/** Remove from "my foods": a personal food is deactivated (soft delete), a saved catalog food is unsaved — like the app */
export async function deleteMyFood(userId: string, food: Food) {
  const { error } =
    food.source === 'catalog'
      ? await bb().from('user_saved_foods').delete().eq('user_id', userId).eq('food_id', food.id)
      : await bb().from('food_items').update({ is_active: false }).eq('id', food.id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function fetchRecentFoods(userId: string): Promise<Food[]> {
  const { data, error } = await bb()
    .from('user_recent_foods')
    .select(`last_used_at, food_items (${FOOD_ITEM_COLS}), foods (${CATALOG_COLS})`)
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)
  return (data ?? [])
    .map((r) => {
      const fi = r.food_items as unknown as Record<string, unknown> | null
      const f = r.foods as unknown as Record<string, unknown> | null
      return fi ? normalizeFoodItem(fi) : f ? normalizeCatalogFood(f) : null
    })
    .filter((x): x is Food => x != null)
}

export async function trackFoodUsage(userId: string, food: Food) {
  const now = new Date().toISOString()
  const row =
    food.source === 'catalog'
      ? { user_id: userId, food_id: food.id, food_item_id: null, last_used_at: now }
      : { user_id: userId, food_item_id: food.id, food_id: null, last_used_at: now }
  const { error } = await bb()
    .from('user_recent_foods')
    .upsert(row, { onConflict: food.source === 'catalog' ? 'user_id,food_id' : 'user_id,food_item_id' })
  if (error) throw new Error(error.message)
}

export async function saveCatalogFood(userId: string, foodId: string) {
  const { error } = await bb().from('user_saved_foods').upsert({ user_id: userId, food_id: foodId }, { onConflict: 'user_id,food_id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}

export interface NewFoodInput {
  name: string
  measurement: 'grams' | 'units'
  amountUnit: 'g' | 'ml'
  values: { calories: number; protein: number; carbs: number; fat: number }
  unitName?: string | null
  unitNamePlural?: string | null
  unitWeightG?: number | null
  defaultAmount?: number | null
}

export async function createFoodItem(userId: string, input: NewFoodInput): Promise<Food> {
  const isGrams = input.measurement === 'grams'
  const v = input.values
  const { data, error } = await bb()
    .from('food_items')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      category: null,
      measurement_type: input.measurement,
      amount_unit: isGrams ? input.amountUnit : 'g',
      default_amount: input.defaultAmount && input.defaultAmount > 0 ? input.defaultAmount : null,
      is_ai_generated: false,
      is_active: true,
      calories_per_100: isGrams ? v.calories : 0,
      protein_per_100: isGrams ? v.protein : 0,
      carbs_per_100: isGrams ? v.carbs : 0,
      fat_per_100: isGrams ? v.fat : 0,
      calories_per_unit: isGrams ? null : v.calories,
      protein_per_unit: isGrams ? null : v.protein,
      carbs_per_unit: isGrams ? null : v.carbs,
      fat_per_unit: isGrams ? null : v.fat,
      unit_weight_g: input.unitWeightG && input.unitWeightG > 0 ? input.unitWeightG : null,
      unit_name: input.unitName?.trim() || null,
      unit_name_plural: input.unitNamePlural?.trim() || null,
    })
    .select(FOOD_ITEM_COLS)
    .single()
  if (error) throw new Error(error.message)
  return normalizeFoodItem(data as Record<string, unknown>)
}

// ── saved meals (templates) ────────────────────────────────────────────────────

export async function fetchSavedMeals(userId: string): Promise<SavedMeal[]> {
  const { data, error } = await bb()
    .from('meals')
    .select(`id, name_meal, created_at, meal_items (id, food_item_id, food_id, amount_g, food_items (${FOOD_ITEM_COLS}))`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const foodIds = [...new Set((data ?? []).flatMap((m) => (m.meal_items ?? []).map((i) => i.food_id).filter((x): x is string => !!x)))]
  const catalog = new Map<string, Food>()
  if (foodIds.length) {
    const { data: foods, error: fe } = await bb().from('foods').select(CATALOG_COLS).in('id', foodIds)
    if (fe) throw new Error(fe.message)
    for (const f of foods ?? []) catalog.set(f.id, normalizeCatalogFood(f))
  }
  return (data ?? []).map((m) => ({
    id: String(m.id),
    name: m.name_meal ?? '',
    createdAt: String(m.created_at ?? ''),
    items: [...(m.meal_items ?? [])]
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .map((i) => {
        const fi = i.food_items as unknown as Record<string, unknown> | null
        const food = fi ? normalizeFoodItem(fi) : i.food_id ? catalog.get(i.food_id) : undefined
        return food && (food.source === 'catalog' || (fi && fi.is_active !== false)) ? { id: String(i.id), food, amount: Number(i.amount_g ?? 0) } : null
      })
      .filter((x): x is SavedMealItem => x != null),
  }))
}

export async function createSavedMeal(userId: string, name: string, items: CartItem[]) {
  const { data, error } = await bb().from('meals').insert({ user_id: userId, name_meal: name.trim(), is_ai_generated: false }).select('id').single()
  if (error) throw new Error(error.message)
  const mealId = (data as { id: number }).id
  const { error: ie } = await bb()
    .from('meal_items')
    .insert(items.map((it) => ({ meal_id: mealId, food_item_id: it.food.source === 'personal' ? it.food.id : null, food_id: it.food.source === 'catalog' ? it.food.id : null, amount_g: it.amount })))
  if (ie) {
    await bb().from('meals').delete().eq('id', mealId)
    throw new Error(ie.message)
  }
}

export async function deleteSavedMeal(userId: string, mealId: string) {
  const { error } = await bb().from('meals').delete().eq('id', mealId).eq('user_id', userId)
  if (error) throw new Error(error.message)
  const { error: ie } = await bb().from('meal_items').delete().eq('meal_id', mealId)
  if (ie) throw new Error(ie.message)
}

export interface MealItemsChanges {
  removeIds: string[]
  updates: { id: string; amount: number }[]
  additions: { food: Food; amount: number }[]
}

/** Save edits made while reviewing a saved meal ("עדכן את הארוחה"), like the app */
export async function updateMealItems(mealId: string, changes: MealItemsChanges) {
  if (changes.additions.length) {
    const { error } = await bb()
      .from('meal_items')
      .insert(changes.additions.map((a) => ({ meal_id: mealId, food_item_id: a.food.source === 'personal' ? a.food.id : null, food_id: a.food.source === 'catalog' ? a.food.id : null, amount_g: a.amount })))
    if (error) throw new Error(error.message)
  }
  const results = await Promise.all(changes.updates.map((u) => bb().from('meal_items').update({ amount_g: u.amount }).eq('id', u.id).eq('meal_id', mealId)))
  const ue = results.find((r) => r.error)?.error
  if (ue) throw new Error(ue.message)
  if (changes.removeIds.length) {
    const { error } = await bb().from('meal_items').delete().eq('meal_id', mealId).in('id', changes.removeIds)
    if (error) throw new Error(error.message)
  }
}
