import { useState } from 'react'
import { ArrowRight, CalendarDays, CalendarRange, ChevronLeft } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { daysAgoLocal, todayLocal, toLocalDateStr } from '../../lib/date'
import { daysBetween, daysLabel, shortDate } from './calendarUtils'

export type ExportRange = {
  label: string
  sinceDate: string | null   // null = all time
  untilDate?: string | null  // if set, also lte('date', untilDate) — for exact days
}

type Preset = ExportRange & { hint: string }
type CustomMode = 'day' | 'range'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function thisWeekSunday(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay()) // getDay(): 0 = Sunday
  return toLocalDateStr(d)
}

/** Built on every open, so the dates are right even if the app stayed open past midnight */
function buildPresets(): { recent: Preset[]; periods: Preset[] } {
  const today = todayLocal()
  const yesterday = daysAgoLocal(1)
  const since = (from: string): Preset['hint'] => `${shortDate(from)}–${shortDate(today)}`
  const sunday = thisWeekSunday()
  return {
    recent: [
      { label: 'היום', sinceDate: today, untilDate: today, hint: shortDate(today) },
      { label: 'אתמול', sinceDate: yesterday, untilDate: yesterday, hint: shortDate(yesterday) },
      { label: 'השבוע הנוכחי', sinceDate: sunday, hint: since(sunday) },
    ],
    periods: [
      { label: 'חודש אחרון', sinceDate: daysAgoLocal(30), hint: since(daysAgoLocal(30)) },
      { label: '3 חודשים אחרונים', sinceDate: daysAgoLocal(90), hint: since(daysAgoLocal(90)) },
      { label: '6 חודשים אחרונים', sinceDate: daysAgoLocal(180), hint: since(daysAgoLocal(180)) },
      { label: 'שנה אחרונה', sinceDate: daysAgoLocal(365), hint: since(daysAgoLocal(365)) },
      { label: 'כל ההיסטוריה', sinceDate: null, hint: 'מהיום הראשון' },
    ],
  }
}

interface ExportRangeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  onSelect: (range: ExportRange) => void
  /** Label of the confirm button in the manual-date view (e.g. "העתק", "הורד PDF") */
  confirmLabel?: string
}

/** Pick the date range for an export: quick presets, one specific day, or from-date-to-date. */
export function ExportRangeModal({ isOpen, onClose, title, onSelect, confirmLabel = 'אישור' }: ExportRangeModalProps) {
  const [custom, setCustom] = useState<CustomMode | null>(null)
  const [from, setFrom] = useState(() => daysAgoLocal(6))
  const [to, setTo] = useState(() => todayLocal())
  const [day, setDay] = useState(() => todayLocal())

  const today = todayLocal()
  const { recent, periods } = buildPresets()

  function handleClose() {
    setCustom(null)
    onClose()
  }

  // Keep the range valid while typing: moving one edge past the other drags it along.
  function changeFrom(v: string) { if (!v) return; setFrom(v); if (v > to) setTo(v) }
  function changeTo(v: string) { if (!v) return; setTo(v); if (v < from) setFrom(v) }

  // onSelect runs inside the tap itself — the clipboard copy needs the user gesture (iOS Safari).
  function pick(range: ExportRange) {
    onSelect(range)
    handleClose()
  }

  function confirmCustom() {
    if (custom === 'day') pick({ label: day, sinceDate: day, untilDate: day })
    else pick({ label: `${from} - ${to}`, sinceDate: from, untilDate: to })
  }

  const customValid = custom === 'day' ? !!day && day <= today : !!from && !!to && from <= to && to <= today
  const customSummary = custom === 'day'
    ? (day ? new Date(`${day}T00:00:00`).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '')
    : (customValid ? `${daysLabel(daysBetween(from, to))} · ${shortDate(from)}–${shortDate(to)}` : '')

  const footer = custom ? (
    <button
      type="button"
      onClick={confirmCustom}
      disabled={!customValid}
      className={`flex h-12 w-full items-center justify-center rounded-2xl border border-accent bg-transparent font-body text-base font-semibold text-accent transition-[background-color,opacity] duration-150 hover:bg-accent-soft active:bg-accent-soft disabled:opacity-40 ${focusRing}`}
    >
      {confirmLabel}
    </button>
  ) : undefined

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={custom === 'day' ? 'תאריך מסוים' : custom === 'range' ? 'מתאריך עד תאריך' : title} footer={footer}>
      {!custom ? (
        <div className="flex flex-col gap-5">
          <Group heading="ימים אחרונים" items={recent} onPick={pick} />
          <Group heading="תקופות" items={periods} onPick={pick} />

          <section aria-labelledby="custom-range-heading" className="flex flex-col gap-2">
            <h3 id="custom-range-heading" className="px-1 font-body text-sm font-medium text-muted">בחירה ידנית</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <CustomTile icon={<CalendarDays size={20} strokeWidth={1.75} />} title="תאריך מסוים" desc="יום אחד" onClick={() => setCustom('day')} />
              <CustomTile icon={<CalendarRange size={20} strokeWidth={1.75} />} title="מתאריך עד תאריך" desc="טווח לבחירתך" onClick={() => setCustom('range')} />
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => setCustom(null)}
            className={`-ms-1 flex h-9 items-center gap-1.5 self-start rounded-lg px-1 font-body text-sm text-muted transition-colors duration-150 hover:text-text-col ${focusRing}`}
          >
            <ArrowRight size={16} strokeWidth={2} />
            כל הטווחים
          </button>

          {custom === 'day' ? (
            <DateField label="תאריך" value={day} max={today} onChange={(v) => v && setDay(v)} />
          ) : (
            <div className="flex flex-col gap-3">
              <DateField label="מתאריך" value={from} max={today} onChange={changeFrom} />
              <DateField label="עד תאריך" value={to} max={today} onChange={changeTo} />
            </div>
          )}

          <p aria-live="polite" className="min-h-[1.5rem] rounded-xl bg-accent-soft px-3.5 py-2.5 font-body text-sm tabular-nums text-accent">
            {customValid ? customSummary : 'אפשר לבחור תאריכים עד היום'}
          </p>
        </div>
      )}
    </Modal>
  )
}

function Group({ heading, items, onPick }: { heading: string; items: Preset[]; onPick: (r: ExportRange) => void }) {
  const id = `range-${heading}`
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3 id={id} className="px-1 font-body text-sm font-medium text-muted">{heading}</h3>
      <ul className="overflow-hidden rounded-2xl border border-border-col bg-bg">
        {items.map((r, i) => (
          <li key={r.label} className={i > 0 ? 'border-t border-border-col' : ''}>
            <button
              type="button"
              onClick={() => onPick(r)}
              className={`flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-right transition-colors duration-150 hover:bg-accent-soft active:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]`}
            >
              <span className="font-body text-[15px] text-text-col">{r.label}</span>
              <span className="flex items-center gap-1.5 font-body text-sm tabular-nums text-muted">
                {r.hint}
                <ChevronLeft size={16} strokeWidth={2} className="text-subtle" aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CustomTile({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-3 rounded-2xl border border-accent-line bg-transparent p-3.5 text-right hover:bg-accent-soft transition-colors duration-200 hover:border-accent ${focusRing} [-webkit-tap-highlight-color:transparent]`}
    >
      <span className="text-accent" aria-hidden>{icon}</span>
      <span className="flex flex-col gap-0.5">
        <span className="font-body text-[15px] font-medium text-heading">{title}</span>
        <span className="font-body text-xs text-muted">{desc}</span>
      </span>
    </button>
  )
}

/**
 * A date field that always fits: the date is shown as Hebrew text, and the native picker
 * (transparent, covering the whole field) opens on tap — no browser-drawn input to overflow.
 */
function DateField({ label, value, max, onChange }: { label: string; value: string; max: string; onChange: (v: string) => void }) {
  const shown = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    : 'בחר תאריך'
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="px-1 font-body text-sm text-muted">{label}</span>
      <span className="relative flex h-14 w-full min-w-0 items-center gap-3 rounded-2xl border border-border-col bg-bg px-4 transition-colors duration-150 hover:border-accent-line focus-within:border-accent">
        <CalendarDays size={20} strokeWidth={1.75} className="flex-shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-body text-base tabular-nums text-heading">{shown}</span>
        <ChevronLeft size={18} strokeWidth={2} className="flex-shrink-0 text-subtle" aria-hidden />
        <input
          type="date"
          value={value}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => { try { e.currentTarget.showPicker() } catch { /* older browsers open it themselves */ } }}
          aria-label={`${label}: ${shown}`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [color-scheme:dark]"
        />
      </span>
    </label>
  )
}
