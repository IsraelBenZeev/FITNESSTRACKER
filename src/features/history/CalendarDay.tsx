import type { DayColor } from './calendarUtils'

interface CalendarDayProps {
  dayNumber: number
  color: DayColor
  isToday: boolean
  isFuture: boolean
  /** Spoken description: date, calories, status */
  label: string
  onClick: () => void
}

const TONE: Record<DayColor, string> = {
  green: 'border-accent/30 bg-accent/15 text-accent hover:border-accent/70',
  orange: 'border-macro-fat/30 bg-macro-fat/15 text-macro-fat hover:border-macro-fat/70',
  red: 'border-danger/30 bg-danger/15 text-danger hover:border-danger/70',
  gray: 'border-transparent bg-surface2/60 text-muted',
}

const base = 'flex h-11 items-center justify-center rounded-xl border font-display text-lg font-semibold leading-none tabular-nums select-none'

export function CalendarDay({ dayNumber, color, isToday, isFuture, label, onClick }: CalendarDayProps) {
  const ring = isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''

  if (isFuture) {
    return <div aria-hidden className={`${base} border-transparent text-subtle`}>{dayNumber}</div>
  }
  if (color === 'gray') {
    return <div aria-label={label} className={`${base} ${TONE.gray} ${ring}`}>{dayNumber}</div>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${base} ${TONE[color]} ${ring} transition-[border-color,transform] duration-150 ease-out active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]`}
    >
      {dayNumber}
    </button>
  )
}
