import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HEBREW_MONTHS } from './calendarUtils'

interface CalendarHeaderProps {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  disableNext: boolean
}

export function CalendarHeader({ year, month, onPrev, onNext, disableNext }: CalendarHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        direction: 'rtl',
      }}
    >
      {/* In RTL: ChevronRight appears on visual-right = "go back in time" = previous month */}
      <button
        onClick={onPrev}
        style={{
          background: 'none',
          border: 'none',
          color: '#888',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '6px',
        }}
      >
        <ChevronRight size={20} />
      </button>

      <span
        style={{
          fontFamily: '"Bebas Neue", cursive',
          fontSize: '22px',
          color: '#f0f0f0',
          letterSpacing: '0.05em',
        }}
      >
        {HEBREW_MONTHS[month]} {year}
      </span>

      {/* ChevronLeft on visual-left = "go forward in time" = next month */}
      <button
        onClick={onNext}
        disabled={disableNext}
        style={{
          background: 'none',
          border: 'none',
          color: disableNext ? '#333' : '#888',
          cursor: disableNext ? 'default' : 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '6px',
        }}
      >
        <ChevronLeft size={20} />
      </button>
    </div>
  )
}
