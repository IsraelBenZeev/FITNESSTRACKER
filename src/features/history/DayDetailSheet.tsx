import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { MealIcon } from '../../shared/icons/MealIcon'
import { useDayMeals } from './useHistory'
import { entryAmountLabel } from '../nutrition/foodMath'
import { MealGroupSheet } from '../nutrition/MealGroupSheet'
import type { DayTotals } from '../../types/nutrition'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

interface DayDetailSheetProps {
  dateStr: string | null
  totals: DayTotals | null
  onClose: () => void
}

function formatDate(dateStr: string): string {
  // Parse as a local date to avoid UTC offset issues
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** A past day: its totals and every meal with the foods in it (BodyBuddy entries). Tap a meal for its detail. */
export function DayDetailSheet({ dateStr, totals, onClose }: DayDetailSheetProps) {
  const { groups, loading } = useDayMeals(dateStr)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const openGroup = groups.find((g) => g.key === openKey) ?? null

  if (!dateStr) return null

  return (
    <>
      <Modal isOpen onClose={onClose} title={formatDate(dateStr)}>
        <div className="flex flex-col gap-5">
          {totals && (
            <section aria-label="סיכום היום" className="grid grid-cols-4 gap-2 rounded-3xl border border-border-col bg-bg p-3 text-center">
              <Stat label="קלוריות" value={fmt(totals.calories)} className="text-accent" />
              <Stat label="חלבון" value={`${fmt(totals.protein)}g`} className="text-macro-protein" />
              <Stat label="פחמימה" value={`${fmt(totals.carbs)}g`} className="text-macro-carbs" />
              <Stat label="שומן" value={`${fmt(totals.fat)}g`} className="text-macro-fat" />
            </section>
          )}

          <div className="flex items-center justify-between px-1">
            <h3 className="font-body text-base font-semibold text-heading">ארוחות</h3>
            {!loading && <span className="font-body text-sm tabular-nums text-muted">{groups.length}</span>}
          </div>

          {loading ? (
            <p className="py-8 text-center font-body text-sm text-muted" aria-busy="true">טוען…</p>
          ) : groups.length === 0 ? (
            <p className="py-8 text-center font-body text-sm text-muted">לא נרשמו ארוחות ביום הזה.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {groups.map((g) => (
                <li key={g.key}>
                  <button type="button" onClick={() => setOpenKey(g.key)} aria-label={`${g.name} משעה ${g.time}, ${fmt(g.calories)} קלוריות — פרטים`}
                    className={`flex w-full flex-col gap-3 rounded-3xl border border-border-col bg-surface p-4 text-right transition-colors duration-200 hover:border-accent ${focusRing}`}>
                    <span className="flex w-full items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border-col bg-bg text-muted" aria-hidden>
                        <MealIcon mealName={g.name} size={18} color="currentColor" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col items-start">
                        <span className="w-full truncate font-body text-base font-medium text-heading">{g.name}</span>
                        <span className="font-body text-xs tabular-nums text-muted">{g.time}</span>
                      </span>
                      <span className="flex flex-shrink-0 items-baseline gap-1">
                        <span className="font-display text-2xl font-semibold leading-none tabular-nums text-accent">{fmt(g.calories)}</span>
                        <span className="font-body text-xs text-muted">קק״ל</span>
                      </span>
                      <ChevronLeft size={18} strokeWidth={2} className="flex-shrink-0 text-muted" aria-hidden />
                    </span>
                    <ul className="flex w-full flex-col gap-1.5 border-t border-white/[0.06] pt-3">
                      {g.entries.map((e) => (
                        <li key={e.id} className="flex items-baseline justify-between gap-3 font-body text-sm">
                          <span className="min-w-0 truncate text-text-col">
                            {e.food_name} <span className="text-muted">· {entryAmountLabel(e)}</span>
                          </span>
                          <span className="flex-shrink-0 tabular-nums text-muted">{fmt(e.calories)}</span>
                        </li>
                      ))}
                    </ul>
                    <span className="flex gap-3 font-body text-xs tabular-nums">
                      <span className="text-macro-protein">חלבון {fmt(g.protein)}g</span>
                      <span className="text-macro-carbs">פחמ׳ {fmt(g.carbs)}g</span>
                      <span className="text-macro-fat">שומן {fmt(g.fat)}g</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <MealGroupSheet group={openGroup} onClose={() => setOpenKey(null)} />
    </>
  )
}

function Stat({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <span className="flex flex-col gap-1">
      <span className={`font-display text-xl font-semibold leading-none tabular-nums ${className}`}>{value}</span>
      <span className="font-body text-xs text-muted">{label}</span>
    </span>
  )
}
