/** BodyBuddy-Client/src/types/customExercise.ts + types/bodtPart.ts */
import type { InputField } from '../workouts/types'
import { MUSCLE_PARTS } from '../workouts/form/muscles'

/** Body parts in the app's order (partsBodyHebrew) */
export const BODY_PARTS_HE: Record<string, string> = {
  neck: 'צוואר', chest: 'חזה', shoulders: 'כתפיים', 'upper arms': 'ידיים', 'lower arms': 'אמות', waist: 'בטן',
  'upper legs': 'רגל', 'lower legs': 'שוק', glutes: 'ישבן', back: 'גב', general: 'כללי', cardio: 'אירובי',
}
export const BODY_PART_ORDER = Object.keys(BODY_PARTS_HE)

export const EQUIPMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'body weight', label: 'משקל גוף' },
  { value: 'dumbbell', label: 'דמבל' },
  { value: 'barbell', label: 'מוט ברזל' },
  { value: 'EZ bar', label: 'מוט EZ' },
  { value: 'cable machine', label: 'מכבל' },
  { value: 'machine', label: 'מכונה' },
  { value: 'bench', label: 'ספסל' },
  { value: 'incline bench', label: 'ספסל משופע' },
  { value: 'decline bench', label: 'ספסל שיפוע הפוך' },
  { value: 'preacher bench', label: 'ספסל פריצ׳ר' },
  { value: 'squat rack', label: 'מתקן סקוואט' },
  { value: 'pull-up bar', label: 'מתח' },
  { value: 'dip station', label: 'מתקן מקבילים' },
  { value: "captain's chair", label: 'כיסא קפטן' },
  { value: 'rope', label: 'חבל' },
  { value: 'V-bar', label: 'ידית V' },
  { value: 'weight plate', label: 'דיסקית משקל' },
  { value: 'ab wheel', label: 'גלגל בטן' },
]
export const equipmentLabel = (v: string | null) => (v ? EQUIPMENT_OPTIONS.find((o) => o.value === v)?.label ?? null : null)

export type Template = 'strength' | 'bodyweight' | 'duration' | 'cardio'
export const TEMPLATES: Record<Template, { label: string; input_fields: InputField[] }> = {
  strength: {
    label: 'משקולות',
    input_fields: [
      { key: 'reps', type: 'number', label: 'חזרות', unit: null },
      { key: 'weight', type: 'number', label: 'משקל', unit: 'kg' },
    ],
  },
  bodyweight: {
    label: 'משקל גוף',
    input_fields: [
      { key: 'reps', type: 'number', label: 'חזרות', unit: null },
      { key: 'added_weight', type: 'number', label: 'משקל נוסף', unit: 'kg', optional: true },
    ],
  },
  duration: {
    label: 'זמן / החזקה',
    input_fields: [{ key: 'duration', type: 'duration', label: 'משך זמן', unit: 'sec' }],
  },
  cardio: {
    label: 'קרדיו (הליכון / אופניים)',
    input_fields: [
      { key: 'duration', type: 'duration', label: 'משך זמן', unit: 'sec' },
      { key: 'speed', type: 'number', label: 'מהירות', unit: 'km/h' },
      { key: 'incline', type: 'number', label: 'שיפוע', unit: '%' },
    ],
  },
}

// jsonb doesn't keep key order — compare with sorted keys so a saved template still matches
const sortKeys = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]))
      : v

export function matchTemplate(fields: InputField[]): Template | null {
  const n = JSON.stringify(sortKeys(fields))
  return (Object.keys(TEMPLATES) as Template[]).find((t) => JSON.stringify(sortKeys(TEMPLATES[t].input_fields)) === n) ?? null
}

export const MAX_IMAGES = 3

export const musclesFor = (bodyPart: string | null) => MUSCLE_PARTS.find((p) => p.key === bodyPart)?.subs ?? []
export const subLabel = (key: string | null) => {
  if (!key) return null
  for (const p of MUSCLE_PARTS) {
    const s = p.subs.find((x) => x.key === key)
    if (s) return s.fullLabel
  }
  return key
}

export const formatDMY = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
