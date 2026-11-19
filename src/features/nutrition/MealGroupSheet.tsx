import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { entryAmountLabel } from './foodMath'
import { useDeleteEntry, useDeleteGroup } from './hooks'
import type { MealGroup } from './types'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

interface MealGroupSheetProps {
  group: MealGroup | null
  onClose: () => void
  /** Open the add-food flow for this meal (today only) */
  onAddMore?: (group: MealGroup) => void
}

/** One logged meal: its foods, per-food delete, delete the whole meal, add more */
export function MealGroupSheet({ group, onClose, onAddMore }: MealGroupSheetProps) {
  const [confirm, setConfirm] = useState<{ kind: 'group' } | { kind: 'entry'; id: string; name: string } | null>(null)
  const delEntry = useDeleteEntry()
  const delGroup = useDeleteGroup()
  const busy = delEntry.isPending || delGroup.isPending

  if (!group) return null

  const footer = (
    <div className="flex gap-2.5">
      <button type="button" onClick={() => setConfirm({ kind: 'group' })} disabled={busy} aria-label="מחק את כל הארוחה"
        className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-danger/40 text-danger transition-colors duration-150 hover:bg-danger/10 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">
        <Trash2 size={20} strokeWidth={2} />
      </button>
      {onAddMore && (
        <button type="button" onClick={() => onAddMore(group)}
          className={`flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-accent font-body text-base font-semibold text-bg active:scale-[0.98] ${focusRing}`}>
          <Plus size={18} strokeWidth={2.5} aria-hidden />
          הוסף מאכל לארוחה
        </button>
      )}
    </div>
  )

  return (
    <Modal isOpen onClose={onClose} title={`${group.name} · ${group.time}`} footer={footer}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border-col bg-bg p-3 text-center">
          <Stat label="קלוריות" value={fmt(group.calories)} accent />
          <Stat label="חלבון" value={`${fmt(group.protein)}g`} />
          <Stat label="פחמימה" value={`${fmt(group.carbs)}g`} />
          <Stat label="שומן" value={`${fmt(group.fat)}g`} />
        </div>
        <ul className="flex flex-col divide-y divide-white/[0.06] rounded-2xl border border-border-col bg-bg">
          {group.entries.map((e) => (
            <li key={e.id} className="flex items-center gap-2 py-2 pe-1.5 ps-3.5">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-body text-[15px] text-text-col">{e.food_name}</span>
                <span className="font-body text-xs tabular-nums text-muted">
                  {entryAmountLabel(e)} · <span className="text-heading">{fmt(e.calories)}</span> קל' · <span className="text-macro-protein">{fmt(e.protein)}g</span> חלבון
                </span>
              </span>
              <button type="button" disabled={busy} onClick={() => setConfirm({ kind: 'entry', id: e.id, name: e.food_name })} aria-label={`מחק ${e.food_name}`}
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-muted hover:text-danger disabled:opacity-40 ${focusRing}`}>
                <Trash2 size={16} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
        <p className="font-body text-xs text-muted">לשינוי כמות: מחק את הפריט והוסף אותו מחדש (כמו באפליקציה).</p>
      </div>

      <ConfirmDialog
        isOpen={confirm != null}
        message={confirm?.kind === 'entry' ? `למחוק את ${confirm.name}?` : 'למחוק את כל הארוחה? אי אפשר לבטל.'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const c = confirm
          setConfirm(null)
          if (!c) return
          if (c.kind === 'entry') {
            const last = group.entries.length === 1
            delEntry.mutate(c.id, { onSuccess: () => { if (last) onClose() } })
          } else if (group.groupId) {
            delGroup.mutate(group.groupId, { onSuccess: onClose })
          } else {
            delEntry.mutate(group.entries[0]!.id, { onSuccess: onClose })
          }
        }}
      />
    </Modal>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`font-display text-xl font-semibold leading-none tabular-nums ${accent ? 'text-accent' : 'text-heading'}`}>{value}</span>
      <span className="font-body text-xs text-muted">{label}</span>
    </div>
  )
}
