import { useState } from 'react'
import { CheckCircle2, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { focusRing } from './styles'

export interface SegmentedOption {
  key: string
  label: string
  Icon: LucideIcon
}

/**
 * The app's "where to add" bar: a capsule of toggles (each turns on/off on its own)
 * and one action button that acts on what is selected.
 */
export function SegmentedActionBar({ options, selected, onToggle, actionLabel, onAction, disabled, loading, groupLabel, infoMessage }: {
  options: SegmentedOption[]
  selected: string[]
  onToggle: (key: string) => void
  actionLabel: string
  onAction: () => void
  disabled?: boolean
  loading?: boolean
  groupLabel: string
  infoMessage?: string
}) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <div role="group" aria-label={groupLabel} className="flex flex-1 overflow-hidden rounded-full border border-accent/45">
          {options.map((o, i) => {
            const on = selected.includes(o.key)
            const Icon = on ? CheckCircle2 : o.Icon
            return (
              <button
                key={o.key}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={loading}
                onClick={() => onToggle(o.key)}
                className={`flex min-h-12 flex-1 items-center justify-center gap-2 px-2 font-body text-sm font-bold transition-colors duration-150 ${focusRing}
                  ${i > 0 ? 'border-s border-accent/45' : ''} ${on ? 'bg-accent/[0.18] text-accent' : 'text-muted'}`}
              >
                <Icon size={18} strokeWidth={2} aria-hidden />
                {o.label}
              </button>
            )
          })}
        </div>
        {infoMessage && (
          <button type="button" onClick={() => setShowInfo((v) => !v)} aria-expanded={showInfo} aria-label="הסבר על אפשרויות ההוספה"
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-muted hover:text-text-col ${focusRing}`}>
            <Info size={18} strokeWidth={2} />
          </button>
        )}
      </div>
      {showInfo && infoMessage && (
        <p className="whitespace-pre-line rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-body text-sm text-text-col">{infoMessage}</p>
      )}
      <ActionButton onClick={onAction} disabled={disabled || selected.length === 0 || loading} Icon={CheckCircle2}>
        {loading ? 'שומר…' : actionLabel}
      </ActionButton>
    </div>
  )
}

/** The app's "soft" primary button: lime tint with a lime border */
export function ActionButton({ onClick, disabled, Icon, children, variant = 'soft', type = 'button' }: {
  onClick?: () => void
  disabled?: boolean
  Icon?: LucideIcon
  children: React.ReactNode
  variant?: 'soft' | 'outline'
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-accent/45 px-4 font-body text-base font-semibold text-accent transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-50 ${focusRing}
        ${variant === 'soft' ? 'bg-accent/[0.18] hover:bg-accent/25' : 'bg-transparent hover:bg-accent-soft'}`}
    >
      {Icon && <Icon size={20} strokeWidth={2} aria-hidden />}
      {children}
    </button>
  )
}
