import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { Stepper } from '../../shared/components/Stepper'
import { splitMacros, useSaveGoal } from '../history/useGoalHistory'
import type { GoalPeriod } from '../history/useGoalHistory'
import { shortDate } from '../history/calendarUtils'
import { todayLocal } from '../../lib/date'

interface GoalEditSheetProps {
  isOpen: boolean
  onClose: () => void
  current: GoalPeriod | null
  /** Latest weigh-in, stored on the goal row like the app does */
  weight: number | null
}

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

/** Edit the daily goal. Saved as a manual goal from today; a second save today overwrites today's row. */
export function GoalEditSheet({ isOpen, onClose, current, weight }: GoalEditSheetProps) {
  const [calories, setCalories] = useState(current?.calories ?? 2000)
  const [protein, setProtein] = useState(current?.protein ?? 120)
  const save = useSaveGoal()

  useEffect(() => {
    if (!isOpen) return
    setCalories(current?.calories ?? 2000)
    setProtein(current?.protein ?? 120)
  }, [isOpen, current])

  const { carbs, fat } = splitMacros(calories, protein)
  const today = todayLocal()
  const overwritesToday = current?.from === today
  const unchanged = current != null && current.calories === calories && current.protein === protein

  const footer = (
    <button
      type="button"
      onClick={() => save.mutate({ calories, protein, weight, previous: current }, { onSuccess: onClose })}
      disabled={save.isPending || unchanged}
      className="flex h-12 w-full items-center justify-center rounded-2xl border border-accent font-body text-base font-semibold text-accent transition-[background-color,opacity] duration-150 hover:bg-accent-soft active:bg-accent-soft disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {save.isPending ? 'שומר…' : unchanged ? 'אין שינוי' : 'שמירת היעד'}
    </button>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="עריכת היעד היומי" footer={footer}>
      <div className="flex flex-col gap-6">
        <Stepper label="קלוריות ביום" value={calories} onChange={setCalories} min={1000} max={6000} step={50} stepOptions={[10, 50, 100]} unit="קל'" />
        <Stepper label="חלבון ביום" value={protein} onChange={setProtein} min={30} max={350} step={1} stepOptions={[1, 5, 10]} unit="גרם" tone="protein" />

        <section aria-label="חלוקת המאקרו" className="flex flex-col gap-2 rounded-2xl bg-bg px-4 py-3">
          <span className="font-body text-sm font-medium text-text-col">פחמימה ושומן מחושבים אוטומטית</span>
          <span className="flex gap-5 font-body text-sm tabular-nums">
            <span className="text-macro-carbs">פחמימה {fmt(carbs)}g</span>
            <span className="text-macro-fat">שומן {fmt(fat)}g</span>
          </span>
          <span className="font-body text-xs text-muted">שומן 25% מהקלוריות, פחמימה מהיתרה — כמו באפליקציה</span>
        </section>

        <p className="flex items-start gap-2 rounded-2xl border border-macro-carbs/25 bg-macro-carbs/10 px-3.5 py-3 font-body text-sm leading-relaxed text-macro-carbs">
          <Info size={17} strokeWidth={2} className="mt-0.5 flex-shrink-0" aria-hidden />
          {overwritesToday
            ? `כבר עדכנת יעד היום (${shortDate(today)}) — השמירה תחליף אותו. היעדים של הימים הקודמים לא משתנים.`
            : `היעד יישמר כיעד ידני החל מהיום (${shortDate(today)}). היעדים של הימים הקודמים לא משתנים, וגם האפליקציה תציג אותו.`}
        </p>
      </div>
    </Modal>
  )
}
