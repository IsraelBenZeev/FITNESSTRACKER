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

export function AddBodyStatModal({ isOpen, onClose, editStat }: AddBodyStatModalProps) {
  const { latest } = useBodyStats()
  const { mutate, isPending } = useAddBodyStat()

  const isEditMode = editStat != null

  const [weightKg, setWeightKg] = useState(latest?.weight_kg ?? 70)
  const [waistCm, setWaistCm] = useState(latest?.waist_cm ?? 88)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setWeightKg(editStat.weight_kg ?? latest?.weight_kg ?? 70)
        setWaistCm(editStat.waist_cm ?? latest?.waist_cm ?? 88)
        setNotes(editStat.notes ?? '')
      } else {
        setWeightKg(latest?.weight_kg ?? 70)
        setWaistCm(latest?.waist_cm ?? 88)
        setNotes('')
      }
    }
  }, [isOpen, isEditMode, editStat, latest])

  const handleSave = () => {
    mutate(
      {
        id: isEditMode ? editStat.id : undefined,
        weight_kg: weightKg,
        waist_cm: waistCm,
        notes,
      },
      { onSuccess: onClose }
    )
  }

  const title = isEditMode ? 'ערוך מדידה' : 'הוסף מדידה'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Stepper
          label='משקל'
          value={weightKg}
          onChange={setWeightKg}
          min={30}
          max={200}
          step={0.1}
          unit='ק"ג'
          decimals={1}
        />
        <Stepper
          label='היקף בטן'
          value={waistCm}
          onChange={setWaistCm}
          min={40}
          max={200}
          step={0.5}
          unit='ס"מ'
          decimals={1}
        />

        {/* Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#666', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            הערות (אופציונלי)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות על המדידה..."
            rows={2}
            style={{
              width: '100%',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#f0f0f0',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '14px',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          style={{
            marginTop: '4px',
            width: '100%',
            padding: '14px',
            background: isPending ? '#1a1a1a' : '#D7FF00',
            color: isPending ? '#333' : '#0a0a0a',
            border: 'none',
            borderRadius: '12px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {isPending ? 'שומר...' : isEditMode ? 'עדכן מדידה' : 'שמור מדידה'}
        </button>
      </div>
    </Modal>
  )
}
