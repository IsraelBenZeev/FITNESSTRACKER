import { useRef } from 'react'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  label?: string
  unit?: string
  decimals?: number
}

export function Stepper({ value, onChange, min, max, step, label, unit, decimals = 0 }: StepperProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clamp = (v: number) => Math.min(max, Math.max(min, parseFloat(v.toFixed(decimals))))

  const increment = () => onChange(clamp(value + step))
  const decrement = () => onChange(clamp(value - step))

  const startLongPress = (fn: () => void) => {
    fn()
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(fn, 80)
    }, 400)
  }

  const stopLongPress = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const atMin = value <= min
  const atMax = value >= max

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#333' : '#D7FF00',
    fontSize: '22px',
    fontFamily: '"Rubik", sans-serif',
    fontWeight: 300,
    lineHeight: 1,
    flexShrink: 0,
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'opacity 0.15s',
    opacity: disabled ? 0.35 : 1,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && (
        <span
          style={{
            fontFamily: '"Rubik", sans-serif',
            fontSize: '12px',
            color: '#666',
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          style={btnStyle(atMin)}
          disabled={atMin}
          onPointerDown={() => startLongPress(decrement)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
        >
          −
        </button>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '32px',
              fontWeight: 600,
              color: '#D7FF00',
              lineHeight: 1,
              minWidth: '60px',
              textAlign: 'center',
            }}
          >
            {value.toFixed(decimals)}
          </span>
          {unit && (
            <span
              style={{
                fontFamily: '"Rubik", sans-serif',
                fontSize: '13px',
                color: '#555',
              }}
            >
              {unit}
            </span>
          )}
        </div>

        <button
          style={btnStyle(atMax)}
          disabled={atMax}
          onPointerDown={() => startLongPress(increment)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
        >
          +
        </button>
      </div>
    </div>
  )
}
