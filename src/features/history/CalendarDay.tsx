import { useState } from 'react'
import type { DayColor } from './calendarUtils'

interface CalendarDayProps {
  dayNumber: number
  color: DayColor
  isToday: boolean
  isFuture: boolean
  onClick: () => void
}

const COLOR_STYLES: Record<DayColor, { bg: string; border: string; text: string }> = {
  green:  { bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.4)',  text: '#4ade80' },
  orange: { bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.4)',  text: '#fb923c' },
  red:    { bg: 'rgba(255,71,87,0.15)',   border: 'rgba(255,71,87,0.4)',   text: '#ff4757' },
  gray:   { bg: '#1a1a1a',               border: '#222',                  text: '#444'    },
}

export function CalendarDay({ dayNumber, color, isToday, isFuture, onClick }: CalendarDayProps) {
  const [pressed, setPressed] = useState(false)
  const { bg, border, text } = COLOR_STYLES[color]
  const isInteractive = color !== 'gray' && !isFuture

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      onClick={isInteractive ? onClick : undefined}
      onPointerDown={() => isInteractive && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        aspectRatio: '1',
        borderRadius: '8px',
        border: `1px solid ${border}`,
        background: pressed ? `rgba(255,255,255,0.04)` : bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isInteractive ? 'pointer' : 'default',
        opacity: isFuture ? 0.3 : 1,
        outline: isToday ? '2px solid #D7FF00' : 'none',
        outlineOffset: '2px',
        transition: 'background 0.12s',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontFamily: '"Bebas Neue", cursive',
          fontSize: '16px',
          color: text,
          lineHeight: 1,
        }}
      >
        {dayNumber}
      </span>
    </div>
  )
}
