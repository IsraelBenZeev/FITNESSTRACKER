import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  unit?: string
  /** Step for the − / + nudge buttons */
  step?: number
  min?: number
  max?: number
  /** Large display for the field that matters most */
  emphasis?: boolean
  hint?: string
  invalid?: boolean
}

/**
 * Typing-first numeric input (numeric keypad on phones) with − / + nudges.
 * 0 renders as empty so the user types over nothing instead of deleting a zero.
 */
export function NumberField({
  label, value, onChange, unit, step = 1, min = 0, max = 9999, emphasis = false, hint, invalid = false,
}: NumberFieldProps) {
  const id = useId()
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)))

  const nudgeBtn =
    'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-surface2 hover:text-text-col active:bg-surface2 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]'

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-body text-sm text-muted">
        {label}
      </label>
      <div
        className={`flex items-center gap-1 rounded-2xl border bg-bg px-1 transition-colors duration-150 focus-within:border-accent-line
          ${invalid ? 'border-danger/60' : 'border-border-col'}`}
      >
        <button type="button" onClick={() => onChange(clamp(value - step))} disabled={value <= min} aria-label={`הפחת ${step}`} className={nudgeBtn}>
          <Minus size={18} strokeWidth={2} />
        </button>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            enterKeyHint="next"
            autoComplete="off"
            value={value === 0 ? '' : String(value)}
            placeholder="0"
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, '')
              onChange(digits === '' ? 0 : clamp(Number(digits)))
            }}
            aria-invalid={invalid || undefined}
            className={`w-full min-w-0 bg-transparent text-center font-display font-semibold tabular-nums text-heading caret-accent outline-none placeholder:text-subtle
              ${emphasis ? 'h-16 text-[40px]' : 'h-12 text-[26px]'}`}
          />
          {unit && <span className="flex-shrink-0 font-body text-sm text-muted">{unit}</span>}
        </div>
        <button type="button" onClick={() => onChange(clamp(value + step))} disabled={value >= max} aria-label={`הוסף ${step}`} className={nudgeBtn}>
          <Plus size={18} strokeWidth={2} />
        </button>
      </div>
      {hint && <p className={`font-body text-xs ${invalid ? 'text-danger' : 'text-muted'}`}>{hint}</p>}
    </div>
  )
}
