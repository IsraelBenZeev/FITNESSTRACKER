import { useEffect, useState } from 'react'
import { Check, Clock } from 'lucide-react'
import { focusRing } from './styles'

/**
 * "When was it eaten" — a native time picker with a save button that shows up only after a change.
 * Saving is explicit because mobile pickers fire changes while the wheel is still spinning.
 */
export function EatenTimeField({ value, onSave, saving, label }: {
  /** Current eaten time, HH:MM */
  value: string
  onSave: (time: string) => void
  saving?: boolean
  /** Accessible name, e.g. "שעת אכילה של ארוחת בוקר" */
  label: string
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const dirty = /^\d{2}:\d{2}$/.test(draft) && draft !== value

  return (
    <span className="flex items-center gap-1.5">
      <label className={`flex items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft text-accent focus-within:border-accent h-10 px-3`}>
        <Clock size={15} strokeWidth={2} aria-hidden />
        <input
          type="time"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && dirty) onSave(draft) }}
          aria-label={label}
          className={`bg-transparent font-body tabular-nums text-accent outline-none [color-scheme:dark] w-[74px] text-sm font-semibold`}
        />
      </label>
      {dirty && (
        <button type="button" onClick={() => onSave(draft)} disabled={saving} aria-label={`שמור שעה ${draft}`}
          className={`flex flex-shrink-0 items-center justify-center rounded-full bg-accent text-bg transition-opacity duration-150 disabled:opacity-50 h-10 w-10 ${focusRing}`}>
          <Check size={18} strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}
