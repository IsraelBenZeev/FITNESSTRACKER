import { useState, useEffect } from 'react'
import { Modal } from '../../shared/components/Modal'
import { Stepper } from '../../shared/components/Stepper'
import { useAddBodyStat } from './useAddBodyStat'
import { useBodyStats } from './useBodyStats'
import type { BodyStat } from '../../types/body'

interface AddBodyStatModalProps {
  isOpen: boolean
  onClose: () => void
  editStat?: BodyStat | null
}

function dayTitle(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function AddBodyStatModal({ isOpen, onClose, editStat }: AddBodyStatModalProps) {
  const { latest } = useBodyStats()
  const { mutate, isPending } = useAddBodyStat()
  const isEditMode = editStat != null

  const [weightKg, setWeightKg] = useState(latest?.weight_kg ?? 60)
  const [waistCm, setWaistCm] = useState(latest?.waist_cm ?? 75)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (isEditMode) {
      setWeightKg(editStat.weight_kg ?? latest?.weight_kg ?? 60)
      setWaistCm(editStat.waist_cm ?? latest?.waist_cm ?? 75)
      setNotes(editStat.notes ?? '')
    } else {
      setWeightKg(latest?.weight_kg ?? 60)
      setWaistCm(latest?.waist_cm ?? 75)
      setNotes('')
    }
  }, [isOpen, isEditMode, editStat, latest])

  const handleSave = () => {
    mutate({ id: isEditMode ? editStat.id : undefined, weight_kg: weightKg, waist_cm: waistCm, notes }, { onSuccess: onClose })
  }

  const footer = (
    <button
      type="button"
      onClick={handleSave}
      disabled={isPending}
      className="flex h-12 w-full items-center justify-center rounded-2xl border border-accent font-body text-base font-semibold text-accent transition-[background-color,opacity] duration-150 hover:bg-accent-soft active:bg-accent-soft disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {isPending ? 'שומר…' : isEditMode ? 'שמירת השינויים' : 'שמירת השקילה'}
    </button>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? `שקילה · ${dayTitle(editStat.date)}` : 'שקילה להיום'} footer={footer}>
      <div className="flex flex-col gap-6">
        <Stepper label="משקל" value={weightKg} onChange={setWeightKg} min={30} max={200} step={0.1} stepOptions={[0.1, 0.5, 1, 5]} unit='ק"ג' decimals={1} />
        <Stepper label="היקף בטן" value={waistCm} onChange={setWaistCm} min={40} max={200} step={0.5} stepOptions={[0.5, 1, 5]} unit='ס"מ' decimals={1} />

        <label className="flex flex-col gap-2">
          <span className="font-body text-sm text-muted">הערה (לא חובה)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="למשל: אחרי אימון, בבוקר על בטן ריקה"
            rows={2}
            className="w-full resize-none rounded-2xl border border-border-col bg-bg px-4 py-3 font-body text-base text-text-col transition-colors duration-150 placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>
      </div>
    </Modal>
  )
}
