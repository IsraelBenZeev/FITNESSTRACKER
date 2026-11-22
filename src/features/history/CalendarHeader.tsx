import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HEBREW_MONTHS } from './calendarUtils'

interface CalendarHeaderProps {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  disableNext: boolean
  /** Shown when browsing another month: jump back to the current one */
  onToday?: () => void
}

const navBtn =
  'flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-surface2 hover:text-text-col disabled:pointer-events-none disabled:text-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]'

export function CalendarHeader({ year, month, onPrev, onNext, disableNext, onToday }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {/* RTL: the right chevron (first child) goes back in time */}
      <button type="button" onClick={onPrev} aria-label="החודש הקודם" className={`-ms-2.5 ${navBtn}`}>
        <ChevronRight size={22} strokeWidth={2} />
      </button>

      <div className="flex min-w-0 flex-col items-center">
        <h2 aria-live="polite" className="font-body text-lg font-semibold text-heading">
          {HEBREW_MONTHS[month]} <span className="tabular-nums">{year}</span>
        </h2>
        {onToday && (
          <button
            type="button"
            onClick={onToday}
            className="-mt-0.5 rounded-md px-2 py-0.5 font-body text-sm text-accent transition-colors duration-150 hover:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            חזרה לחודש הנוכחי
          </button>
        )}
      </div>

      <button type="button" onClick={onNext} disabled={disableNext} aria-label="החודש הבא" className={`-me-2.5 ${navBtn}`}>
        <ChevronLeft size={22} strokeWidth={2} />
      </button>
    </div>
  )
}
