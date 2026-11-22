import { useMemo, useState } from 'react'
import {
  Apple, Candy, Carrot, ChevronLeft, Cookie, CupSoda, Droplet, Drumstick, Dumbbell, Egg, Fish, History, Milk, Nut, Utensils, Wheat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { amountLabel, defaultAmountFor } from './foodMath'
import type { Food } from './types'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

/** Catalog categories (foods.nutrition_category) — same order, wording and icons as the BodyBuddy app */
export const CATEGORY_GROUPS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'meat', label: 'עוף ובשר', Icon: Drumstick },
  { id: 'eggs', label: 'ביצים', Icon: Egg },
  { id: 'fish', label: 'דגים', Icon: Fish },
  { id: 'dairy', label: 'מוצרי חלב', Icon: Milk },
  { id: 'carbs', label: 'פחמימה', Icon: Wheat },
  { id: 'vegetables', label: 'ירקות', Icon: Carrot },
  { id: 'fruits', label: 'פירות', Icon: Apple },
  { id: 'fats', label: 'שומן', Icon: Nut },
  { id: 'beverages', label: 'שתייה', Icon: CupSoda },
  { id: 'sweets', label: 'מתוק', Icon: Candy },
  { id: 'snacks', label: 'חטיפים', Icon: Cookie },
  { id: 'proteins', label: 'תוספי חלבון', Icon: Dumbbell },
  { id: 'sauces', label: 'רטבים', Icon: Droplet },
]

/** Foods shown per closed category, like the app */
const COLLAPSED_COUNT = 5

/** "אחרונים" — a row of chips that scrolls sideways, edge to edge */
export function RecentStrip({ foods, loading, onPick }: { foods: Food[] | undefined; loading: boolean; onPick: (f: Food) => void }) {
  if (!loading && !foods?.length) return null
  return (
    <section aria-labelledby="recent-h" className="flex flex-col gap-2">
      <h3 id="recent-h" className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-col">
        <History size={15} strokeWidth={2} className="text-accent" aria-hidden />
        אחרונים
      </h3>
      {loading ? (
        <p className="font-body text-sm text-muted" aria-busy="true">טוען…</p>
      ) : (
        <div className="hide-scrollbar -mx-5 flex snap-x gap-1.5 overflow-x-auto px-5 pb-1">
          {foods!.map((f) => (
            <button
              key={`${f.source}:${f.id}`}
              type="button"
              onClick={() => onPick(f)}
              aria-label={`בחר ${f.name}, ${amountLabel(f, defaultAmountFor(f))}`}
              className={`flex min-h-11 flex-shrink-0 snap-start flex-col items-center justify-center rounded-full border border-accent-line bg-accent-soft px-5 py-1.5 transition-transform duration-100 active:scale-95 ${focusRing}`}
            >
              <span className="whitespace-nowrap font-body text-sm font-semibold text-accent">{f.name}</span>
              <span className="whitespace-nowrap font-body text-xs text-muted">{amountLabel(f, defaultAmountFor(f))}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

/** The catalog grouped by category: a few chips each and "+N"; one category open at a time */
export function CategoryGroups({ foods, loading, onPick }: { foods: Food[] | undefined; loading: boolean; onPick: (f: Food) => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const groups = useMemo(() => {
    const by = new Map<string, Food[]>()
    for (const f of foods ?? []) {
      const k = f.category ?? 'other'
      const list = by.get(k)
      if (list) list.push(f)
      else by.set(k, [f])
    }
    return CATEGORY_GROUPS.map((g) => ({ ...g, items: by.get(g.id) ?? [] })).filter((g) => g.items.length > 0)
  }, [foods])

  if (loading) return <p className="py-6 text-center font-body text-sm text-muted" aria-busy="true">טוען את המאגר…</p>

  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ id, label, Icon, items }) => {
        const open = openId === id
        const visible = open ? items : items.slice(0, COLLAPSED_COUNT)
        const hidden = items.length - visible.length
        return (
          <div key={id} className={`flex items-start gap-2.5 ${open ? '-mx-2 rounded-3xl border border-accent-line bg-accent/[0.06] px-2 py-2.5' : ''}`}>
            <div className="flex w-16 flex-shrink-0 flex-col items-center gap-0.5 pt-1.5" aria-hidden>
              <Icon size={18} strokeWidth={2} className="text-accent" />
              <span className={`text-center font-body text-xs font-semibold leading-tight ${open ? 'text-accent' : 'text-text-col'}`}>{label}</span>
              {open && <span className="font-body text-xs tabular-nums text-muted">{items.length}</span>}
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5" role="group" aria-label={label}>
              {visible.map((f) => (
                <button key={f.id} type="button" onClick={() => onPick(f)} aria-label={`בחר ${f.name}`}
                  className={`min-h-9 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 font-body text-sm text-text-col transition-colors duration-100 hover:border-accent-line active:bg-accent-soft ${focusRing}`}>
                  {f.name}
                </button>
              ))}
              {(hidden > 0 || open) && (
                <button type="button" onClick={() => setOpenId(open ? null : id)} aria-expanded={open}
                  aria-label={open ? `הצג פחות ${label}` : `הצג עוד ${hidden} ב${label}`}
                  className={`min-h-9 rounded-full px-2.5 font-body text-sm font-bold text-accent ${focusRing}`}>
                  {open ? 'הצג פחות' : `+${hidden}`}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Search results as one card of rows (name, kcal per 100/unit, chevron), like the app */
export function ResultRows({ foods, onPick }: { foods: Food[]; onPick: (f: Food) => void }) {
  return (
    <ul className="flex flex-col overflow-hidden rounded-3xl border border-white/[0.05] bg-white/[0.03]">
      {foods.map((f, i) => {
        const v = f.measurement === 'units' ? f.perUnit : f.per100
        return (
          <li key={`${f.source}:${f.id}`} className={i < foods.length - 1 ? 'border-b border-white/[0.06]' : ''}>
            <button type="button" onClick={() => onPick(f)} aria-label={`בחר ${f.name}`}
              className={`flex min-h-14 w-full items-center gap-3 px-5 py-3 text-right transition-colors duration-100 hover:bg-white/[0.03] ${focusRing}`}>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span className="w-full truncate font-body text-base text-heading">{f.name}</span>
                {v && (
                  <span className="font-body text-xs tabular-nums text-muted">
                    {fmt(v.calories)} קק״ל {f.measurement === 'units' ? `ל${f.unitName ?? 'יחידה'}` : `ל-100 ${f.amountUnit === 'ml' ? 'מ״ל' : 'גרם'}`}
                    {f.source === 'personal' ? ' · שלי' : ''}
                  </span>
                )}
              </span>
              <ChevronLeft size={20} strokeWidth={2} className="flex-shrink-0 text-accent/50" aria-hidden />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** "My foods" card: category icon, name, per-100/unit label, big kcal, macro pills */
export function FoodCard({ food, onPick }: { food: Food; onPick: (f: Food) => void }) {
  const v = food.measurement === 'units' ? food.perUnit : food.per100
  const Icon = CATEGORY_GROUPS.find((g) => g.id === food.category)?.Icon ?? Utensils
  return (
    <button type="button" onClick={() => onPick(food)} aria-label={`${food.name} - בחר מאכל`}
      className={`flex w-full flex-col gap-3 rounded-3xl border border-white/5 bg-surface p-4 text-right transition-transform duration-100 active:scale-[0.98] ${focusRing}`}>
      <span className="flex w-full items-center gap-3">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-macro-fat/10 bg-macro-fat/10 text-macro-fat" aria-hidden>
          <Icon size={22} strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start">
          <span className="w-full truncate font-body text-lg font-medium text-heading">{food.name}</span>
          <span className="font-body text-sm text-muted">
            {food.measurement === 'units' ? `ל${food.unitName ?? 'יחידה'}` : `ל-100 ${food.amountUnit === 'ml' ? 'מ״ל' : 'גרם'}`}
            {food.source === 'catalog' ? ' · מהמאגר' : ''}
          </span>
        </span>
        <span className="flex flex-shrink-0 flex-col items-end">
          <span className="font-display text-3xl font-bold leading-none tabular-nums text-accent">{v ? fmt(v.calories) : '–'}</span>
          <span className="font-body text-xs text-muted">קק״ל</span>
        </span>
      </span>
      {v && <MacroPills protein={v.protein} carbs={v.carbs} fat={v.fat} />}
    </button>
  )
}

export function MacroPills({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const r = (n: number) => Math.round(n * 10) / 10
  return (
    <span className="flex flex-wrap gap-1.5">
      <Pill dot="bg-macro-protein" label="חלבון" value={r(protein)} />
      <Pill dot="bg-macro-carbs" label="פחמ׳" value={r(carbs)} />
      <Pill dot="bg-macro-fat" label="שומן" value={r(fat)} />
    </span>
  )
}

function Pill({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 font-body text-xs tabular-nums text-text-col">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label} {value}g
    </span>
  )
}
