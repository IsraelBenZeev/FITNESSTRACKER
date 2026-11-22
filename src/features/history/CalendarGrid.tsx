import { buildCalendarCells, getDayColor, DAY_COLOR_LABEL, HEBREW_DAY_SHORT, HEBREW_DAY_NAMES, HEBREW_MONTHS } from './calendarUtils'
import type { CalendarCell } from './calendarUtils'
import { CalendarDay } from './CalendarDay'
import type { GoalsConfig } from '../../lib/useGoals'
import type { DayTotals } from '../../types/nutrition'
import { todayLocal, toLocalDateStr } from '../../lib/date'

interface CalendarGridProps {
  year: number
  month: number
  dayMap: Map<string, DayTotals>
  /** dayMap plus the neighbouring-month days of the first/last week (for weekly averages) */
  weekDayMap?: Map<string, DayTotals>
  onDayPress: (dateStr: string, totals: DayTotals) => void
  goalsConfig?: GoalsConfig
  loading?: boolean
}

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

/** 7 day columns (Sunday rightmost, RTL) + a weekly-average column at the end */
const cols = 'grid grid-cols-[repeat(7,minmax(0,1fr))_3.25rem] gap-1'

/** Average calories/protein over the logged days among `dates` (future days ignored) */
export function averageOf(dates: string[], dayMap: Map<string, DayTotals>): { calories: number; protein: number; days: number } | null {
  const today = todayLocal()
  let calories = 0, protein = 0, days = 0
  for (const d of dates) {
    const t = d <= today ? dayMap.get(d) : undefined
    if (!t) continue
    calories += t.calories; protein += t.protein; days++
  }
  return days ? { calories: calories / days, protein: protein / days, days } : null
}

/** Month grid with a weekly average beside every week. Logged days are tappable. */
export function CalendarGrid({ year, month, dayMap, weekDayMap = dayMap, onDayPress, goalsConfig, loading }: CalendarGridProps) {
  const todayStr = todayLocal()
  const cells = buildCalendarCells(year, month)
  const weeks: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div aria-busy={loading || undefined} className="flex flex-col gap-1">
      <div className={cols} aria-hidden>
        {HEBREW_DAY_SHORT.map((name) => (
          <span key={name} className="py-1 text-center font-body text-xs text-muted">{name}</span>
        ))}
        <span className="py-1 text-center font-body text-xs text-muted">ממוצע</span>
      </div>

      <div className={`flex flex-col gap-1 transition-opacity duration-200 ${loading ? 'animate-pulse opacity-60' : ''}`}>
        {weeks.map((week, wi) => {
          const dates = weekDates(year, month, wi)
          const avg = loading ? null : averageOf(dates, weekDayMap)
          const note = loading || !avg ? null : crossMonthNote(dates, year, month, weekDayMap, todayStr)
          return (
            <div key={wi} className="flex flex-col gap-0.5">
            <div className={`${cols} items-center`}>
              {week.map((cell) => {
                if (cell.type === 'empty') return <div key={cell.key} aria-hidden />

                const { dateStr, dayNumber } = cell
                const totals = loading ? undefined : dayMap.get(dateStr)
                const color = getDayColor(totals, dateStr, goalsConfig)
                const weekday = HEBREW_DAY_NAMES[new Date(year, month - 1, dayNumber).getDay()]
                const label = totals
                  ? `יום ${weekday}, ${dayNumber} ב${HEBREW_MONTHS[month]}: ${fmt(totals.calories)} קלוריות, ${DAY_COLOR_LABEL[color]}`
                  : `יום ${weekday}, ${dayNumber} ב${HEBREW_MONTHS[month]}: ${DAY_COLOR_LABEL.gray}`

                return (
                  <CalendarDay
                    key={dateStr}
                    dayNumber={dayNumber}
                    color={color}
                    isToday={dateStr === todayStr}
                    isFuture={dateStr > todayStr}
                    label={label}
                    onClick={() => totals && onDayPress(dateStr, totals)}
                  />
                )
              })}
              {dates[0]! > todayStr ? <div aria-hidden /> : <WeekAverage avg={avg} weighted={!!note} />}
            </div>
            {note && <p className="text-end font-body text-[11px] leading-tight text-muted">{note}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The 7 dates (Sunday→Saturday) of week row `wi` of the month grid, including days of the neighbouring months */
function weekDates(year: number, month: number, wi: number): string[] {
  const start = 1 - new Date(year, month - 1, 1).getDay() + wi * 7
  return Array.from({ length: 7 }, (_, i) => toLocalDateStr(new Date(year, month - 1, start + i)))
}

/** "משוקלל עם סוף אוקטובר" when logged days from the previous/next month are part of this week's average */
function crossMonthNote(dates: string[], year: number, month: number, map: Map<string, DayTotals>, today: string): string | null {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  const counted = dates.filter((d) => d <= today && map.has(d) && !d.startsWith(prefix))
  if (counted.length === 0) return null
  const before = counted[0]! < prefix
  const other = Number(counted[0]!.slice(5, 7))
  return before ? `משוקלל עם סוף ${HEBREW_MONTHS[other]}` : `משוקלל עם תחילת ${HEBREW_MONTHS[other]}`
}

function WeekAverage({ avg, weighted }: { avg: { calories: number; protein: number; days: number } | null; weighted?: boolean }) {
  if (!avg) {
    return <div aria-label="אין תיעוד בשבוע הזה" className="flex items-center justify-center rounded-xl bg-bg/50 font-body text-sm text-subtle">–</div>
  }
  return (
    <div
      aria-label={`ממוצע שבועי: ${fmt(avg.calories)} קלוריות ו-${fmt(avg.protein)} גרם חלבון ביום, לפי ${avg.days} ימים${weighted ? ", כולל ימים מחודש סמוך" : ""}`}
      className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-bg px-0.5"
    >
      <span className="font-display text-base font-semibold leading-none tabular-nums text-text-col">{fmt(avg.calories)}</span>
      <span className="font-display text-sm leading-none tabular-nums text-macro-protein">{fmt(avg.protein)}g</span>
    </div>
  )
}
