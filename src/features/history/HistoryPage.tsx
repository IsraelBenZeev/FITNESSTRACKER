import { useState } from 'react'
import { useCalendarMonth } from './useHistory'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'
import { DayDetailSheet } from './DayDetailSheet'
import type { DayTotals } from '../../types/nutrition'

export function HistoryPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTotals, setSelectedTotals] = useState<DayTotals | null>(null)

  const { dayMap, loading } = useCalendarMonth(year, month)

  const disableNext =
    year === today.getFullYear() && month === today.getMonth() + 1

  function handlePrev() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function handleNext() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  function handleDayPress(dateStr: string, totals: DayTotals) {
    setSelectedDate(dateStr)
    setSelectedTotals(totals)
  }

  function handleClose() {
    setSelectedDate(null)
    setSelectedTotals(null)
  }

  if (loading) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: '#555',
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        טוען...
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <CalendarHeader
        year={year}
        month={month}
        onPrev={handlePrev}
        onNext={handleNext}
        disableNext={disableNext}
      />
      <CalendarGrid
        year={year}
        month={month}
        dayMap={dayMap}
        onDayPress={handleDayPress}
      />

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <LegendItem color="#4ade80" label="עמידה ביעד" />
        <LegendItem color="#fb923c" label="קרוב ליעד" />
        <LegendItem color="#ff4757" label="חריגה" />
        <LegendItem color="#333" label="אין דיווח" />
      </div>

      <DayDetailSheet
        dateStr={selectedDate}
        totals={selectedTotals}
        onClose={handleClose}
      />
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', direction: 'rtl' }}>
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          background: color,
          opacity: color === '#333' ? 1 : 0.7,
        }}
      />
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '11px',
          color: '#555',
        }}
      >
        {label}
      </span>
    </div>
  )
}
