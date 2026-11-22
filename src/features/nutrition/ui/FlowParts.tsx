import { ArrowRight, Search, X } from 'lucide-react'
import { focusRing } from './styles'

/** The app's centered screen title: small lime pill, big title, short lime bar */
export function FlowTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5 flex flex-col items-center">
      <span className="mb-2 rounded-full bg-accent/10 px-3 py-1 font-body text-xs font-bold uppercase tracking-[2px] text-accent">{eyebrow}</span>
      <h3 className="text-center font-body text-2xl font-bold text-heading">{title}</h3>
      <span aria-hidden className="mt-3 h-0.5 w-8 rounded-full bg-accent" />
    </div>
  )
}

export function BackLink({ onClick, label = 'חזרה' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`-ms-1 mb-2 flex h-11 items-center gap-1 self-start rounded-lg px-1 font-body text-sm text-muted hover:text-text-col ${focusRing}`}>
      <ArrowRight size={18} strokeWidth={2} aria-hidden />
      {label}
    </button>
  )
}

/** Search box: icon, input, clear button */
export function SearchField({ value, onChange, placeholder, label, autoFocus, highlight }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  label: string
  autoFocus?: boolean
  /** Lime border while there is a query (the catalog search) */
  highlight?: boolean
}) {
  return (
    <div className={`flex min-h-[52px] items-center gap-2.5 rounded-3xl border bg-white/[0.03] px-4 ${highlight && value.trim() ? 'border-accent-line' : 'border-white/[0.08]'}`}>
      <Search size={18} strokeWidth={2} className="flex-shrink-0 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        className="h-12 min-w-0 flex-1 bg-transparent font-body text-base text-heading outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="נקה חיפוש" className={`-me-2 flex h-10 w-10 items-center justify-center rounded-xl text-muted ${focusRing}`}>
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

/** "המאכלים שלי · 12 מאכלים · (+)" row header */
export function CountPill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-accent/10 px-3 py-1 font-body text-xs font-bold tabular-nums text-accent">{children}</span>
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
      <p className="font-body text-base text-muted">{title}</p>
      {text && <p className="font-body text-sm text-muted">{text}</p>}
    </div>
  )
}
