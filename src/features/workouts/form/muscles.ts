/** BodyBuddy-Client/src/types/muscleGroups.ts + utils/muscleGroups.ts (picker helpers) */

export interface MuscleSub { key: string; label: string; fullLabel: string }
export interface MusclePart { key: string; label: string; subs: MuscleSub[] }

export const MUSCLE_PARTS: MusclePart[] = [
  { key: 'chest', label: 'חזה', subs: [] },
  { key: 'back', label: 'גב', subs: [] },
  { key: 'shoulders', label: 'כתפיים', subs: [
    { key: 'front delts', label: 'קדמית', fullLabel: 'כתף קדמית' },
    { key: 'side delts', label: 'צדדית', fullLabel: 'כתף צדדית' },
    { key: 'rear delts', label: 'אחורית', fullLabel: 'כתף אחורית' },
  ] },
  { key: 'upper arms', label: 'ידיים', subs: [
    { key: 'biceps', label: 'יד קדמית', fullLabel: 'יד קדמית' },
    { key: 'triceps', label: 'יד אחורית', fullLabel: 'יד אחורית' },
    { key: 'forearms', label: 'אמה', fullLabel: 'אמה' },
  ] },
  { key: 'waist', label: 'בטן', subs: [] },
  { key: 'upper legs', label: 'רגליים', subs: [
    { key: 'quadriceps', label: 'ארבע ראשי', fullLabel: 'ארבע ראשי' },
    { key: 'hamstrings', label: 'גב הירך', fullLabel: 'גב הירך' },
    { key: 'adductors', label: 'מקרבי ירך', fullLabel: 'מקרבי ירך' },
    { key: 'abductors', label: 'מרחיקים', fullLabel: 'מרחיקים' },
  ] },
  { key: 'glutes', label: 'ישבן', subs: [] },
  { key: 'lower legs', label: 'שוק', subs: [] },
  { key: 'neck', label: 'צוואר', subs: [
    { key: 'neck flexors', label: 'כופפי צוואר', fullLabel: 'כופפי צוואר' },
    { key: 'neck extensors', label: 'פושטי צוואר', fullLabel: 'פושטי צוואר' },
  ] },
]

/** A whole area, or the sub-areas picked; all subs of an area collapse to the area key */
export function normalizeMuscleKeys(keys: Set<string>): string[] {
  const out: string[] = []
  for (const part of MUSCLE_PARTS) {
    if (keys.has(part.key)) { out.push(part.key); continue }
    const subs = part.subs.filter((s) => keys.has(s.key))
    if (part.subs.length > 0 && subs.length === part.subs.length) { out.push(part.key); continue }
    subs.forEach((s) => out.push(s.key))
  }
  return out
}

export const getPartState = (selected: string[], part: MusclePart): 'all' | 'some' | 'none' =>
  selected.includes(part.key) ? 'all' : part.subs.some((s) => selected.includes(s.key)) ? 'some' : 'none'

export const isSubSelected = (selected: string[], part: MusclePart, sub: MuscleSub) =>
  selected.includes(part.key) || selected.includes(sub.key)

export const countSelectedSubs = (selected: string[], part: MusclePart) =>
  selected.includes(part.key) ? part.subs.length : part.subs.filter((s) => selected.includes(s.key)).length

export function toggleMusclePart(selected: string[], part: MusclePart): string[] {
  const next = new Set(selected)
  if (next.has(part.key)) next.delete(part.key)
  else {
    part.subs.forEach((s) => next.delete(s.key))
    next.add(part.key)
  }
  return normalizeMuscleKeys(next)
}

/** When the whole area is on, tapping a sub narrows the choice to that sub */
export function toggleMuscleSub(selected: string[], part: MusclePart, sub: MuscleSub): string[] {
  const next = new Set(selected)
  if (next.has(part.key)) { next.delete(part.key); next.add(sub.key) }
  else if (next.has(sub.key)) next.delete(sub.key)
  else next.add(sub.key)
  return normalizeMuscleKeys(next)
}
