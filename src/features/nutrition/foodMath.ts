import type { CartItem, Food, Macros, MealGroup, NutritionEntry } from './types'
import type { NutritionLog } from '../../types/nutrition'
import { toLocalDateStr } from '../../lib/date'

const r1 = (n: number) => Math.round(n * 10) / 10
const num = (v: unknown): number | null => (v == null || v === '' ? null : Number(v))

/** Same math as the BodyBuddy app: units → per unit × count, grams → per 100 × amount / 100 */
export function nutrientsFor(food: Food, amount: number): Macros {
  if (food.measurement === 'units') {
    const p = food.perUnit ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return { calories: r1(p.calories * amount), protein: r1(p.protein * amount), carbs: r1(p.carbs * amount), fat: r1(p.fat * amount) }
  }
  const p = food.per100 ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const k = amount / 100
  return { calories: r1(p.calories * k), protein: r1(p.protein * k), carbs: r1(p.carbs * k), fat: r1(p.fat * k) }
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (a, m) => ({ calories: a.calories + m.calories, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

/** Label of an amount: "150 גרם", "2 לחמניות", "1 יח׳" */
export function amountLabel(food: Pick<Food, 'measurement' | 'amountUnit' | 'unitName' | 'unitNamePlural'>, amount: number): string {
  const n = r1(amount).toLocaleString('he-IL')
  if (food.measurement === 'units') {
    const name = amount === 1 ? food.unitName : food.unitNamePlural ?? food.unitName
    return `${n} ${name ?? 'יח׳'}`
  }
  return `${n} ${food.amountUnit === 'ml' ? 'מ״ל' : 'גרם'}`
}

export function entryAmountLabel(e: NutritionEntry): string {
  const n = r1(Number(e.portion_size)).toLocaleString('he-IL')
  if (e.portion_unit === 'unit') return `${n} ${e.unit_name ?? 'יח׳'}`
  return `${n} ${e.portion_unit === 'ml' ? 'מ״ל' : 'גרם'}`
}

/** A gram/ml food that is also counted (egg = 60 g) — the app's "typical unit" */
export interface TypicalUnit {
  weight: number
  name: string
  plural: string
}

export function typicalUnitOf(food: Pick<Food, 'measurement' | 'unitWeightG' | 'unitName' | 'unitNamePlural'>): TypicalUnit | null {
  if (food.measurement === 'units') return null
  const weight = Number(food.unitWeightG ?? 0)
  const name = food.unitName?.trim()
  if (!(weight > 0) || !name) return null
  return { weight, name, plural: food.unitNamePlural?.trim() || name }
}

/** Opening amount when a food is picked, like the app: units food 1, counted food one unit, else 100 */
export function baseAmountFor(food: Food): number {
  if (food.measurement === 'units') return 1
  return typicalUnitOf(food)?.weight ?? 100
}

export const unitLabel = (u: 'g' | 'ml') => (u === 'ml' ? 'מ״ל' : 'גרם')

/** The amount label under a stepper: "גרם" / "מ״ל" / "יח׳" */
export const amountUnitLabel = (food: Pick<Food, 'measurement' | 'amountUnit'>) => (food.measurement === 'units' ? 'יח׳' : unitLabel(food.amountUnit))

/** Limits shared with the app/server */
export const LIMITS = { maxGrams: 2000, maxUnits: 50, maxUnitWeight: 2000, maxCaloriesPer100: 900, maxMacroPer100: 100 } as const
export const maxAmountFor = (food: Pick<Food, 'measurement'>) => (food.measurement === 'units' ? LIMITS.maxUnits : LIMITS.maxGrams)

/** "מחושב לפי 165 קק״ל ו-31 גרם חלבון ל-100 גרם" */
export function referenceLine(food: Food): string {
  const base = nutrientsFor(food, food.measurement === 'units' ? 1 : 100)
  const per = food.measurement === 'units' ? 'ליחידה' : `ל-100 ${unitLabel(food.amountUnit)}`
  return `מחושב לפי ${Math.round(base.calories)} קק״ל ו-${r1(base.protein)} גרם חלבון ${per}`
}

/** Sensible starting amount when a food is picked */
export function defaultAmountFor(food: Food): number {
  if (food.defaultAmount && food.defaultAmount > 0) return food.defaultAmount
  if (food.measurement === 'units') return 1
  if (food.unitWeightG && food.unitWeightG > 0) return food.unitWeightG
  return 100
}

// ── normalizers (mirror BodyBuddy-Client nutritionService) ─────────────────────

export function normalizeFoodItem(row: Record<string, unknown>): Food {
  const measurement = row.measurement_type === 'units' ? 'units' : 'grams'
  const per100 =
    measurement === 'grams'
      ? { calories: Number(row.calories_per_100 ?? 0), protein: Number(row.protein_per_100 ?? 0), carbs: Number(row.carbs_per_100 ?? 0), fat: Number(row.fat_per_100 ?? 0) }
      : null
  const perUnit =
    row.calories_per_unit != null
      ? { calories: Number(row.calories_per_unit), protein: Number(row.protein_per_unit ?? 0), carbs: Number(row.carbs_per_unit ?? 0), fat: Number(row.fat_per_unit ?? 0) }
      : null
  return {
    id: String(row.id),
    source: 'personal',
    name: String(row.name ?? ''),
    measurement,
    amountUnit: row.amount_unit === 'ml' ? 'ml' : 'g',
    per100,
    perUnit,
    unitWeightG: num(row.unit_weight_g),
    unitName: (row.unit_name as string | null) ?? null,
    unitNamePlural: (row.unit_name_plural as string | null) ?? null,
    defaultAmount: num(row.default_amount),
    category: (row.category as string | null) ?? null,
    keywords: String(row.name ?? '').toLowerCase(),
    createdAt: (row.created_at as string | null) ?? null,
  }
}

export function normalizeCatalogFood(row: Record<string, unknown>): Food {
  const serving = num(row.default_serving_weight_g)
  const plural = typeof row.default_unit_name_plural === 'string' && row.default_unit_name_plural.trim() ? row.default_unit_name_plural.trim() : null
  const singular =
    typeof row.default_unit_name === 'string' && row.default_unit_name.trim()
      ? row.default_unit_name.trim()
      : typeof row.default_serving_name === 'string' && row.default_serving_name.trim()
        ? row.default_serving_name.trim()
        : null
  const countable = serving != null && serving > 0 && (plural != null || row.default_measurement_type === 'unit')
  return {
    id: String(row.id),
    source: 'catalog',
    name: String(row.name ?? ''),
    measurement: 'grams',
    amountUnit: row.amount_unit === 'ml' ? 'ml' : 'g',
    per100: { calories: Number(row.calories_per_100g ?? 0), protein: Number(row.protein_per_100g ?? 0), carbs: Number(row.carbs_per_100g ?? 0), fat: Number(row.fat_per_100g ?? 0) },
    perUnit: null,
    unitWeightG: countable ? serving : null,
    unitName: countable ? (singular ?? String(row.name ?? '')) : null,
    unitNamePlural: countable ? plural : null,
    defaultAmount: !countable && serving != null && serving > 0 ? serving : null,
    category: ((row.nutrition_category as string | null) ?? (row.culinary_category as string | null)) ?? null,
    keywords: [row.name, row.name_en, ...(Array.isArray(row.aliases) ? row.aliases : [])].filter(Boolean).join(' ').toLowerCase(),
    createdAt: null,
  }
}

export function normalizeEntry(row: Record<string, unknown>): NutritionEntry {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    date: String(row.date),
    food_name: String(row.food_name ?? ''),
    portion_size: Number(row.portion_size ?? 0),
    portion_unit: (row.portion_unit as NutritionEntry['portion_unit']) ?? 'g',
    calories: Number(row.calories ?? 0),
    protein: Number(row.protein ?? 0),
    carbs: Number(row.carbs ?? 0),
    fat: Number(row.fat ?? 0),
    food_item_id: (row.food_item_id as string | null) ?? null,
    group_id: (row.group_id as string | null) ?? null,
    group_name: (row.group_name as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    unit_weight_g: num(row.unit_weight_g),
    unit_name: (row.unit_name as string | null) ?? null,
    unit_name_plural: (row.unit_name_plural as string | null) ?? null,
    created_at: String(row.created_at),
  }
}

/** The DB row for logging one cart item (same columns the BodyBuddy app writes) */
/** groupId/groupName null = a single food, not part of a meal (like the app's "add food") */
export function entryRow(item: CartItem, ctx: { userId: string; date: string; groupId: string | null; groupName: string | null; createdAt: string }) {
  const m = nutrientsFor(item.food, item.amount)
  const isUnits = item.food.measurement === 'units'
  const hasUnit = !isUnits && !!item.food.unitWeightG && !!item.food.unitName
  return {
    user_id: ctx.userId,
    date: ctx.date,
    food_name: item.food.name,
    portion_size: r1(item.amount),
    portion_unit: isUnits ? 'unit' : item.food.amountUnit,
    calories: Math.round(m.calories),
    protein: Math.round(m.protein),
    carbs: Math.round(m.carbs),
    fat: Math.round(m.fat),
    food_item_id: item.food.source === 'personal' ? item.food.id : null,
    group_id: ctx.groupId,
    group_name: ctx.groupName,
    source: null,
    unit_weight_g: isUnits ? item.food.unitWeightG : hasUnit ? item.food.unitWeightG : null,
    unit_name: isUnits ? item.food.unitName : hasUnit ? item.food.unitName : null,
    unit_name_plural: isUnits || hasUnit ? item.food.unitNamePlural : null,
    created_at: ctx.createdAt,
  }
}

// ── grouping ───────────────────────────────────────────────────────────────────

const hhmm = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Entries → meals (by group_id), ordered by time */
export function groupEntries(entries: NutritionEntry[]): MealGroup[] {
  const map = new Map<string, NutritionEntry[]>()
  for (const e of entries) {
    const k = e.group_id ?? `single:${e.id}`
    const list = map.get(k)
    if (list) list.push(e)
    else map.set(k, [e])
  }
  const groups: MealGroup[] = []
  for (const [key, list] of map) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const first = list[0]!
    const t = sumMacros(list)
    groups.push({
      key,
      groupId: first.group_id,
      date: first.date,
      name: first.group_name || (list.length === 1 ? first.food_name : 'ארוחה'),
      time: hhmm(first.created_at),
      createdAt: first.created_at,
      entries: list,
      ...t,
    })
  }
  return groups.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
}

/** A meal group in the legacy NutritionLog shape (timeline cards, history, export) */
export function groupToLog(g: MealGroup): NutritionLog {
  return {
    id: g.key,
    date: g.date,
    time: g.time,
    meal_name: g.name,
    food_items: g.entries.map((e) => `${e.food_name} ${entryAmountLabel(e)}`).join(', '),
    calories: g.calories,
    protein_g: g.protein,
    carbs_g: g.carbs,
    fat_g: g.fat,
    notes: null,
    goal_calories: null,
    goal_protein: null,
    created_at: g.createdAt,
  }
}

export const localDateOf = (iso: string) => toLocalDateStr(new Date(iso))
