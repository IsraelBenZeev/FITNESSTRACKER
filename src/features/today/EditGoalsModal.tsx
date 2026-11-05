import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { NumberField } from '../../shared/components/NumberField'
import { useGoals, type GoalsConfig } from '../../lib/useGoals'

interface EditGoalsModalProps {
  isOpen: boolean
  onClose: () => void
}

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

type DayType = 'training' | 'rest'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export function EditGoalsModal({ isOpen, onClose }: EditGoalsModalProps) {
  const { goalsConfig, setGoals, isTrainingDay } = useGoals()
  const [local, setLocal] = useState<GoalsConfig>(goalsConfig)
  const [dayType, setDayType] = useState<DayType>('training')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLocal(goalsConfig)
    // Open on the kind of day today is: that's the goal the user is looking at
    setDayType(isTrainingDay ? 'training' : 'rest')
  }, [isOpen, goalsConfig, isTrainingDay])

  const toggleDay = (dow: number) =>
    setLocal((prev) => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(dow)
        ? prev.trainingDays.filter((d) => d !== dow)
        : [...prev.trainingDays, dow].sort(),
    }))

  const isDirty = JSON.stringify(local) !== JSON.stringify(goalsConfig)

  const handleSave = async () => {
    if (!isDirty) return onClose()
    setSaving(true)
    try {
      await setGoals(local)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const calKey = dayType === 'training' ? 'trainingCalories' : 'restCalories'
  const proKey = dayType === 'training' ? 'trainingProtein' : 'restProtein'

  const footer = (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className={`flex h-[52px] w-full items-center justify-center rounded-2xl font-body text-base font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-60 ${focusRing}
        ${isDirty ? 'bg-accent text-bg' : 'bg-surface2 text-text-col'}`}
    >
      {saving ? 'שומר…' : isDirty ? 'שמור יעדים' : 'סגור'}
    </button>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="יעדים יומיים" footer={footer}>
      <div className="flex flex-col gap-6">
        {/* Day type: segmented control */}
        <div role="tablist" aria-label="סוג יום" className="grid grid-cols-2 gap-1 rounded-2xl bg-bg p-1">
          {([['training', 'יום אימון'], ['rest', 'יום מנוחה']] as const).map(([value, label]) => {
            const selected = dayType === value
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setDayType(value)}
                className={`h-11 rounded-xl font-body text-sm transition-colors duration-150 ${focusRing}
                  ${selected ? 'bg-surface2 font-medium text-heading shadow-[0_1px_2px_rgba(0,0,0,0.3)]' : 'text-muted hover:text-text-col'}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <NumberField
          label={dayType === 'training' ? 'קלוריות ביום אימון' : 'קלוריות ביום מנוחה'}
          value={local[calKey]}
          onChange={(v) => setLocal((p) => ({ ...p, [calKey]: v }))}
          unit="קל'"
          step={50}
          min={500}
          max={6000}
          emphasis
        />
        <NumberField
          label={dayType === 'training' ? 'חלבון ביום אימון' : 'חלבון ביום מנוחה'}
          value={local[proKey]}
          onChange={(v) => setLocal((p) => ({ ...p, [proKey]: v }))}
          unit="g"
          step={5}
          min={20}
          max={400}
        />

        {/* Training days */}
        <fieldset className="flex flex-col">
          <legend className="mb-2 font-body text-sm text-muted">ימי אימון</legend>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_LABELS.map((label, dow) => {
              const active = local.trainingDays.includes(dow)
              return (
                <button
                  key={dow}
                  type="button"
                  onClick={() => toggleDay(dow)}
                  aria-pressed={active}
                  aria-label={`${DAY_NAMES[dow]}${active ? ', יום אימון' : ', יום מנוחה'}`}
                  className={`h-11 rounded-xl border font-body text-base transition-colors duration-150 ${focusRing}
                    ${active ? 'border-accent-line bg-accent-soft font-medium text-accent' : 'border-border-col bg-surface2 text-muted hover:text-text-col'}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 font-body text-xs text-muted">
            {local.trainingDays.length === 7
              ? 'כל הימים מוגדרים כימי אימון'
              : local.trainingDays.length === 0
                ? 'כל הימים מוגדרים כימי מנוחה'
                : `${local.trainingDays.length} ימי אימון בשבוע`}
          </p>
        </fieldset>

        <p className="flex items-start gap-2 rounded-2xl bg-bg p-3 font-body text-sm leading-relaxed text-muted">
          <Info size={16} strokeWidth={2} className="mt-0.5 flex-shrink-0 text-accent" />
          שינוי היעדים חל מהיום והלאה. ימים קודמים נשמרים עם היעד שהיה בתוקף בהם, כך שההיסטוריה לא משתנה.
        </p>
      </div>
    </Modal>
  )
}
