/** BodyBuddy-Client/src/utils/formatExerciseMetrics.ts + muscleGroups.ts */
import type { Exercise, InputField } from './types'

export const formatSecondsAsMMSS = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.round(totalSeconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const formatFieldValue = (field: InputField, value: number) => {
  if (field.type === 'duration') return formatSecondsAsMMSS(value)
  return field.unit ? `${value} ${field.unit}` : `${value}`
}

export const formatDurationHebrew = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m} דקות ${s} שניות`
}

const hoursHe = (h: number) => (h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`)

/** 45 → "45 דק׳", 60 → "שעה", 100 → "שעה ו-40 דק׳" */
export const formatMinutesHebrew = (totalMinutes: number) => {
  const minutes = Math.max(0, Math.round(totalMinutes))
  if (minutes < 60) return `${minutes} דק׳`
  const rest = minutes % 60
  const h = hoursHe(Math.floor(minutes / 60))
  return rest ? `${h} ו-${rest} דק׳` : h
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

export const formatLastDone = (iso: string | undefined) => {
  if (!iso) return 'עדיין לא בוצע'
  const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86_400_000)
  if (diff <= 0) return 'היום'
  if (diff === 1) return 'אתמול'
  if (diff === 2) return 'לפני יומיים'
  return `לפני ${diff} ימים`
}

const HE_WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** "יום שלישי, 18 נובמבר" (date-fns 'EEEE, d MMMM' in he) */
export const formatDayMonth = (iso: string) => {
  const d = new Date(iso)
  return `יום ${HE_WEEKDAYS[d.getDay()]}, ${d.getDate()} ${HE_MONTHS[d.getMonth()]}`
}
export const formatFullDate = (iso: string) => {
  const d = new Date(iso)
  return `יום ${HE_WEEKDAYS[d.getDay()]}, ${d.getDate()} ${HE_MONTHS[d.getMonth()]} ${d.getFullYear()} • ${hhmm(d)}`
}
export { hhmm }

/** "אימון בוקר" … by the hour it started */
export const sessionTitle = (iso: string) => {
  const h = new Date(iso).getHours()
  if (h >= 5 && h < 12) return 'אימון בוקר'
  if (h >= 12 && h < 15) return 'אימון צהריים'
  if (h >= 15 && h < 18) return 'אימון אחר צהריים'
  if (h >= 18 && h < 21) return 'אימון ערב'
  return 'אימון לילה'
}

// ---------- muscle groups ----------

const MUSCLE_PARTS: { key: string; label: string; subs: { key: string; full: string }[] }[] = [
  { key: 'chest', label: 'חזה', subs: [] },
  { key: 'back', label: 'גב', subs: [] },
  { key: 'shoulders', label: 'כתפיים', subs: [{ key: 'front delts', full: 'כתף קדמית' }, { key: 'side delts', full: 'כתף צדדית' }, { key: 'rear delts', full: 'כתף אחורית' }] },
  { key: 'upper arms', label: 'ידיים', subs: [{ key: 'biceps', full: 'יד קדמית' }, { key: 'triceps', full: 'יד אחורית' }, { key: 'forearms', full: 'אמה' }] },
  { key: 'waist', label: 'בטן', subs: [] },
  { key: 'upper legs', label: 'רגליים', subs: [{ key: 'quadriceps', full: 'ארבע ראשי' }, { key: 'hamstrings', full: 'גב הירך' }, { key: 'adductors', full: 'מקרבי ירך' }, { key: 'abductors', full: 'מרחיקים' }] },
  { key: 'glutes', label: 'ישבן', subs: [] },
  { key: 'lower legs', label: 'שוק', subs: [] },
  { key: 'neck', label: 'צוואר', subs: [{ key: 'neck flexors', full: 'כופפי צוואר' }, { key: 'neck extensors', full: 'פושטי צוואר' }] },
]

const KEY_BY_TARGET: Record<string, string> = {
  chest: 'chest', pectorals: 'chest', lats: 'back', 'upper back': 'back', traps: 'back', spine: 'back',
  'levator scapulae': 'back', delts: 'shoulders', 'front delts': 'front delts', 'side delts': 'side delts',
  'rear delts': 'rear delts', biceps: 'biceps', triceps: 'triceps', forearms: 'forearms', abs: 'waist',
  'serratus anterior': 'waist', quadriceps: 'quadriceps', quads: 'quadriceps', hamstrings: 'hamstrings',
  adductors: 'adductors', abductors: 'abductors', glutes: 'glutes', calves: 'lower legs',
  'neck flexors': 'neck flexors', 'neck extensors': 'neck extensors',
}
const PART_KEYS = new Set(MUSCLE_PARTS.map((p) => p.key))

function normalize(keys: Set<string>): string[] {
  const out: string[] = []
  for (const part of MUSCLE_PARTS) {
    if (keys.has(part.key)) { out.push(part.key); continue }
    const subs = part.subs.filter((s) => keys.has(s.key))
    if (part.subs.length > 0 && subs.length === part.subs.length) { out.push(part.key); continue }
    subs.forEach((s) => out.push(s.key))
  }
  return out
}

/** Training areas of a plan: from targetMuscles, falling back to bodyParts */
export function deriveMuscleKeys(exercises: Pick<Exercise, 'targetMuscles' | 'bodyParts'>[]): string[] {
  const keys = new Set<string>()
  for (const ex of exercises) {
    if (ex.targetMuscles?.length) {
      ex.targetMuscles.forEach((m) => { const k = KEY_BY_TARGET[m.toLowerCase()]; if (k) keys.add(k) })
      continue
    }
    ex.bodyParts?.forEach((bp) => {
      const p = bp?.toLowerCase()
      if (!p) return
      const k = PART_KEYS.has(p) ? p : p === 'lower arms' ? 'forearms' : undefined
      if (k) keys.add(k)
    })
  }
  return normalize(keys)
}

export const getMuscleLabels = (keys: string[]) =>
  MUSCLE_PARTS.flatMap((part) =>
    keys.includes(part.key)
      ? [{ key: part.key, label: part.label }]
      : part.subs.filter((s) => keys.includes(s.key)).map((s) => ({ key: s.key, label: s.full })),
  )
