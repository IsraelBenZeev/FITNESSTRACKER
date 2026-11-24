import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useFieldArray, type Control } from 'react-hook-form'
import { Dumbbell, Gauge, Plus, Repeat, Scale, SlidersHorizontal, Timer, Trash2, TriangleRight, type LucideIcon } from 'lucide-react'
import type { Exercise, InputField } from '../types'
import { draftStore, useDraftStore } from '../draftStore'
import { DurationInput, PremiumCheck, RestTimer, StepInput } from '../ui/controls'

const FIELD_ICONS: Record<string, LucideIcon> = {
  reps: Repeat, weight: Dumbbell, added_weight: Scale, speed: Gauge, incline: TriangleRight, duration: Timer,
}
const FIELD_UNITS: Record<string, string> = { weight: 'ק״ג', added_weight: 'ק״ג', speed: 'קמ״ש', incline: '%' }
const EMPTY: (number | null)[] = []
/** Matches the collapse transition (duration-300) of a set being deleted */
const REMOVE_MS = 300

interface CardProps {
  item: Exercise
  isActive: boolean
  control: Control<any>
  defaultSets: Record<string, number>[]
  optionalFieldVisibility: Record<string, boolean>
  onOptionalFieldVisibilityChange: (fieldId: string, enabled: boolean) => void
  /** Rendered under the set list (the workout note sits on the last exercise) */
  footer?: ReactNode
}

/** session/active/Card.tsx — compact video (or image) on top, then the set list */
export const ExerciseCard = memo(function ExerciseCard({ footer, ...props }: CardProps) {
  const { item, isActive } = props
  const image = item.imageUrls?.[0]
  return (
    <div className="relative flex h-full flex-col bg-background-900 px-1 py-2">
      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        <div className="relative flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-background-850 px-3 py-2">
          <div className={`flex w-full items-center justify-center overflow-hidden rounded-xl ${item.videoUrl ? 'bg-black' : 'bg-white'}`}>
            {item.videoUrl && isActive ? (
              <video src={item.videoUrl} poster={image} autoPlay muted loop playsInline aria-label={item.name_he} className="h-[140px] w-full bg-black object-contain" />
            ) : image ? (
              <img src={image} alt={item.name_he} className="h-[140px] w-[140px] object-cover" />
            ) : (
              <span className="flex h-[140px] w-[140px] items-center justify-center text-lime-500"><Dumbbell size={60} /></span>
            )}
          </div>
          <div className="w-full pb-2">
            <SetList {...props} />
          </div>
          {footer && <div className="w-full pb-2">{footer}</div>}
        </div>
      </div>
    </div>
  )
})

const buildSetValues = (fields: InputField[], last?: Record<string, number>) =>
  Object.fromEntries(fields.filter((f) => !f.optional || last?.[f.key] != null).map((f) => [f.key, last?.[f.key] || 0]))

/** session/active/Failds.tsx — sets with ✓, rest timers between them, delete, and "add set" */
function SetList({ control, item, defaultSets, optionalFieldVisibility, onOptionalFieldVisibilityChange }: Omit<CardProps, 'footer'>) {
  const completedTimes = useDraftStore((s) => s.completedTimes[item.exerciseId] ?? EMPTY)
  const { fields, append, remove } = useFieldArray({ control, name: `exercises.${item.exerciseId}.sets` })
  const setPath = useCallback((i: number) => `exercises.${item.exerciseId}.sets.${i}`, [item.exerciseId])
  const loaded = useRef(false)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const scrollToNew = useRef(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (fields.length > 0) { loaded.current = true; return }
    const useHistory = !loaded.current && defaultSets.length > 0
    loaded.current = true
    const initial = useHistory ? defaultSets : [undefined]
    append(initial.map((v) => buildSetValues(item.input_fields, v)))
    initial.forEach((v, i) => {
      draftStore.addSetTime(item.exerciseId)
      item.input_fields.filter((f) => f.optional && v?.[f.key] != null).forEach((f) => onOptionalFieldVisibilityChange(`${setPath(i)}.${f.key}`, true))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A newly added set scrolls into view
  useEffect(() => {
    if (!scrollToNew.current) return
    scrollToNew.current = false
    const last = fields[fields.length - 1]
    const el = last && rowRefs.current.get(last.id)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center', inline: 'nearest' })
  }, [fields])

  /** A new set copies the set right before it; last workout's values are used only when no set is left */
  function addSet() {
    const i = fields.length
    const current = (control._formValues as { exercises?: Record<string, { sets?: Record<string, number>[] }> }).exercises?.[item.exerciseId]?.sets
    const prev = i > 0 ? current?.[i - 1] : undefined
    const history = prev ? undefined : defaultSets[0]
    const source: Record<string, number> = { ...(prev ?? history) }
    item.input_fields.filter((f) => f.optional).forEach((f) => {
      const enabled = prev ? !!optionalFieldVisibility[`${setPath(i - 1)}.${f.key}`] : history?.[f.key] != null
      if (!enabled) return
      source[f.key] = source[f.key] ?? 0
      onOptionalFieldVisibilityChange(`${setPath(i)}.${f.key}`, true)
    })
    scrollToNew.current = true
    append(buildSetValues(item.input_fields, source))
    draftStore.addSetTime(item.exerciseId)
  }

  function commitRemove(id: string) {
    const index = fields.findIndex((f) => f.id === id)
    if (index < 0) return
    item.input_fields.filter((f) => f.optional).forEach((f) => {
      for (let i = index; i < fields.length; i++) {
        const next = i + 1 < fields.length && !!optionalFieldVisibility[`${setPath(i + 1)}.${f.key}`]
        onOptionalFieldVisibilityChange(`${setPath(i)}.${f.key}`, next)
      }
    })
    remove(index)
    draftStore.removeSetTime(item.exerciseId, index)
  }
  const commitRef = useRef(commitRemove)
  commitRef.current = commitRemove

  /** Plays the collapse animation, then removes the set */
  function removeSet(id: string) {
    if (removingId) return
    setRemovingId(id)
    setTimeout(() => { commitRef.current(id); setRemovingId(null) }, REMOVE_MS)
  }

  return (
    <div className="flex w-full flex-col">
      {fields.map((field, index) => {
        const isLast = index === fields.length - 1
        const done = (completedTimes[index] ?? null) != null
        const removing = removingId === field.id
        return (
          <div
            key={field.id}
            ref={(el) => { if (el) rowRefs.current.set(field.id, el); else rowRefs.current.delete(field.id) }}
            className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-in motion-reduce:transition-none ${
              removing ? 'pointer-events-none -translate-x-8 grid-rows-[0fr] opacity-0' : 'animate-[pageEnter_0.3s_ease] grid-rows-[1fr]'
            }`}
          >
            <div className={`min-h-0 ${removing ? 'overflow-hidden' : ''}`}>
              <div className="pb-2">
                <div
                  className={`flex w-full flex-col gap-1.5 rounded-2xl border px-3 py-2 transition-colors duration-200 ${
                    removing
                      ? 'border-danger/50 bg-danger/10'
                      : done
                        ? 'border-lime-500/20 bg-background-800/80 opacity-70'
                        : isLast ? 'border-lime-500/30 bg-background-700' : 'border-white/5 bg-background-800/80 opacity-80'
                  }`}
                >
                  {/* RTL: ✓ on the right edge beside the set title, delete on the left */}
                  <div className="flex items-center gap-2">
                    <PremiumCheck checked={done} onPress={() => draftStore.setSetDone(item.exerciseId, index)} label={`סמן סט ${index + 1} כבוצע`} />
                    <span className="typo-caption-bold flex-1 text-heading">סט {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeSet(field.id)}
                      aria-label={`מחק סט ${index + 1}`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger transition-transform active:scale-90"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <DynamicSetFields
                    control={control}
                    basePath={setPath(index)}
                    fields={item.input_fields}
                    optionalFieldVisibility={optionalFieldVisibility}
                    onOptionalFieldVisibilityChange={onOptionalFieldVisibilityChange}
                  />
                </div>
                {completedTimes[index] != null && !isLast && (
                  <RestTimer startTime={completedTimes[index] as number} endTime={completedTimes[index + 1] ?? null} />
                )}
              </div>
            </div>
          </div>
        )
      })}
      <button
        type="button"
        onClick={addSet}
        className="typo-body-primary flex items-center justify-center gap-2 rounded-2xl border border-dashed border-lime-500/45 bg-lime-500/5 py-2.5 text-lime-300 transition-transform active:scale-[0.98]"
      >
        <Plus size={16} /> הוסף סט
      </button>
    </div>
  )
}

/** session/active/DynamicSetFields.tsx — inputs by the exercise's input_fields; optional ones behind a chip */
function DynamicSetFields({
  control, basePath, fields, optionalFieldVisibility, onOptionalFieldVisibilityChange,
}: {
  control: Control<any>
  basePath: string
  fields: InputField[]
  optionalFieldVisibility: Record<string, boolean>
  onOptionalFieldVisibilityChange: (fieldId: string, enabled: boolean) => void
}) {
  const required = fields.filter((f) => !f.optional)
  const optional = fields.filter((f) => f.optional)
  const visible = [...required, ...optional.filter((f) => optionalFieldVisibility[`${basePath}.${f.key}`] ?? false)].reverse()
  const keys = new Set(required.map((f) => f.key))
  const cardio = ['duration', 'speed', 'incline'].every((k) => keys.has(k))

  return (
    <div className="flex w-full flex-col gap-2">
      {optional.map((f) => {
        const path = `${basePath}.${f.key}`
        const on = optionalFieldVisibility[path] ?? false
        return (
          <button
            key={f.key}
            type="button"
            aria-pressed={on}
            onClick={() => { onOptionalFieldVisibilityChange(path, !on); if (on) control.unregister(path) }}
            className={`typo-label self-center rounded-full border px-3 py-1 transition-colors ${on ? 'border-lime-500/60 bg-lime-500/20 text-lime-300' : 'border-white/10 bg-background-800 text-zinc-400'}`}
          >
            הוסף {f.label}
          </button>
        )
      })}
      {visible.length > 0 && (
        <div className={`flex w-full flex-wrap items-start justify-center ${cardio ? 'gap-x-2 gap-y-5' : 'gap-2'}`}>
          {visible.map((f) => (
            <div key={f.key} className={cardio && f.type === 'duration' ? 'flex w-full justify-center' : 'flex min-w-[120px] flex-1 justify-center'}>
              {f.type === 'duration' ? (
                <DurationInput control={control} name={`${basePath}.${f.key}`} label={f.label} icon={FIELD_ICONS[f.key] ?? SlidersHorizontal} />
              ) : (
                <StepInput control={control} name={`${basePath}.${f.key}`} label={f.label} unit={FIELD_UNITS[f.key]} icon={FIELD_ICONS[f.key] ?? SlidersHorizontal} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
