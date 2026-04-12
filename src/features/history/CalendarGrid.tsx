import { buildCalendarCells, getDayColor, HEBREW_DAY_NAMES } from './calendarUtils'
import { CalendarDay } from './CalendarDay'
import type { DayTotals } from '../../types/nutrition'

interface CalendarGridProps {
  year: number
  month: number
  dayMap: Map<string, DayTotals>
  onDayPress: (dateStr: string, totals: DayTotals) => void
}

const todayStr = new Date().toISOString().split('T')[0]

export function CalendarGrid({ year, month, dayMap, onDayPress }: CalendarGridProps) {
  const cells = buildCalendarCells(year, month)

  return (
    <div style={{ direction: 'rtl' }}>
      {/* Day name headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '4px',
        }}
      >
        {HEBREW_DAY_NAMES.map((name) => (
          <div
            key={name}
            style={{
              textAlign: 'center',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '10px',
              color: '#555',
              padding: '4px 0',
            }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
        }}
      >
        {cells.map((cell) => {
          if (cell.type === 'empty') {
            return <div key={cell.key} />
          }

          const { dateStr, dayNumber } = cell
          const totals = dayMap.get(dateStr)
          const color = getDayColor(totals)
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr

          return (
            <CalendarDay
              key={dateStr}
              dayNumber={dayNumber}
              color={color}
              isToday={isToday}
              isFuture={isFuture}
              onClick={() => totals && onDayPress(dateStr, totals)}
            />
          )
        })}
      </div>
    </div>
  )
}
