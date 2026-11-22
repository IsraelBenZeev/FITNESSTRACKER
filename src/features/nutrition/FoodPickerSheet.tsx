import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, PlusCircle, Plus } from 'lucide-react'
import { Modal, nextLevel, type SheetLevel } from '../../shared/components/Modal'
import { AddFoodFlow } from './AddFoodFlow'
import { FoodAmountPanel } from './FoodAmountPanel'
import { baseAmountFor } from './foodMath'
import { useMyFoods } from './hooks'
import type { Food, Macros } from './types'
import { ActionButton } from './ui/SegmentedActionBar'
import { BackLink, CountPill, EmptyState, FlowTitle, SearchField } from './ui/FlowParts'
import { focusRing } from './ui/styles'

/**
 * "בחירת מאכל" for a meal, like the app's ListFoodForMealBuilder:
 * my foods only (newest first, searchable) → amount → into the meal.
 * The catalog opens only from the (+), together with creating a personal food.
 */
export function FoodPickerSheet({ isOpen, onClose, onPick, baseTotals, level }: {
  isOpen: boolean
  onClose: () => void
  onPick: (food: Food, amount: number) => void
  baseTotals?: Macros
  level: SheetLevel
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<{ food: Food; amount: number } | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setSelected(null)
    setCatalogOpen(false)
  }, [isOpen])

  const mine = useMyFoods(isOpen)
  const foods = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = mine.data ?? []
    return q ? list.filter((f) => f.keywords.includes(q)) : list
  }, [mine.data, query])

  const footer = selected ? (
    <ActionButton onClick={() => onPick(selected.food, selected.amount)} Icon={PlusCircle}>הוסף לארוחה</ActionButton>
  ) : undefined

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={selected ? 'בחר כמות' : 'בחירת מאכל'} level={level} footer={footer}>
        {selected ? (
          <div className="flex flex-col">
            <BackLink onClick={() => setSelected(null)} label="חזרה לרשימה" />
            <FlowTitle eyebrow="בחר כמות" title={selected.food.name} />
            <FoodAmountPanel food={selected.food} amount={selected.amount} onChange={(amount) => setSelected({ ...selected, amount })} baseTotals={baseTotals} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SearchField value={query} onChange={setQuery} placeholder="חפש מאכל..." label="חיפוש במאכלים שלי" />

            <div className="flex items-center justify-between px-1">
              <h3 className="font-body text-base font-semibold text-heading">המאכלים שלי</h3>
              <div className="flex items-center gap-3">
                <CountPill>{foods.length} מאכלים</CountPill>
                <button type="button" onClick={() => setCatalogOpen(true)} aria-label="הוסף מאכל מהמאגר או צור מאכל חדש"
                  className={`flex h-11 w-11 items-center justify-center rounded-full border border-accent/45 bg-accent/[0.18] text-accent ${focusRing}`}>
                  <Plus size={24} strokeWidth={2} />
                </button>
              </div>
            </div>

            {mine.isLoading ? (
              <p className="py-6 text-center font-body text-sm text-muted" aria-busy="true">טוען…</p>
            ) : foods.length === 0 ? (
              <EmptyState
                title={query.trim() ? 'לא נמצא מאכל בשם הזה' : 'הרשימה ריקה'}
                text={query.trim() ? undefined : 'לחץ על ה-+ כדי להוסיף מהמאגר או ליצור מאכל'}
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {foods.map((f) => (
                  <li key={`${f.source}:${f.id}`}>
                    <PickerRow food={f} onSelect={() => setSelected({ food: f, amount: baseAmountFor(f) })} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>

      <AddFoodFlow
        isOpen={isOpen && catalogOpen}
        onClose={() => setCatalogOpen(false)}
        mode="meal-builder"
        level={nextLevel(level)}
        baseTotals={baseTotals}
        onPickForMeal={(food, amount) => {
          setCatalogOpen(false)
          onPick(food, amount)
        }}
      />
    </>
  )
}

function PickerRow({ food, onSelect }: { food: Food; onSelect: () => void }) {
  const v = food.measurement === 'units' ? food.perUnit : food.per100
  return (
    <button type="button" onClick={onSelect} aria-label={`${food.name} - בחר מאכל`}
      className={`flex w-full items-center gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 text-right transition-transform duration-100 active:scale-[0.98] ${focusRing}`}>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 flex-1 truncate font-body text-base text-heading">{food.name}</span>
          <span className="flex-shrink-0 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 font-body text-xs font-semibold tabular-nums text-accent">
            {Math.round(v?.calories ?? 0)} קק״ל
          </span>
        </span>
        <span className="flex items-center gap-3 font-body text-xs tabular-nums">
          <span className="text-macro-protein">{Math.round(v?.protein ?? 0)}</span>
          <span className="text-macro-carbs">{Math.round(v?.carbs ?? 0)}</span>
          <span className="text-macro-fat">{Math.round(v?.fat ?? 0)}</span>
          <span className="text-muted">{food.measurement === 'units' ? 'ליחידה' : `ל-100 ${food.amountUnit === 'ml' ? 'מ״ל' : 'גרם'}`}</span>
        </span>
      </span>
      <span aria-hidden className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-muted">
        <ChevronLeft size={16} strokeWidth={2} />
      </span>
    </button>
  )
}
