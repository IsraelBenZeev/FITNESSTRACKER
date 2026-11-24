/**
 * The app's nutrition screen parts (BodyBuddy-Client/src/Features/nutrition/review):
 * MotivationCard (progress line with milestones), MacroPieChart (protein / calories ring with a toggle and goal edit),
 * ProgressStats (carbs / fat bars that can be hidden), the "how we calculate" card and the two goal dialogs.
 */
import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, AlertTriangle, ArrowUpCircle, ChevronDown, Droplet, Eye, Info, Loader2, Pencil, RefreshCw, Wheat, X } from 'lucide-react'
import { Stepper } from '../../shared/components/Stepper'

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

/** Starts at 0 and moves to the value after mount, like the app's entry animation */
function useAnimatedTarget(target: number) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setValue(target))
    return () => cancelAnimationFrame(id)
  }, [target])
  return value
}

// ---------- Motivation ----------

export interface MotivationContent {
  title: string
  subtitle: string
  severity?: 'warning' | 'danger'
}

/** getMotivationMessage from the app */
export function motivationMessage(remaining: number, progress: number): MotivationContent {
  const over = fmt(Math.abs(remaining))
  if (progress >= 100) {
    if (remaining < -300) return { title: 'רחוק מהקו', subtitle: `${over} קק״ל מעל היעד. כדאי לעצור ולתכנן את ההמשך`, severity: 'danger' }
    if (remaining < 0) return { title: 'עברת את הקו', subtitle: `${over} קק״ל מעל היעד. זה קורה`, severity: 'warning' }
    return { title: 'חצית את הקו', subtitle: 'היום הושלם בדיוק ביעד' }
  }
  if (progress >= 80) return { title: 'על קו הסיום', subtitle: 'צעד קטן אחרון' }
  if (progress >= 50) return { title: 'אחרי האמצע', subtitle: 'הרבע האחרון כבר באופק' }
  if (progress >= 20) return { title: 'בדרך הנכונה', subtitle: 'עוד קצת ותגיע לאמצע' }
  if (progress === 0) return { title: 'על קו הזינוק', subtitle: 'כל מה שצריך זה ארוחה אחת' }
  return { title: 'יצאת לדרך', subtitle: 'עברת את הצעד הראשון' }
}

const MILESTONES = [0, 25, 50, 75, 100]
const SEVERITY = {
  none: { text: 'text-lime-500', card: 'border-white/5 bg-white/[0.03]', fill: 'bg-lime-500', dot: 'border-lime-500 bg-lime-500', marker: 'border-lime-500 bg-lime-500/25' },
  warning: { text: 'text-macro-carbs', card: 'border-macro-carbs/30 bg-macro-carbs/[0.08]', fill: 'bg-macro-carbs', dot: 'border-macro-carbs bg-macro-carbs', marker: 'border-macro-carbs bg-macro-carbs/25' },
  danger: { text: 'text-danger', card: 'border-danger/30 bg-danger/[0.08]', fill: 'bg-danger', dot: 'border-danger bg-danger', marker: 'border-danger bg-danger/25' },
} as const

export function MotivationCard({ content, progress }: { content: MotivationContent; progress: number }) {
  const s = SEVERITY[content.severity ?? 'none']
  const shown = useAnimatedTarget(progress)
  return (
    <div role="group" aria-label={`${content.title}. ${content.subtitle}. ${progress}% מהיעד היומי`} className={`mb-4 rounded-3xl border p-4 ${s.card}`}>
      <p className={`typo-body-primary ${s.text}`}>{content.title}</p>
      <p className="typo-label text-background-300">{content.subtitle}</p>

      <div aria-hidden className="mt-3 h-[52px] px-3">
        <div className="relative h-full">
          <span className="absolute inset-x-0 top-3 h-1 rounded bg-white/10" />
          <span className={`absolute start-0 top-3 h-1 rounded transition-[width] duration-1000 ease-out ${s.fill}`} style={{ width: `${shown}%` }} />
          {MILESTONES.map((p) => (
            <span key={p}>
              <span
                className={`absolute top-2 -ms-1.5 h-3 w-3 rounded-full border-2 transition-colors duration-300 ${shown >= p ? s.dot : 'border-white/20 bg-background-950'}`}
                style={{ insetInlineStart: `${p}%` }}
              />
              <span className="typo-caption absolute top-[26px] -ms-5 w-10 text-center text-background-300" style={{ insetInlineStart: `${p}%` }}>
                {p}%
              </span>
            </span>
          ))}
          <span
            className={`absolute top-0.5 -ms-3 h-6 w-6 rounded-full border-2 transition-[inset-inline-start] duration-1000 ease-out ${s.marker}`}
            style={{ insetInlineStart: `${shown}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ---------- Protein / calories ring ----------

const SIZE = 200
const STROKE = 18
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

type Metric = 'protein' | 'calories'

interface RingProps {
  proteinConsumed: number
  proteinGoal: number
  caloriesConsumed: number
  caloriesGoal: number
  isManualCalories: boolean
  onEditCalories: () => void
  onEditProtein: () => void
}

export function MacroRingCard({ proteinConsumed, proteinGoal, caloriesConsumed, caloriesGoal, isManualCalories, onEditCalories, onEditProtein }: RingProps) {
  const [metric, setMetric] = useState<Metric>('calories')
  const isProtein = metric === 'protein'
  const consumed = Math.round(isProtein ? proteinConsumed : caloriesConsumed)
  const goal = isProtein ? proteinGoal : caloriesGoal
  const unit = isProtein ? 'ג׳' : 'קק״ל'
  const pct = goal > 0 ? Math.round((consumed / goal) * 100) : 0
  const remaining = Math.max(0, goal - consumed)
  const overage = Math.max(0, consumed - goal)
  const fraction = useAnimatedTarget(goal > 0 ? Math.min(1, consumed / goal) : 0)

  return (
    <section
      aria-label={isProtein ? 'יעד חלבון יומי' : 'יעד קלוריות יומי'}
      className={`mb-4 flex flex-col items-center rounded-2xl border bg-background-800 p-5 transition-[border-color,box-shadow] duration-300 ${
        isProtein ? 'border-macro-protein/35 shadow-[0_4px_12px_rgba(96,165,250,0.25)]' : 'border-lime-500/35 shadow-[0_4px_12px_rgba(150,200,40,0.25)]'
      }`}
    >
      <div className="mb-4 w-full">
        <h2 className="typo-h4 text-heading">{isProtein ? 'יעד חלבון יומי' : 'יעד קלוריות יומי'}</h2>

        <div className="mt-3 flex justify-end">
          <div role="radiogroup" aria-label="מדד מוצג" dir="ltr" className="relative flex h-11 w-[172px] rounded-full border border-white/[0.08] p-1">
            <span
              aria-hidden
              className={`absolute bottom-[3px] left-[3px] top-[3px] w-[82px] rounded-full border transition-[transform,background-color,border-color] duration-300 ${
                isProtein ? 'translate-x-0 border-macro-protein/50 bg-macro-protein/[0.18]' : 'translate-x-[82px] border-lime-500/50 bg-lime-500/[0.18]'
              }`}
            />
            <button type="button" role="radio" aria-checked={isProtein} onClick={() => setMetric('protein')}
              className={`typo-caption-bold relative flex-1 rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-macro-protein ${isProtein ? 'text-macro-protein' : 'text-background-400'}`}>
              חלבון
            </button>
            <button type="button" role="radio" aria-checked={!isProtein} onClick={() => setMetric('calories')}
              className={`typo-caption-bold relative flex-1 rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${!isProtein ? 'text-lime-300' : 'text-background-400'}`}>
              קלוריות
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={isProtein ? onEditProtein : onEditCalories}
            aria-label={isProtein ? 'עריכת יעד חלבון יומי' : 'עריכת יעד קלוריות יומי'}
            className={`typo-caption-bold flex min-h-[44px] items-center gap-1 px-1 focus-visible:outline focus-visible:outline-2 ${isProtein ? 'text-macro-protein focus-visible:outline-macro-protein' : 'text-lime-300 focus-visible:outline-lime-500'}`}
          >
            <Pencil size={13} aria-hidden />
            {!isProtein && isManualCalories ? 'עריכת יעד ידני' : 'עריכת יעד'}
          </button>
        </div>
      </div>

      <div className="relative mb-5 flex h-[200px] w-[200px] items-center justify-center">
        <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} className="stroke-white/[0.04]" strokeWidth={STROKE} fill="none" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R + STROKE / 2} className="stroke-white/10" strokeWidth={1} fill="none" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R - STROKE / 2} className="stroke-white/10" strokeWidth={1} fill="none" />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            strokeWidth={STROKE}
            strokeLinecap={fraction > 0 ? 'round' : 'butt'}
            fill="none"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - fraction)}
            className={`transition-[stroke-dashoffset,stroke] duration-[900ms] ease-out ${isProtein ? 'stroke-macro-protein' : 'stroke-lime-500'}`}
          />
        </svg>
        <div className="flex flex-col items-center gap-0.5" role="img" aria-label={`${fmt(consumed)} מתוך ${fmt(goal)} ${isProtein ? 'גרם חלבון' : 'קלוריות'}, ${pct} אחוז`}>
          <span className="typo-h2 leading-tight text-heading" aria-hidden>{fmt(consumed)}</span>
          <span className="typo-caption-bold leading-tight text-background-400" aria-hidden>{isProtein ? 'חלבון' : 'קלוריות'}</span>
          <span className="typo-caption leading-tight text-background-400" aria-hidden>מתוך {fmt(goal)} {isProtein ? 'גרם' : 'קק״ל'}</span>
          <span className={`typo-caption-bold mt-3 leading-tight ${isProtein ? 'text-macro-protein' : 'text-lime-300'}`} aria-hidden>{pct}%</span>
        </div>
      </div>

      <LegendRow dot={isProtein ? 'bg-macro-protein' : 'bg-lime-500'} label="נצרך" value={`${fmt(consumed)} ${unit}`} />
      <LegendRow dot="border border-white/30" label="נותר" value={remaining > 0 ? `${fmt(remaining)} ${unit}` : 'השגת יעד'} />
      <LegendRow dot="bg-danger" label="חריגה" value={overage > 0 ? `${fmt(overage)} ${unit}` : 'ללא'} valueClass={overage > 0 ? 'text-danger' : undefined} />
    </section>
  )
}

function LegendRow({ dot, label, value, valueClass }: { dot: string; label: string; value: string; valueClass?: string }) {
  return (
    <div className="mt-2 flex w-full items-center justify-between first-of-type:mt-0">
      <span className="flex items-center gap-2">
        <span aria-hidden className={`h-3 w-3 rounded-full ${dot}`} />
        <span className="typo-label text-heading">{label}</span>
      </span>
      <span className={`typo-label ${valueClass ?? 'text-background-400'}`}>{value}</span>
    </div>
  )
}

// ---------- Carbs / fat ----------

export type MacroKey = 'carbs' | 'fat'

const MACRO = {
  carbs: { label: 'פחמימות', Icon: Wheat, text: 'text-macro-carbs', bar: 'bg-macro-carbs', chip: 'border-macro-carbs/30 bg-macro-carbs/[0.12] text-macro-carbs' },
  fat: { label: 'שומנים', Icon: Droplet, text: 'text-macro-fat', bar: 'bg-macro-fat', chip: 'border-macro-fat/30 bg-macro-fat/[0.12] text-macro-fat' },
} as const

/** ProgressStats with the eye button beside it (hides the bar) */
export function MacroBar({ macro, consumed, goal, onHide }: { macro: MacroKey; consumed: number; goal: number; onHide: () => void }) {
  const m = MACRO[macro]
  const value = Math.round(consumed)
  const isOver = value > goal
  const overPct = isOver && goal > 0 ? ((value - goal) / goal) * 100 : 0
  const severe = overPct >= 15
  const overText = severe ? 'text-danger' : 'text-macro-carbs'
  const progress = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0
  const shown = useAnimatedTarget(progress)
  const displayPct = goal > 0 ? Math.round((value / goal) * 100) : 0
  const Icon = isOver ? AlertTriangle : m.Icon

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onHide}
        aria-label={`הסתר ${m.label}`}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-background-400 transition-colors hover:text-text-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
      >
        <Eye size={15} aria-hidden />
      </button>
      <div className={`mb-3 flex-1 rounded-2xl border bg-background-800 p-4 ${isOver ? (severe ? 'border-danger/40' : 'border-macro-carbs/40') : 'border-background-600'}`}>
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon size={20} className={isOver ? overText : m.text} aria-hidden />
            <span className="typo-body-primary text-heading">{m.label}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className={`typo-label ${isOver ? overText : 'text-background-50'}`}>{fmt(value)}</span>
            <span className="typo-caption text-background-400">מתוך</span>
            <span className="typo-label text-background-400">{fmt(goal)}</span>
            <span className="typo-caption text-background-400">ג׳</span>
          </span>
        </div>

        <div className="mb-2 h-3 overflow-hidden rounded-full bg-background-700" role="progressbar" aria-label={m.label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={goal}>
          <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${isOver ? (severe ? 'bg-danger' : 'bg-macro-carbs') : m.bar}`} style={{ width: `${shown}%` }} />
        </div>

        <div className="flex items-center justify-between">
          {isOver ? (
            <span className={`typo-caption flex items-center gap-1 ${overText}`}>
              <ArrowUpCircle size={14} aria-hidden />
              חריגה: +{fmt(value - goal)} ג׳
            </span>
          ) : (
            <span className="typo-caption text-background-400">נותר: {fmt(Math.max(0, goal - value))} ג׳</span>
          )}
          <span className={`typo-caption-bold ${isOver ? overText : 'text-background-400'}`}>{displayPct}%</span>
        </div>

        {isOver && (
          <div className={`mt-3 flex items-center gap-2 rounded-xl p-3 ${severe ? 'bg-danger/10' : 'bg-macro-carbs/10'}`}>
            {severe ? <AlertCircle size={16} className={overText} aria-hidden /> : <Info size={16} className={overText} aria-hidden />}
            <p className={`typo-label flex-1 ${overText}`}>{severe ? 'עברת את היעד בצורה משמעותית – שים לב מחר' : 'קצת מעל היעד'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** "הצג עוד" → chips for the hidden bars */
export function HiddenMacrosChips({ hidden, onShow }: { hidden: MacroKey[]; onShow: (m: MacroKey) => void }) {
  const [open, setOpen] = useState(false)
  if (hidden.length === 0) return null
  return (
    <div className="mb-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="typo-caption flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-background-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
        >
          <Eye size={13} aria-hidden />
          הצג עוד
          <ChevronDown size={11} aria-hidden />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {hidden.map((k) => {
            const m = MACRO[k]
            return (
              <button
                key={k}
                type="button"
                onClick={() => { onShow(k); setOpen(false) }}
                aria-label={`הצג ${m.label}`}
                className={`typo-caption flex items-center gap-1.5 rounded-full border px-3 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${m.chip}`}
              >
                <m.Icon size={13} aria-hidden />
                {m.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="סגור"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-background-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}

// ---------- How we calculate ----------

export function GoalInfoCard({ proteinPerKg, weight, isManualCalories }: { proteinPerKg: number; weight: number | null; isManualCalories: boolean }) {
  const perKg = proteinPerKg.toFixed(1)
  return (
    <div className="mb-4 rounded-3xl border border-white/5 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Info size={20} className="text-lime-500" aria-hidden />
        <h3 className="typo-body-primary text-heading">איך אנחנו מחשבים את היעדים?</h3>
      </div>
      <ul className="typo-label flex flex-col gap-1 leading-6 text-background-400">
        <li>
          • חלבון: כמות החלבון היומית היא פי {perKg} ממשקל הגוף שלך{weight ? ` (${weight} ק״ג)` : ''}, כלומר {perKg} גרם לכל ק״ג.
          ההמלצה למתאמנים היא בין 1.6 ל-2.2 גרם/ק״ג
        </li>
        <li>• קלוריות: {isManualCalories ? 'הוזנו ידנית על ידך, ולא מתעדכנות אוטומטית' : 'מחושבות לפי BMR × פעילות גופנית ± יעד'}</li>
      </ul>
    </div>
  )
}

// ---------- Goal dialogs ----------

function GoalDialog({ open, onClose, tone, title, description, children, extra, onSave, saving }: {
  open: boolean
  onClose: () => void
  tone: 'lime' | 'protein'
  title: string
  description: string
  children: ReactNode
  extra?: ReactNode
  onSave: () => void
  saving: boolean
}) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, saving, onClose])
  if (!open) return null

  const t = tone === 'lime'
    ? { icon: 'bg-lime-500/15 text-lime-300', save: 'bg-lime-500/10 text-lime-300 hover:bg-lime-500/20' }
    : { icon: 'bg-macro-protein/15 text-macro-protein', save: 'bg-macro-protein/10 text-macro-protein hover:bg-macro-protein/20' }

  return createPortal(
    <div onClick={() => !saving && onClose()} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] animate-[dialogIn_0.2s_cubic-bezier(0.33,1,0.68,1)_both] overflow-hidden rounded-3xl border border-white/10 bg-background-800 motion-reduce:animate-none"
      >
        <div className="flex flex-col items-center px-6 pb-2 pt-6 text-center">
          <span aria-hidden className={`mb-3 flex items-center justify-center rounded-full p-3 ${t.icon}`}><Pencil size={26} /></span>
          <h2 id={titleId} className="typo-h3 text-heading">{title}</h2>
          <p className="typo-label mt-2 leading-5 text-background-400">{description}</p>
        </div>
        <div className="px-6 py-6">{children}</div>
        {extra}
        <div className="flex border-t border-white/10">
          <button type="button" onClick={onClose} disabled={saving}
            className="typo-btn-cta flex min-h-[56px] flex-1 items-center justify-center border-e border-white/10 text-heading hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime-500">
            ביטול
          </button>
          <button type="button" onClick={onSave} disabled={saving} aria-busy={saving}
            className={`typo-btn-cta flex min-h-[56px] flex-1 items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime-500 ${t.save}`}>
            {saving ? <Loader2 size={20} className="animate-spin" aria-label="שומר…" /> : 'שמירה'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function ManualCaloriesDialog({ open, initialValue, isManual, canReset, onSave, onReset, onClose, saving }: {
  open: boolean
  initialValue: number
  isManual: boolean
  canReset: boolean
  onSave: (v: number) => void
  onReset: () => void
  onClose: () => void
  saving: boolean
}) {
  const [value, setValue] = useState(initialValue)
  useEffect(() => { if (open) setValue(initialValue) }, [open, initialValue])
  return (
    <GoalDialog
      open={open}
      onClose={onClose}
      tone="lime"
      title="יעד קלוריות ידני"
      description="קביעת יעד קבוע תחליף את החישוב האוטומטי לפי BMR ופעילות, ולא תתעדכן אם המשקל או הפעילות שלך ישתנו"
      onSave={() => onSave(value)}
      saving={saving}
      extra={isManual && canReset ? (
        <button type="button" onClick={onReset} disabled={saving}
          className="typo-label mx-auto mb-4 flex min-h-[44px] items-center gap-1.5 px-3 text-background-400 hover:text-text-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500">
          <RefreshCw size={15} aria-hidden />
          חזרה לחישוב אוטומטי
        </button>
      ) : undefined}
    >
      <Stepper value={value} onChange={setValue} min={800} max={6000} step={10} stepOptions={[1, 10, 50, 100]} unit="קק״ל ליום" />
    </GoalDialog>
  )
}

export function ManualProteinDialog({ open, initialValue, weight, onSave, onClose, saving }: {
  open: boolean
  initialValue: number
  weight: number | null
  onSave: (v: number) => void
  onClose: () => void
  saving: boolean
}) {
  const [value, setValue] = useState(initialValue)
  useEffect(() => { if (open) setValue(initialValue) }, [open, initialValue])
  return (
    <GoalDialog
      open={open}
      onClose={onClose}
      tone="protein"
      title="יעד חלבון יומי"
      description="קביעת כמות החלבון לכל ק״ג משקל לחישוב היעד היומי"
      onSave={() => onSave(value)}
      saving={saving}
    >
      <Stepper value={value} onChange={setValue} min={0.8} max={3} step={0.1} decimals={1} unit="גרם/ק״ג" tone="protein" />
      {weight != null && (
        <p className="typo-caption mt-3 text-center text-background-400">
          {`${fmt(weight * value)} גרם חלבון ביום (${weight} ק״ג)`}
        </p>
      )}
    </GoalDialog>
  )
}
