import { useMemo, useState } from 'react'
import { CalendarHeader } from '../history/CalendarHeader'
import { buildCalendarCells, HEBREW_DAY_SHORT, HEBREW_MONTHS } from '../history/calendarUtils'
import { todayLocal } from '../../lib/date'
import type { BodyStat } from '../../types/body'

const one = (n: number) => n.toLocaleString('he-IL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const cell = 'group flex h-9 w-full items-center justify-center'
const circle = 'flex h-8 w-8 items-center justify-center rounded-full border font-display text-base font-semibold leading-none tabular-nums select-none'

/** Month calendar of weigh-ins: weighed days are lime circles; tap one to edit it. */
export function BodyCalendar({ stats, onSelect }: { stats: BodyStat[]; onSelect: (stat: BodyStat) => void }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const today = todayLocal()

  // Last measurement of each day
  const byDate = useMemo(() => {
    const m = new Map<string, BodyStat>()
    for (const s of stats) m.set(s.date, s)
    return m
  }, [stats])

  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const days = [...byDate.values()].filter((s) => s.date.startsWith(prefix) && s.weight_kg != null)
    const avg = days.length ? days.reduce((sum, s) => sum + (s.weight_kg ?? 0), 0) / days.length : null
    return { count: days.length, avg }
  }, [byDate, year, month])

  const prev = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const next = () => { if (month === 12) { setMonth(1); setYear((y) => y + 1) } else setMonth((m) => m + 1) }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-col bg-surface px-4 pb-4 pt-2">
      <CalendarHeader
        year={year}
        month={month}
        onPrev={prev}
        onNext={next}
        disableNext={isCurrentMonth}
        onToday={isCurrentMonth ? undefined : () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1) }}
      />

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-7 gap-1" aria-hidden>
          {HEBREW_DAY_SHORT.map((d) => <span key={d} className="py-1 text-center font-body text-xs text-muted">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {buildCalendarCells(year, month).map((c) => {
            if (c.type === 'empty') return <div key={c.key} aria-hidden />
            const stat = byDate.get(c.dateStr)
            const ring = c.dateStr === today ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
            if (!stat) {
              const future = c.dateStr > today
              return (
                <div key={c.dateStr} aria-hidden className={cell}>
                  <span className={`${circle} border-transparent ${future ? 'text-subtle' : 'bg-surface2/60 text-muted'} ${ring}`}>{c.dayNumber}</span>
                </div>
              )
            }
            const parts = [stat.weight_kg != null ? `${one(stat.weight_kg)} ק״ג` : null, stat.waist_cm != null ? `היקף ${one(stat.waist_cm)} ס״מ` : null].filter(Boolean)
            return (
              <button
                key={c.dateStr}
                type="button"
                onClick={() => onSelect(stat)}
                aria-label={`${c.dayNumber} ב${HEBREW_MONTHS[month]}: ${parts.join(', ')} — עריכה`}
                className={`${cell} rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]`}
              >
                <span className={`${circle} border-accent/35 bg-accent/15 text-accent transition-[border-color,transform] duration-150 group-hover:border-accent group-active:scale-90 ${ring}`}>
                  {c.dayNumber}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex min-h-[52px] items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3">
        <span className="font-body text-sm font-medium text-text-col">
          {monthStats.count === 0 ? 'אין שקילות בחודש הזה' : monthStats.count === 1 ? 'שקילה אחת החודש' : `${monthStats.count} שקילות החודש`}
        </span>
        {monthStats.avg != null && (
          <span className="flex items-baseline gap-1" aria-label={`ממוצע ${one(monthStats.avg)} קילוגרם`}>
            <span className="font-body text-xs text-muted">ממוצע</span>
            <span className="font-display text-2xl font-semibold leading-none tabular-nums text-heading">{one(monthStats.avg)}</span>
            <span className="font-body text-xs text-muted">ק״ג</span>
          </span>
        )}
      </div>
    </div>
  )
}
