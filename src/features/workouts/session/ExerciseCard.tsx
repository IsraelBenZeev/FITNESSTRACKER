import { memo, useCallback, useEffect, useRef } from 'react'
import { useFieldArray, type Control } from 'react-hook-form'
import { Dumbbell, Gauge, Plus, Repeat, Scale, SlidersHorizontal, Timer, TriangleRight, type LucideIcon } from 'lucide-react'
import type { Exercise, InputField } from '../types'
import { draftStore, useDraftStore } from '../draftStore'
import { DurationInput, PremiumCheck, RestTimer, StepInput } from '../ui/controls'

const FIELD_ICONS: Record<string, LucideIcon> = {
  reps: Repeat, weight: Dumbbell, added_weight: Scale, speed: Gauge, incline: TriangleRight, duration: Timer,
}
const FIELD_UNITS: Record<string, string> = { weight: 'ק״ג', added_weight: 'ק״ג', speed: 'קמ״ש', incline: '%' }
const EMPTY: (number | null)[] = []

interface CardProps {
  item: Exercise
  isActive: boolean
  control: Control<any>
  defaultSets: Record<string, number>[]
  optionalFieldVisibility: Record<string, boolean>
  onOptionalFieldVisibilityChange: (fieldId: string, enabled: boolean) => void
}

/** session/active/Card.tsx — video (or image) on top, then the set list */
export const ExerciseCard = memo(function ExerciseCard(props: CardProps) {
  const { item, isActive } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100)
  }, [])
  const image = item.imageUrls?.[0]
  return (
    <div className="relative flex h-full flex-col bg-background-900 p-2">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pb-20">
        <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-background-850 px-4 py-2">
          <div className={`flex w-full items-center justify-center overflow-hidden rounded-2xl ${item.videoUrl ? 'bg-black' : 'bg-white'}`}>
            {item.videoUrl && isActive ? (
              <video src={item.videoUrl} poster={image} autoPlay muted loop playsInline aria-label={item.name_he} className="h-[200px] w-full bg-black object-contain" />
            ) : image ? (
              <img src={image} alt={item.name_he} className="h-[200px] w-[200px] object-cover" />
            ) : (
              <span className="flex h-[200px] w-[200px] items-center justify-center text-lime-500"><Dumbbell size={80} /></span>
            )}
          </div>
          <div className="w-full pb-3">
            <SetList {...props} onScrollBottom={scrollToBottom} />
          </div>
        </div>
      </div>
    </div>
  )
})

const buildSetValues = (fields: InputField[], last?: Record<string, number>) =>
  Object.fromEntries(fields.filter((f) => !f.optional || last?.[f.key] != null).map((f) => [f.key, last?.[f.key] || 0]))

/** session/active/Failds.tsx — sets with ✓, rest timers between them, delete, and "add set" */
function SetList({
  control, item, defaultSets, optionalFieldVisibility, onOptionalFieldVisibilityChange, onScrollBottom,
}: CardProps & { onScrollBottom: () => void }) {
  const completedTimes = useDraftStore((s) => s.completedTimes[item.exerciseId] ?? EMPTY)
  const { fields, append, remove } = useFieldArray({ control, name: `exercises.${item.exerciseId}.sets` })
  const setPath = useCallback((i: number) => `exercises.${item.exerciseId}.sets.${i}`, [item.exerciseId])
  const loaded = useRef(false)

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

  function addSet() {
    const i = fields.length
    const current = (control._formValues as { exercises?: Record<string, { sets?: Record<string, number>[] }> }).exercises?.[item.exerciseId]?.sets
    const history = defaultSets[i]
    const source: Record<string, number> = { ...(history || current?.[i - 1]) }
    item.input_fields.filter((f) => f.optional).forEach((f) => {
      const enabled = history ? history[f.key] != null : !!optionalFieldVisibility[`${setPath(i - 1)}.${f.key}`]
      if (!enabled) return
      source[f.key] = source[f.key] ?? 0
      onOptionalFieldVisibilityChange(`${setPath(i)}.${f.key}`, true)
    })
    append(buildSetValues(item.input_fields, source))
    draftStore.addSetTime(item.exerciseId)
    onScrollBottom()
  }

  function removeSet(index: number) {
    item.input_fields.filter((f) => f.optional).forEach((f) => {
      for (let i = index; i < fields.length; i++) {
        const next = i + 1 < fields.length && !!optionalFieldVisibility[`${setPath(i + 1)}.${f.key}`]
        onOptionalFieldVisibilityChange(`${setPath(i)}.${f.key}`, next)
      }
    })
    remove(index)
    draftStore.removeSetTime(item.exerciseId, index)
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {fields.map((field, index) => {
        const isLast = index === fields.length - 1
        const done = (completedTimes[index] ?? null) != null
        return (
          <div key={field.id} className="animate-[pageEnter_0.3s_ease]">
            <div
              className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 ${
                done ? 'border-lime-500/20 bg-background-800/80 opacity-70' : isLast ? 'border-lime-500/30 bg-background-700' : 'border-white/5 bg-background-800/80 opacity-80'
              }`}
            >
              <div className="flex items-center justify-end gap-3">
                <span className="typo-caption-bold text-heading">סט {index + 1}</span>
                <PremiumCheck checked={done} onPress={() => draftStore.setSetDone(item.exerciseId, index)} label={`סמן סט ${index + 1} כבוצע`} />
              </div>
              <div className="flex flex-col gap-3">
                <DynamicSetFields
                  control={control}
                  basePath={setPath(index)}
                  fields={item.input_fields}
                  optionalFieldVisibility={optionalFieldVisibility}
                  onOptionalFieldVisibilityChange={onOptionalFieldVisibilityChange}
                />
                <button
                  type="button"
                  onClick={() => removeSet(index)}
                  className="typo-body-primary flex w-full items-center justify-center rounded-2xl bg-danger/10 px-2 py-1 text-danger transition-transform active:scale-[0.98]"
                >
                  מחק
                </button>
              </div>
            </div>
            {completedTimes[index] != null && !isLast && (
              <RestTimer startTime={completedTimes[index] as number} endTime={completedTimes[index + 1] ?? null} />
            )}
          </div>
        )
      })}
      <button
        type="button"
        onClick={addSet}
        className="typo-body-primary flex items-center justify-center gap-2 rounded-2xl border border-dashed border-lime-500/45 bg-lime-500/5 py-3 text-lime-300 transition-transform active:scale-[0.98]"
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
    <div className="flex w-full flex-col gap-4">
      {optional.map((f) => {
        const path = `${basePath}.${f.key}`
        const on = optionalFieldVisibility[path] ?? false
        return (
          <button
            key={f.key}
            type="button"
            aria-pressed={on}
            onClick={() => { onOptionalFieldVisibilityChange(path, !on); if (on) control.unregister(path) }}
            className={`typo-label self-center rounded-full border px-4 py-2 transition-colors ${on ? 'border-lime-500/60 bg-lime-500/20 text-lime-300' : 'border-white/10 bg-background-800 text-zinc-400'}`}
          >
            הוסף {f.label}
          </button>
        )
      })}
      {visible.length > 0 && (
        <div className={`flex w-full flex-wrap items-start justify-center ${cardio ? 'gap-x-2 gap-y-5' : 'gap-2'}`}>
          {visible.map((f) => (
            <div key={f.key} className={cardio && f.type === 'duration' ? 'flex w-full justify-center' : 'flex min-w-[140px] flex-1 justify-center'}>
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
