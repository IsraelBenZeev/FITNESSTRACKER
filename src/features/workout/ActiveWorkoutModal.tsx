import { useState, useCallback } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { useLogWorkout } from './useWorkoutLog'
import type { WorkoutPlan } from '../../types/workout'

interface SetEntry {
  reps: string
  weight: string
}

interface ExerciseEntry {
  exercise_id: string
  exercise_name: string
  gif_url?: string
  sets: SetEntry[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  plan: WorkoutPlan | null
}

function todayDate() {
  return new Date().toISOString().split('T')[0]!
}

export function ActiveWorkoutModal({ isOpen, onClose, plan }: Props) {
  const { mutate: logWorkout, isPending } = useLogWorkout()

  const [entries, setEntries] = useState<ExerciseEntry[]>(() =>
    (plan?.exercises ?? []).map((ex) => ({
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise_name,
      gif_url: ex.gif_url,
      sets: Array.from({ length: ex.target_sets }, () => ({
        reps: ex.target_reps != null ? String(ex.target_reps) : '',
        weight: ex.target_weight_kg != null ? String(ex.target_weight_kg) : '',
      })),
    }))
  )
  const [notes, setNotes] = useState('')

  const resetAndClose = useCallback(() => {
    setNotes('')
    onClose()
  }, [onClose])

  // Re-init when plan changes
  const handleOpen = useCallback(() => {
    setEntries(
      (plan?.exercises ?? []).map((ex) => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        gif_url: ex.gif_url,
        sets: Array.from({ length: ex.target_sets }, () => ({
          reps: ex.target_reps != null ? String(ex.target_reps) : '',
          weight: ex.target_weight_kg != null ? String(ex.target_weight_kg) : '',
        })),
      }))
    )
    setNotes('')
  }, [plan])

  // Call handleOpen only when modal opens
  const [wasOpen, setWasOpen] = useState(false)
  if (isOpen && !wasOpen) {
    setWasOpen(true)
    handleOpen()
  }
  if (!isOpen && wasOpen) {
    setWasOpen(false)
  }

  function updateSet(exIdx: number, setIdx: number, field: 'reps' | 'weight', val: string) {
    setEntries((prev) => {
      const next = prev.map((e, i) =>
        i !== exIdx
          ? e
          : {
              ...e,
              sets: e.sets.map((s, j) =>
                j !== setIdx ? s : { ...s, [field]: val }
              ),
            }
      )
      return next
    })
  }

  function addSet(exIdx: number) {
    setEntries((prev) =>
      prev.map((e, i) =>
        i !== exIdx ? e : { ...e, sets: [...e.sets, { reps: '', weight: '' }] }
      )
    )
  }

  function removeSet(exIdx: number, setIdx: number) {
    setEntries((prev) =>
      prev.map((e, i) =>
        i !== exIdx ? e : { ...e, sets: e.sets.filter((_, j) => j !== setIdx) }
      )
    )
  }

  function handleFinish() {
    const sets: {
      exercise_id: string
      exercise_name: string
      set_number: number
      reps: number | null
      weight_kg: number | null
    }[] = []

    for (const ex of entries) {
      ex.sets.forEach((s, idx) => {
        sets.push({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          set_number: idx + 1,
          reps: s.reps ? Number(s.reps) : null,
          weight_kg: s.weight ? Number(s.weight) : null,
        })
      })
    }

    logWorkout(
      {
        date: todayDate(),
        workout_plan_id: plan?.id ?? null,
        notes,
        sets,
      },
      { onSuccess: resetAndClose }
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '72px',
    padding: '8px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#f0f0f0',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontSize: '16px',
    textAlign: 'center',
    outline: 'none',
  }

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={plan?.name ?? 'תיעוד אימון'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {entries.map((ex, exIdx) => (
          <div key={ex.exercise_id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingBottom: '6px',
              borderBottom: '1px solid #1a1a1a',
            }}>
              <span style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '17px',
                fontWeight: 600,
                color: '#D7FF00',
              }}>
                {ex.exercise_name}
              </span>
              {ex.gif_url && (
                <img
                  src={ex.gif_url}
                  alt={ex.exercise_name}
                  style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#111' }}
                />
              )}
            </div>

            {/* Column headers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <span style={{ width: '28px' }} />
              <span style={{ width: '72px', fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444', textAlign: 'center' }}>
                חזרות
              </span>
              <span style={{ width: '72px', fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444', textAlign: 'center' }}>
                ק"ג
              </span>
              <span style={{ width: '32px' }} />
            </div>

            {ex.sets.map((s, setIdx) => (
              <div key={setIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                <span style={{
                  width: '28px',
                  fontFamily: '"Rubik", sans-serif',
                  fontSize: '12px',
                  color: '#555',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  {setIdx + 1}
                </span>
                <input
                  type="number"
                  placeholder="12"
                  value={s.reps}
                  onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                  style={inputStyle}
                  inputMode="numeric"
                />
                <input
                  type="number"
                  placeholder="0"
                  value={s.weight}
                  onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                  style={inputStyle}
                  inputMode="decimal"
                />
                <button
                  onClick={() => removeSet(exIdx, setIdx)}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#333',
                    flexShrink: 0,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            ))}

            <button
              onClick={() => addSet(exIdx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                background: 'none',
                border: '1px dashed #2a2a2a',
                borderRadius: '8px',
                color: '#555',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '13px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Plus size={14} strokeWidth={2} />
              הוסף סט
            </button>
          </div>
        ))}

        {/* Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', textAlign: 'right' }}>
            הערות (אופציונלי)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="איך הרגשת..."
            rows={2}
            style={{
              width: '100%',
              padding: '10px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '10px',
              color: '#f0f0f0',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              textAlign: 'right',
              direction: 'rtl',
            }}
          />
        </div>

        <button
          onClick={handleFinish}
          disabled={isPending}
          style={{
            width: '100%',
            padding: '15px',
            background: '#D7FF00',
            border: 'none',
            borderRadius: '12px',
            color: '#0a0a0a',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Check size={18} strokeWidth={2.5} />
          {isPending ? 'שומר...' : 'סיים אימון'}
        </button>
      </div>
    </Modal>
  )
}
