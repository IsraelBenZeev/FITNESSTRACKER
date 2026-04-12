interface ProgressBarProps {
  value: number
  goal: number
  label: string
  unit?: string
}

export function ProgressBar({ value, goal, label, unit = '' }: ProgressBarProps) {
  const percent = Math.min((value / goal) * 100, 100)
  const isOver = value > goal
  const overBy = value - goal

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '13px',
            color: '#f0f0f0',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: '"Bebas Neue", cursive',
            fontSize: '16px',
            color: isOver ? '#ff4757' : '#D7FF00',
            letterSpacing: '0.03em',
          }}
        >
          {Math.round(value)} / {goal}{unit}
        </span>
      </div>

      <div style={{ height: '5px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: isOver ? '#ff4757' : '#D7FF00',
            borderRadius: '3px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {isOver && (
        <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#ff4757' }}>
          חרגת ב-{Math.round(overBy)}{unit}
        </span>
      )}
    </div>
  )
}
