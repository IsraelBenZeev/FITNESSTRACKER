interface ProgressBarProps {
  value: number
  goal: number
  label: string
  unit?: string
  /** Visual weight: primary = thick track, secondary = thin */
  size?: 'primary' | 'secondary'
}

/**
 * Native <progress> styled via Tailwind pseudo-element variants,
 * so the fill width needs no inline style.
 */
export function ProgressBar({ value, goal, label, unit = '', size = 'secondary' }: ProgressBarProps) {
  const isOver = goal > 0 && value > goal
  const safeGoal = goal > 0 ? goal : 1

  const track = size === 'primary' ? 'h-2.5' : 'h-1.5'
  const fill = isOver
    ? '[&::-webkit-progress-value]:bg-danger [&::-moz-progress-bar]:bg-danger'
    : '[&::-webkit-progress-value]:bg-lime [&::-moz-progress-bar]:bg-lime'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-body text-sm text-text-col">{label}</span>
        <span className="font-body text-sm tabular-nums text-muted">
          <span className={isOver ? 'font-medium text-danger' : 'font-medium text-text-col'}>
            {Math.round(value).toLocaleString('he-IL')}
          </span>
          {' / '}
          {goal.toLocaleString('he-IL')}
          {unit}
        </span>
      </div>
      <progress
        value={Math.min(value, safeGoal)}
        max={safeGoal}
        aria-label={label}
        className={`block w-full appearance-none overflow-hidden rounded-full border-0 bg-surface2 ${track} ${fill}
          [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-surface2
          [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-300 [&::-webkit-progress-value]:ease-out
          [&::-moz-progress-bar]:rounded-full`}
      />
    </div>
  )
}
