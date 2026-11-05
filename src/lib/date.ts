/**
 * Calendar dates in the user's local time zone (YYYY-MM-DD).
 *
 * Never derive a calendar date with `toISOString()`: that is UTC, so in Israel
 * (UTC+2/+3) anything between local midnight and ~03:00 lands on the previous day.
 * Timestamps (created_at, updated_at, startedAt) stay in ISO/UTC; only *dates* use this.
 */
export function toLocalDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's local date, YYYY-MM-DD */
export const todayLocal = (): string => toLocalDateStr(new Date())

/** Local date `n` days before today, YYYY-MM-DD */
export function daysAgoLocal(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toLocalDateStr(d)
}
