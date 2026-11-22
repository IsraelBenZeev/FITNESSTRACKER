import { useState } from 'react'
import { Clock, Trash2 } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { entryAmountLabel } from './foodMath'
import { useDeleteEntry, useDeleteGroup } from './hooks'
import type { MealGroup, NutritionEntry } from './types'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

type PendingDelete = { kind: 'group' } | { kind: 'entry'; entry: NutritionEntry }

interface MealGroupSheetProps {
  group: MealGroup | null
  onClose: () => void
}

/**
 * A logged meal, read-only — like the app's entry detail: when it was added, the totals,
 * the foods with their amounts and macros, and delete (a food, or the whole meal).
 */
export function MealGroupSheet({ group, onClose }: MealGroupSheetProps) {
  const [pending, setPending] = useState<PendingDelete | null>(null)
  const delEntry = useDeleteEntry()
  const delGroup = useDeleteGroup()
  const busy = delEntry.isPending || delGroup.isPending

  if (!group) return null
  const single = group.entries.length === 1

  const confirm = () => {
    const p = pending
    setPending(null)
    if (!p) return
    if (p.kind === 'entry') {
      delEntry.mutate(p.entry.id, { onSuccess: () => { if (single) onClose() } })
    } else if (group.groupId) {
      delGroup.mutate(group.groupId, { onSuccess: onClose })
    } else {
      delEntry.mutate(group.entries[0]!.id, { onSuccess: onClose })
    }
  }

  const footer = (
    <button type="button" onClick={() => setPending({ kind: 'group' })} disabled={busy} aria-label={`מחק את הארוחה ${group.name}`}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-danger/40 bg-danger/10 font-body text-base font-semibold text-danger transition-colors duration-150 hover:bg-danger/15 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">
      <Trash2 size={18} strokeWidth={2} aria-hidden />
      {busy ? 'מוחק…' : single ? 'הסר מהיומן' : 'מחק ארוחה'}
    </button>
  )

  return (
    <Modal isOpen onClose={onClose} title={group.name} footer={footer}>
      <div className="flex flex-col gap-4">
        <span className="flex items-center gap-1.5 self-start rounded-full border border-accent-line bg-accent-soft px-3 py-1 font-body text-sm tabular-nums text-accent">
          <Clock size={15} strokeWidth={2} aria-hidden />
          נוסף ב-{group.time}
        </span>

        <section aria-label="סיכום הארוחה" className="flex items-end justify-between gap-4 rounded-3xl border border-border-col bg-bg px-4 py-3.5">
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-[44px] font-bold leading-none tabular-nums text-accent">{fmt(group.calories)}</span>
            <span className="font-body text-sm text-muted">קק״ל</span>
          </span>
          <span className="flex gap-4 pb-1 font-body text-sm tabular-nums">
            <Macro label="חלבון" value={group.protein} className="text-macro-protein" />
            <Macro label="פחמ׳" value={group.carbs} className="text-macro-carbs" />
            <Macro label="שומן" value={group.fat} className="text-macro-fat" />
          </span>
        </section>

        <div className="flex items-center justify-between px-1">
          <h3 className="font-body text-base font-semibold text-heading">מרכיבי הארוחה</h3>
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-body text-xs font-semibold text-accent">{group.entries.length} מרכיבים</span>
        </div>

        <ul className="flex flex-col gap-2.5">
          {group.entries.map((e) => (
            <li key={e.id} className="flex flex-col gap-1.5 rounded-3xl border border-white/[0.08] bg-white/[0.03] py-3 pe-2 ps-4">
              <span className="flex items-center justify-between gap-3 pe-2">
                <span className="min-w-0 flex-1 truncate font-body text-base text-heading">{e.food_name}</span>
                <span className="flex-shrink-0 rounded-full border border-accent/20 bg-accent/10 px-3 py-0.5 font-body text-xs font-semibold tabular-nums text-accent">{fmt(e.calories)} קק״ל</span>
              </span>
              <span className="flex items-center gap-3 font-body text-xs tabular-nums">
                <span className="text-muted">{entryAmountLabel(e)}</span>
                <span className="text-macro-protein">{fmt(e.protein)}</span>
                <span className="text-macro-carbs">{fmt(e.carbs)}</span>
                <span className="text-macro-fat">{fmt(e.fat)}</span>
                {!single && (
                  <button type="button" disabled={busy} onClick={() => setPending({ kind: 'entry', entry: e })} aria-label={`הסר את ${e.food_name} מהיומן`}
                    className={`-my-3 ms-auto flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:text-danger disabled:opacity-40 ${focusRing}`}>
                    <Trash2 size={17} strokeWidth={2} />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        visible={pending != null}
        title={pending?.kind === 'entry' ? `להסיר את "${pending.entry.food_name}"?` : `למחוק את "${group.name}"?`}
        message={pending?.kind === 'entry' ? 'המאכל יוסר מהארוחה ביומן.' : `${group.entries.length} מאכלים יימחקו מהיומן. אי אפשר לבטל את זה.`}
        confirmLabel={pending?.kind === 'entry' ? 'הסר' : 'מחק'}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </Modal>
  )
}

function Macro({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <span className="flex flex-col items-center leading-tight">
      <span className={`font-semibold ${className}`}>{fmt(value)}g</span>
      <span className="text-xs text-muted">{label}</span>
    </span>
  )
}
