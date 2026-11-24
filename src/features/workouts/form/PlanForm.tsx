import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, type Control } from 'react-hook-form'
import { ArrowDownUp, Check, CheckCircle2, ChevronDown, ChevronUp, Clock, Dumbbell, GripVertical, Info, Plus, PlusCircle, X } from 'lucide-react'
import { bb } from '../../../lib/supabaseBodyBuddy'
import { useBbUserId } from '../../nutrition/hooks'
import { triggerFeedback } from '../../../store/uiStore'
import { useExercisesByIds, usePlan, wkKeys } from '../hooks'
import { ActionButton, CloseButton, Loading } from '../ui/primitives'
import { deriveMuscleKeys } from '../format'
import { DAY_LETTERS, type DayLetter, type Plan } from '../types'
import { ExercisePicker } from '../picker/ExercisePicker'
import { MUSCLE_PARTS, countSelectedSubs, getPartState, isSubSelected, toggleMusclePart, toggleMuscleSub } from './muscles'

interface FormValues {
  title: string
  description: string
  time: number
  days_per_week: DayLetter[]
  difficulty: number
}

/**
 * Create / edit a plan — BodyBuddy-Client/src/Features/workoutsPlans/form/Form.tsx:
 * exercises (add, remove, reorder), training areas, name, description, time, days, difficulty.
 */
export function PlanForm() {
  const { mode = 'create', planId } = useParams()
  const isEdit = mode === 'edit' && !!planId
  const navigate = useNavigate()
  const userId = useBbUserId()
  const qc = useQueryClient()
  const { data: plan, isLoading } = usePlan(isEdit ? planId : undefined)

  const [ids, setIds] = useState<string[]>([])
  const [muscleOverride, setMuscleOverride] = useState<string[] | null>(null)
  const [reordering, setReordering] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const inited = useRef(false)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { title: '', description: '', time: 0, days_per_week: [], difficulty: 5 },
  })

  useEffect(() => {
    if (!isEdit || !plan || inited.current) return
    inited.current = true
    setIds(plan.exercise_ids ?? [])
    setMuscleOverride(plan.muscle_groups ?? null)
    reset({ title: plan.title, description: plan.description ?? '', time: plan.time ?? 0, days_per_week: plan.days_per_week ?? [], difficulty: plan.difficulty ?? 5 })
  }, [isEdit, plan, reset])

  const { data: exercises = [] } = useExercisesByIds(ids)
  const derived = useMemo(() => deriveMuscleKeys(exercises), [exercises])

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (v: FormValues) => {
      const row = {
        user_id: userId,
        title: v.title.trim(),
        description: v.description ?? '',
        time: v.time,
        difficulty: v.difficulty,
        days_per_week: v.days_per_week,
        exercise_ids: ids,
        muscle_groups: muscleOverride,
        ...(isEdit ? { id: planId } : {}),
      }
      const { error } = await bb().from('workouts_plans').upsert(row).select().single()
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: wkKeys.all })
      qc.invalidateQueries({ queryKey: ['bb', 'workout'] })
      triggerFeedback(isEdit ? 'עודכן בהצלחה' : 'נוצר בהצלחה', 'success')
      navigate(-1)
    },
    onError: () => triggerFeedback('שגיאה בשמירת האימון', 'failed'),
  })

  if (isEdit && isLoading) return <div className="flex h-[100dvh] items-center justify-center bg-background-950"><Loading size={96} /></div>

  const remove = (id: string) => setIds((cur) => cur.filter((x) => x !== id))
  const move = (from: number, to: number) =>
    setIds((cur) => {
      if (to < 0 || to >= cur.length) return cur
      const next = [...cur]
      const [x] = next.splice(from, 1)
      next.splice(to, 0, x)
      return next
    })

  return (
    <div className="relative flex h-[100dvh] flex-col bg-background-950">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[140px] pt-[calc(env(safe-area-inset-top,0px)+10px)]">
        <div className="mb-4 mt-2 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="typo-h1 tracking-tight text-background-50">{isEdit ? 'עריכת אימון' : 'יצירת אימון'}</h1>
            <p className="typo-label mt-1 text-background-400">{ids.length > 0 ? `${ids.length} תרגילים נבחרו לאימון` : 'התחל בבחירת תרגילים לאימון'}</p>
          </div>
          <CloseButton onPress={() => navigate(-1)} label="סגור" />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="typo-h4 text-heading">תרגילים</h2>
            <span className="typo-label text-background-400">{ids.length}</span>
          </div>
          {!reordering && (
            <div className="flex items-center gap-2">
              {ids.length > 1 && <ActionButton onPress={() => setReordering(true)} label="שנה סדר תרגילים" icon={ArrowDownUp} variant="secondary" iconOnly disabled={isPending} />}
              <ActionButton onPress={() => setPickerOpen(true)} label="הוסף תרגילים" icon={Plus} variant="outline" iconOnly disabled={isPending} />
            </div>
          )}
        </div>

        <ul className={`mb-8 flex flex-col ${reordering ? '' : 'max-h-[25dvh] overflow-y-auto'}`}>
          {ids.length === 0 && (
            <li>
              <button type="button" onClick={() => setPickerOpen(true)} className="typo-body-primary flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-lime-500/45 bg-lime-500/5 py-6 text-lime-300">
                <Plus size={18} /> הוסף תרגילים
              </button>
            </li>
          )}
          {ids.map((id, i) => {
            const ex = exercises.find((e) => e.exerciseId === id)
            return (
              <li key={id} className="mb-3 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
                {!reordering && (
                  <button type="button" onClick={() => remove(id)} aria-label={`הסר ${ex?.name_he ?? ''}`} className="me-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger active:scale-90">
                    <X size={20} />
                  </button>
                )}
                <span className="flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
                  {ex?.imageUrls[0] ? <img src={ex.imageUrls[0]} alt="" className="h-14 w-14 object-cover" /> : <span className="flex h-14 w-14 items-center justify-center text-lime-500"><Dumbbell size={28} /></span>}
                </span>
                <span className="flex min-w-0 flex-1 flex-col items-start">
                  <span className="typo-body-primary w-full truncate text-heading">{ex?.name_he ?? '…'}</span>
                  <span className="typo-caption mt-1 text-zinc-400">{ex?.targetMuscles_he?.[0] || ex?.bodyParts_he?.[0]}</span>
                </span>
                {reordering && (
                  <span className="flex flex-col">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="הזז למעלה" className="flex h-9 w-11 items-center justify-center text-background-300 disabled:opacity-25"><ChevronUp size={22} /></button>
                    <GripVertical size={18} className="mx-auto text-background-500" aria-hidden />
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === ids.length - 1} aria-label="הזז למטה" className="flex h-9 w-11 items-center justify-center text-background-300 disabled:opacity-25"><ChevronDown size={22} /></button>
                  </span>
                )}
              </li>
            )
          })}
        </ul>

        {!reordering && (
          <div className="flex flex-col gap-6">
            <MuscleGroupsPicker
              selected={muscleOverride ?? derived}
              isAuto={muscleOverride === null}
              hasExercises={ids.length > 0}
              onChange={setMuscleOverride}
              onReset={() => setMuscleOverride(null)}
              disabled={isPending}
            />
            <TextField control={control} name="title" label="שם האימון" placeholder="לדוגמה: אימון כוח עליון A" required disabled={isPending} />
            <TextField control={control} name="description" label="תיאור ודגשים" placeholder="הוסף הערות או דגשים לאימון..." multiline disabled={isPending} />
            <TimeField control={control} disabled={isPending} />
            <DaysField control={control} disabled={isPending} />
            <DifficultySlider control={control} disabled={isPending} />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background-950 via-background-950/95 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4">
        {reordering ? (
          <div className="flex justify-center"><ActionButton onPress={() => setReordering(false)} label="סיים שינוי סדר תרגילים" icon={Check} variant="primary" iconOnly /></div>
        ) : (
          <ActionButton
            onPress={handleSubmit((v) => save(v))}
            label={isPending ? (isEdit ? 'מעדכן את האימון...' : 'יוצר עבורך את האימון...') : isEdit ? 'עדכן את האימון' : 'צור אימון חדש'}
            icon={isEdit ? CheckCircle2 : PlusCircle}
            variant="primary"
            size="md"
            fullWidth
            loading={isPending}
            disabled={isPending}
          />
        )}
      </div>

      <ExercisePicker
        isOpen={pickerOpen}
        selectedIds={ids}
        onToggle={(id) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))}
        onClear={() => setIds([])}
        onDone={() => setPickerOpen(false)}
      />
    </div>
  )
}

// ---------- fields ----------

const inputClass =
  'typo-input w-full rounded-2xl border border-background-700 bg-background-800 px-4 text-lime-500 placeholder:text-background-500 focus:border-lime-500/60 focus:outline-none disabled:opacity-60'

function TextField({ control, name, label, placeholder, multiline, required, disabled }: {
  control: Control<FormValues>; name: 'title' | 'description'; label: string; placeholder: string; multiline?: boolean; required?: boolean; disabled?: boolean
}) {
  return (
    <Controller
      control={control}
      name={name}
      rules={required ? { validate: (v) => (v ?? '').trim().length > 0 || 'חובה להזין שם אימון' } : undefined}
      render={({ field, fieldState: { error } }) => (
        <label className="mb-1 flex flex-col">
          <span className="typo-label mb-2 text-background-400">{label}</span>
          {multiline ? (
            <textarea {...field} placeholder={placeholder} disabled={disabled} rows={4} className={`${inputClass} h-[120px] resize-none pt-4`} />
          ) : (
            <input {...field} placeholder={placeholder} disabled={disabled} className={`${inputClass} h-14`} />
          )}
          {error && <span className="mt-1 text-sm text-danger">{error.message}</span>}
        </label>
      )}
    />
  )
}

/** form/TimeInput + ButtonLabelTime — a field that opens an hours/minutes picker sheet */
function TimeField({ control, disabled }: { control: Control<FormValues>; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [h, setH] = useState(0)
  const [m, setM] = useState(0)
  return (
    <Controller
      control={control}
      name="time"
      rules={{ validate: (v) => v > 0 || 'חובה להזין זמן' }}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <div>
          <span className="typo-label mb-2 me-1 block text-gray-400">משך התרגיל</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => { setH(Math.floor((value || 0) / 60)); setM((value || 0) % 60); setOpen(true) }}
            className="flex h-14 w-full items-center justify-between rounded-2xl border border-background-700 bg-background-800 p-4 active:opacity-70"
          >
            <span dir="ltr" className="typo-h4 text-heading">{value > 0 ? `${Math.floor(value / 60)}h ${value % 60}m` : '00:00'}</span>
            <Clock size={20} className="text-lime-500 opacity-50" aria-hidden />
          </button>
          {error && <span className="mt-1 block text-sm text-danger">{error.message}</span>}
          {open && (
            <div className="fixed inset-0 z-[300] flex flex-col justify-end bg-black/70" role="dialog" aria-modal="true" aria-label="משך האימון">
              <div className="animate-[trayIn_0.28s_ease] rounded-t-2xl bg-background-800 p-4 pb-[max(16px,env(safe-area-inset-bottom,0px))]">
                <div className="mb-4 flex justify-between px-3">
                  <button type="button" onClick={() => setOpen(false)} className="typo-h4 text-danger">ביטול</button>
                  <button type="button" onClick={() => { onChange(h * 60 + m); setOpen(false) }} className="typo-h4 text-lime-500">אישור</button>
                </div>
                <div dir="ltr" className="flex items-center justify-center gap-6 rounded-[20px] border border-lime-500 bg-background-700 p-5">
                  <Wheel value={h} max={9} step={1} onChange={setH} label="HR" />
                  <Wheel value={m} max={55} step={5} onChange={setM} label="MIN" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    />
  )
}

/** A scroll-snap number wheel (stand-in for react-native-timer-picker) */
function Wheel({ value, max, step, onChange, label }: { value: number; max: number; step: number; onChange: (v: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const ITEM = 48
  const values = useMemo(() => Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step), [max, step])
  useEffect(() => { ref.current?.scrollTo({ top: (value / step) * ITEM }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex items-center gap-2">
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onScroll={(e) => onChange(values[Math.round(e.currentTarget.scrollTop / ITEM)] ?? 0)}
        onKeyDown={(e) => {
          const i = values.indexOf(value)
          if (e.key === 'ArrowDown') { e.preventDefault(); ref.current?.scrollTo({ top: Math.min(values.length - 1, i + 1) * ITEM, behavior: 'smooth' }) }
          if (e.key === 'ArrowUp') { e.preventDefault(); ref.current?.scrollTo({ top: Math.max(0, i - 1) * ITEM, behavior: 'smooth' }) }
        }}
        className="h-[144px] w-16 snap-y snap-mandatory overflow-y-auto py-12 [mask-image:linear-gradient(transparent,black_30%,black_70%,transparent)] [scrollbar-width:none]"
      >
        {values.map((v) => (
          <div key={v} role="option" aria-selected={v === value} className={`flex h-12 snap-center items-center justify-center text-[34px] font-light tabular-nums ${v === value ? 'text-heading' : 'text-heading/40'}`}>
            {String(v).padStart(2, '0')}
          </div>
        ))}
      </div>
      <span className="text-base font-extrabold text-lime-500">{label}</span>
    </div>
  )
}

/** form/Days.tsx */
function DaysField({ control, disabled }: { control: Control<FormValues>; disabled?: boolean }) {
  return (
    <Controller
      control={control}
      name="days_per_week"
      rules={{ validate: (v) => v.length > 0 || 'חובה לבחור לפחות יום אחד' }}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <div className="mb-6">
          <span className="typo-label mb-3 block text-background-400">ימי אימון</span>
          <div className="flex items-center justify-between rounded-2xl border border-background-800 bg-background-900/50 p-2">
            {DAY_LETTERS.map((d) => {
              const on = value.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  disabled={disabled}
                  aria-pressed={on}
                  onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d])}
                  className={`typo-body-primary flex h-10 w-10 items-center justify-center rounded-full border transition-opacity active:opacity-70 ${on ? 'border-lime-500/50 bg-lime-500/[0.18] text-lime-300' : 'border-transparent text-background-400'}`}
                >
                  {d}
                </button>
              )
            })}
          </div>
          {error && <span className="mt-2 block text-sm text-danger">{error.message}</span>}
        </div>
      )}
    />
  )
}

/** form/Slider.tsx — vertical 1–10 intensity slider with the gradient revealed by the value */
function DifficultySlider({ control, disabled }: { control: Control<FormValues>; disabled?: boolean }) {
  return (
    <Controller
      control={control}
      name="difficulty"
      render={({ field: { value, onChange } }) => {
        const v = Math.round(value || 5)
        const accent = v >= 8 ? 'text-danger' : v >= 4 ? 'text-lime-300' : 'text-background-300'
        const ring = v >= 8 ? 'border-danger shadow-danger/70' : v >= 4 ? 'border-lime-300 shadow-lime-300/70' : 'border-background-300 shadow-background-300/70'
        return (
          <div className="mb-6">
            <span className="typo-label mb-3 block text-background-400">רמת קושי</span>
            <div className="flex items-center justify-center gap-4 rounded-3xl border border-white/[0.08] bg-background-900 p-5 shadow-md shadow-black">
              <div className="flex flex-col items-center">
                <span className="typo-caption-bold mb-1 text-danger/70">אינטנסיבי</span>
                <VerticalTrack value={v} onChange={onChange} disabled={disabled} ringClass={ring} />
                <span className="typo-caption-bold mt-1 text-background-500">קל מאוד</span>
              </div>
              <div dir="ltr" className="flex items-center text-5xl font-extralight leading-[52px]">
                <span className={`w-[65px] text-center ${accent}`}>{v}</span>
                <span className="w-5 text-center text-background-400">/</span>
                <span className="w-[65px] text-center text-background-400">10</span>
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}

function VerticalTrack({ value, onChange, disabled, ringClass }: { value: number; onChange: (v: number) => void; disabled?: boolean; ringClass: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const apply = (clientY: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const ratio = 1 - Math.max(0, Math.min(r.height, clientY - r.top)) / r.height
    const next = Math.min(10, Math.max(1, Math.round(1 + ratio * 9)))
    if (next !== value) onChange(next)
  }
  const ratio = (value - 1) / 9
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="רמת קושי"
      aria-valuemin={1}
      aria-valuemax={10}
      aria-valuenow={value}
      onPointerDown={(e) => { if (disabled) return; e.currentTarget.setPointerCapture(e.pointerId); apply(e.clientY) }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) apply(e.clientY) }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); onChange(Math.min(10, value + 1)) }
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); onChange(Math.max(1, value - 1)) }
      }}
      className="relative flex h-[150px] w-12 touch-none justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
    >
      <span className="relative h-full w-[18px] overflow-hidden rounded-full border border-white/10 bg-background-800">
        <span className="absolute inset-0 bg-gradient-to-b from-danger via-lime-400 to-lime-500" />
        <span className="absolute inset-x-0 top-0 bg-background-800" style={{ height: `${(1 - ratio) * 100}%` }} />
      </span>
      <span
        aria-hidden
        className={`pointer-events-none absolute h-[26px] w-[26px] -translate-y-1/2 rounded-full border-[3px] bg-background-900 shadow-[0_0_6px] ${ringClass}`}
        style={{ top: `${(1 - ratio) * 100}%` }}
      />
    </div>
  )
}

/** form/MuscleGroupsPicker.tsx — area chips; areas with sub-areas open a small panel */
function MuscleGroupsPicker({ selected, isAuto, hasExercises, onChange, onReset, disabled }: {
  selected: string[]; isAuto: boolean; hasExercises: boolean; onChange: (k: string[]) => void; onReset: () => void; disabled?: boolean
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [info, setInfo] = useState(false)
  const CHIP = { all: 'bg-lime-500/20 border-lime-500/50', some: 'bg-lime-500/10 border-lime-500/40', none: 'bg-white/[0.03] border-white/10' } as const
  const open = MUSCLE_PARTS.find((p) => p.key === openKey) ?? null
  const caption = isAuto
    ? hasExercises ? 'נבחר אוטומטית לפי התרגילים. לחץ על אזור כדי לערוך ידנית' : 'הוסף תרגילים כדי שהאזורים יתמלאו אוטומטית, או בחר ידנית'
    : 'נבחר ידנית'

  return (
    <div>
      <div className="relative mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="typo-label text-background-400">אימון זה על אזורים</span>
          {isAuto && (
            <button type="button" onClick={() => setInfo((i) => !i)} aria-label="מידע" aria-expanded={info} className="text-background-400">
              <Info size={16} />
            </button>
          )}
          {info && isAuto && (
            <span role="tooltip" className="typo-caption absolute top-7 z-10 rounded-xl border border-white/10 bg-background-800 px-3 py-2 text-zinc-300 shadow-md shadow-black">
              אזורים אלו נבחרו על בסיס התרגילים שהכנסת לאימון
            </span>
          )}
        </div>
        {!isAuto && (
          <button type="button" onClick={onReset} disabled={disabled} className="typo-label flex min-h-11 items-center px-1 text-lime-300">לפי התרגילים</button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {MUSCLE_PARTS.map((part) => {
          const state = getPartState(selected, part)
          const hasSubs = part.subs.length > 0
          const expanded = openKey === part.key
          const n = countSelectedSubs(selected, part)
          return (
            <button
              key={part.key}
              type="button"
              disabled={disabled}
              aria-pressed={hasSubs ? undefined : state === 'all'}
              aria-expanded={hasSubs ? expanded : undefined}
              onClick={() => (hasSubs ? setOpenKey(expanded ? null : part.key) : onChange(toggleMusclePart(selected, part)))}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 ${expanded ? 'border-lime-500 bg-lime-500/20' : CHIP[state]}`}
            >
              <span className={`typo-label ${state === 'none' ? 'text-heading' : 'text-lime-300'}`}>{part.label}</span>
              {state === 'some' && <span className="typo-caption text-lime-300">{`${n}/${part.subs.length}`}</span>}
              {hasSubs && (expanded ? <ChevronUp size={16} className="text-lime-300" /> : <ChevronDown size={16} className={state === 'none' ? 'text-background-400' : 'text-lime-300'} />)}
            </button>
          )
        })}
      </div>
      {open && (
        <div className="mt-3 flex animate-[pageEnter_0.2s_ease] flex-col gap-3 rounded-2xl border border-white/10 bg-background-800 p-4">
          <span className="typo-label text-heading">{open.label}</span>
          <div className="flex flex-wrap gap-2">
            {[{ key: open.key, label: 'הכל', sel: selected.includes(open.key), act: () => onChange(toggleMusclePart(selected, open)) },
              ...open.subs.map((s) => ({ key: s.key, label: s.label, sel: isSubSelected(selected, open, s), act: () => onChange(toggleMuscleSub(selected, open, s)) }))].map((c) => (
              <button
                key={c.key}
                type="button"
                disabled={disabled}
                aria-pressed={c.sel}
                onClick={c.act}
                className={`typo-label flex min-h-11 items-center justify-center rounded-full border px-4 ${c.sel ? `${CHIP.all} text-lime-300` : `${CHIP.none} text-heading`}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="typo-caption mt-2 text-background-400">{caption}</p>
    </div>
  )
}

export type { Plan }
