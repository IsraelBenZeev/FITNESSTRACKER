import { GOAL_CALORIES, GOAL_PROTEIN } from '../../lib/constants'
import type { GoalsConfig } from '../../lib/useGoals'
import type { DayTotals } from '../../types/nutrition'

export const HEBREW_MONTHS = [
  '', 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

// RTL grid: index 0 renders on the right → Sunday (ראשון) rightmost = correct Hebrew layout
export const HEBREW_DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export type DayColor = 'green' | 'orange' | 'red' | 'gray'

/**
 * מחשב צבע יום לפי הישגי הארוחות מול היעד הרלוונטי לאותו יום (אימון / מנוחה).
 * @param dateStr  תאריך בפורמט YYYY-MM-DD
 */
export function getDayColor(
  totals: DayTotals | undefined,
  dateStr: string,
  goalsConfig?: GoalsConfig
): DayColor {
  if (!totals) return 'gray'

  let goalCal = GOAL_CALORIES
  let goalPro = GOAL_PROTEIN

  if (goalsConfig) {
    const dow = new Date(dateStr + 'T00:00:00').getDay()
    const isTraining = goalsConfig.trainingDays.includes(dow)
    goalCal = isTraining ? goalsConfig.trainingCalories : goalsConfig.restCalories
    goalPro = isTraining ? goalsConfig.trainingProtein  : goalsConfig.restProtein
  }

  const cal = totals.calories / goalCal
  const pro = totals.protein / goalPro
  if (cal >= 0.85 && cal <= 1.10 && pro >= 0.90) return 'green'
  if (cal >= 0.70 && cal <= 1.30) return 'orange'
  return 'red'
}

export type CalendarCell =
  | { type: 'empty'; key: string }
  | { type: 'day'; dateStr: string; dayNumber: number }

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function localDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const daysInMonth = getDaysInMonth(year, month)
  // getDay(): 0=Sunday. In RTL grid, column 0 is visual-right = Sunday. So offset = getDay() directly.
  const startDayOfWeek = new Date(year, month - 1, 1).getDay()

  const cells: CalendarCell[] = []

  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `empty-start-${i}` })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ type: 'day', dateStr: localDateStr(year, month, d), dayNumber: d })
  }

  // Fill trailing empties to complete the last row
  const remainder = cells.length % 7
  if (remainder !== 0) {
    const trailing = 7 - remainder
    for (let i = 0; i < trailing; i++) {
      cells.push({ type: 'empty', key: `empty-end-${i}` })
    }
  }

  return cells
}
