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
  green: 'border-accent/35 bg-accent/15 text-accent group-hover:border-accent',
  orange: 'border-macro-fat/35 bg-macro-fat/15 text-macro-fat group-hover:border-macro-fat',
  red: 'border-danger/35 bg-danger/15 text-danger group-hover:border-danger',
  gray: 'border-transparent bg-surface2/60 text-muted',
}

/** Full-width cell (tap area) with the day as a circle inside */
const cell = 'group flex h-9 w-full items-center justify-center'
const circle = 'flex h-8 w-8 items-center justify-center rounded-full border font-display text-base font-semibold leading-none tabular-nums select-none'

export function CalendarDay({ dayNumber, color, isToday, isFuture, label, onClick }: CalendarDayProps) {
  const ring = isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''

  if (isFuture) {
    return <div aria-hidden className={cell}><span className={`${circle} border-transparent text-subtle`}>{dayNumber}</span></div>
  }
  if (color === 'gray') {
    return <div aria-label={label} className={cell}><span className={`${circle} ${TONE.gray} ${ring}`}>{dayNumber}</span></div>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${cell} rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]`}
    >
      <span className={`${circle} ${TONE[color]} ${ring} transition-[border-color,transform] duration-150 ease-out group-active:scale-90`}>{dayNumber}</span>
    </button>
  )
}
