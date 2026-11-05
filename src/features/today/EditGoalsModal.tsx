import { useState, useEffect } from 'react'
import { Dumbbell, Info, Moon } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { useGoals, type GoalsConfig } from '../../lib/useGoals'

interface EditGoalsModalProps {
  isOpen: boolean
  onClose: () => void
}

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

type DayType = 'training' | 'rest'

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')
const digitsOnly = (v: string, max: number) => {
  const d = v.replace(/[^\d]/g, '')
  return d === '' ? 0 : Math.min(max, Number(d))
}
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export function EditGoalsModal({ isOpen, onClose }: EditGoalsModalProps) {
  const { goalsConfig, setGoals, isTrainingDay } = useGoals()
  const [local, setLocal] = useState<GoalsConfig>(goalsConfig)
  const [editing, setEditing] = useState<DayType>('training')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLocal(goalsConfig)
    // Open on the kind of day today is: that's the goal the user was looking at
    setEditing(isTrainingDay ? 'training' : 'rest')
  }, [isOpen, goalsConfig, isTrainingDay])

  const toggleDay = (dow: number) =>
    setLocal((prev) => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(dow)
        ? prev.trainingDays.filter((d) => d !== dow)
        : [...prev.trainingDays, dow].sort(),
    }))

  const calKey = editing === 'training' ? 'trainingCalories' : 'restCalories'
  const proKey = editing === 'training' ? 'trainingProtein' : 'restProtein'

  const isDirty = JSON.stringify(local) !== JSON.stringify(goalsConfig)
  const invalid = local.trainingCalories < 500 || local.restCalories < 500 || local.trainingProtein < 1 || local.restProtein < 1

  const dayCalories = (dow: number) =>
    local.trainingDays.includes(dow) ? local.trainingCalories : local.restCalories
  const weekly = DAY_LABELS.reduce((sum, _, dow) => sum + dayCalories(dow), 0)
  const maxDay = Math.max(local.trainingCalories, local.restCalories, 1)
  const todayDow = new Date().getDay()

  const handleSave = async () => {
    if (!isDirty) return onClose()
    if (invalid) return
    setSaving(true)
    try {
      await setGoals(local)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving || (isDirty && invalid)}
      className={`flex h-[52px] w-full items-center justify-center rounded-2xl font-body text-base font-semibold transition-[background-color,color,transform] duration-200 active:scale-[0.98] disabled:opacity-50 ${focusRing}
        ${isDirty ? 'bg-accent text-bg shadow-[0_8px_24px_-10px_rgba(150,200,40,0.7)]' : 'bg-surface2 text-text-col'}`}
    >
      {saving ? 'שומר…' : isDirty ? 'שמור יעדים' : 'סגור'}
    </button>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="יעדים יומיים" footer={footer}>
      <div className="flex flex-col gap-6">
        {/* Two day profiles: pick one to edit */}
        <div role="radiogroup" aria-label="איזה יום לערוך" className="grid grid-cols-2 gap-2.5">
          <ProfileCard
            selected={editing === 'training'}
            onSelect={() => setEditing('training')}
            icon={<Dumbbell size={16} strokeWidth={2} />}
            label="יום אימון"
            calories={local.trainingCalories}
            protein={local.trainingProtein}
            isToday={local.trainingDays.includes(todayDow)}
          />
          <ProfileCard
            selected={editing === 'rest'}
            onSelect={() => setEditing('rest')}
            icon={<Moon size={16} strokeWidth={2} />}
            label="יום מנוחה"
            calories={local.restCalories}
            protein={local.restProtein}
            isToday={!local.trainingDays.includes(todayDow)}
          />
        </div>

        {/* Editor for the selected profile */}
        <section aria-label={editing === 'training' ? 'עריכת יום אימון' : 'עריכת יום מנוחה'} className="flex flex-col gap-4 rounded-3xl border border-border-col bg-bg p-4">
          <div className="flex flex-col items-center gap-1">
            <label htmlFor="goal-kcal" className="font-body text-sm text-muted">קלוריות ליום</label>
            <div className="flex items-baseline gap-2">
              <input
                id="goal-kcal"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={local[calKey] === 0 ? '' : String(local[calKey])}
                placeholder="0"
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setLocal((p) => ({ ...p, [calKey]: digitsOnly(e.target.value, 6000) }))}
                aria-invalid={local[calKey] < 500 || undefined}
                className="w-[5ch] bg-transparent text-center font-display text-[56px] font-bold leading-none tabular-nums text-heading caret-accent outline-none placeholder:text-subtle"
              />
              <span className="font-body text-base text-muted">קל'</span>
            </div>
            <span aria-hidden className="h-0.5 w-24 rounded-full bg-accent" />
            {local[calKey] > 0 && local[calKey] < 500 && (
              <p className="font-body text-xs text-danger">יעד של פחות מ-500 קלוריות לא נשמר</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-col bg-surface px-4 py-2">
            <label htmlFor="goal-protein" className="flex items-center gap-2 font-body text-sm text-muted">
              <span aria-hidden className="h-2 w-2 rounded-full bg-macro-protein" />
              חלבון ליום
            </label>
            <span className="flex items-baseline gap-1">
              <input
                id="goal-protein"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={local[proKey] === 0 ? '' : String(local[proKey])}
                placeholder="0"
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setLocal((p) => ({ ...p, [proKey]: digitsOnly(e.target.value, 400) }))}
                className="h-11 w-[4ch] bg-transparent text-center font-display text-[28px] font-semibold tabular-nums text-heading caret-accent outline-none placeholder:text-subtle"
              />
              <span className="font-body text-sm text-muted">g</span>
            </span>
          </div>
        </section>

        {/* The week, drawn: column height = that day's calorie goal. Tap to switch training/rest. */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 flex w-full items-baseline justify-between font-body text-sm">
            <span className="text-text-col">השבוע שלך</span>
            <span className="tabular-nums text-muted">
              {fmt(weekly)} קל' · ממוצע {fmt(weekly / 7)}
            </span>
          </legend>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_LABELS.map((label, dow) => {
              const training = local.trainingDays.includes(dow)
              const h = Math.round((dayCalories(dow) / maxDay) * 64)
              return (
                <button
                  key={dow}
                  type="button"
                  onClick={() => toggleDay(dow)}
                  aria-pressed={training}
                  aria-label={`${DAY_NAMES[dow]}: ${training ? 'יום אימון' : 'יום מנוחה'}, ${fmt(dayCalories(dow))} קלוריות. לחיצה מחליפה`}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl pb-1.5 pt-2 transition-colors duration-150 hover:bg-surface2 ${focusRing}`}
                >
                  <svg viewBox="0 0 20 64" width="20" height="64" aria-hidden className="overflow-visible">
                    <rect x="0" y="0" width="20" height="64" rx="6" className="fill-bg" />
                    <rect
                      x="0"
                      y={64 - h}
                      width="20"
                      height={h}
                      rx="6"
                      className={`transition-[y,height] duration-300 ease-out ${training ? 'fill-accent' : 'fill-subtle'}`}
                    />
                  </svg>
                  <span className={`font-body text-sm ${dow === todayDow ? 'font-semibold text-heading' : 'text-muted'}`}>{label}</span>
                  <span className={training ? 'text-accent' : 'text-subtle'} aria-hidden>
                    {training ? <Dumbbell size={12} strokeWidth={2.25} /> : <Moon size={12} strokeWidth={2.25} />}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <p className="flex items-start gap-2 rounded-2xl bg-bg p-3 font-body text-sm leading-relaxed text-muted">
          <Info size={16} strokeWidth={2} className="mt-0.5 flex-shrink-0 text-accent" />
          שינוי חל מהיום והלאה. ימים קודמים נשמרים עם היעד שהיה בתוקף בהם.
        </p>
      </div>
    </Modal>
  )
}

function ProfileCard({
  selected, onSelect, icon, label, calories, protein, isToday,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  label: string
  calories: number
  protein: number
  isToday: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-right transition-colors duration-150 ${focusRing}
        ${selected ? 'border-accent-line bg-accent-soft' : 'border-border-col bg-surface2 hover:border-subtle'}`}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className={`flex items-center gap-1.5 font-body text-sm ${selected ? 'font-medium text-accent' : 'text-text-col'}`}>
          {icon}
          {label}
        </span>
        {isToday && <span className="rounded-full bg-bg px-2 py-0.5 font-body text-[11px] text-muted">היום</span>}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="font-display text-[28px] font-bold leading-none tabular-nums text-heading">{fmt(calories)}</span>
        <span className="font-body text-xs text-muted">קל'</span>
      </span>
      <span className="font-body text-xs tabular-nums text-muted">
        חלבון <span className="text-text-col">{protein}g</span>
      </span>
    </button>
  )
}
