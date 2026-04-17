import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronLeft } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { ExercisePickerSheet } from './ExercisePickerSheet'
import { useAddPlan } from './useAddPlan'
import { useUpdatePlan } from './useUpdatePlan'
import type { WorkoutPlan, WorkoutPlanExercise, Exercise } from '../../types/workout'

interface PlanExerciseRow {
  exercise_id: string
  exercise_name: string
  gif_url?: string
  order_index: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  initialPlan?: WorkoutPlan
}

const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const DIFFICULTIES: WorkoutPlan['difficulty'][] = ['קל', 'בינוני', 'קשה']
const DRAFT_KEY = 'ft_plan_draft'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '10px',
  color: '#f0f0f0',
  fontFamily: '"Rubik", sans-serif',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  textAlign: 'right',
  direction: 'rtl',
}

export function CreatePlanModal({ isOpen, onClose, initialPlan }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<WorkoutPlan['difficulty']>(null)
  const [trainingDays, setTrainingDays] = useState<number[]>([])
  const [exercises, setExercises] = useState<PlanExerciseRow[]>([])
  const [step, setStep] = useState<'details' | 'exercises'>('details')
  const [pickerOpen, setPickerOpen] = useState(false)

  const { mutate: addPlan, isPending: isAdding } = useAddPlan()
  const { mutate: updatePlan, isPending: isUpdating } = useUpdatePlan()
  const isPending = isAdding || isUpdating

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setDescription('')
      setDifficulty(null)
      setTrainingDays([])
      setExercises([])
      setStep('details')
      setPickerOpen(false)
      return
    }
    if (initialPlan) {
      // מצב עריכה — טען מהתכנית הקיימת
      setName(initialPlan.name)
      setDescription(initialPlan.description ?? '')
      setDifficulty(initialPlan.difficulty)
      setTrainingDays(initialPlan.training_days)
      setExercises(
        (initialPlan.exercises ?? []).map((ex: WorkoutPlanExercise) => ({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          gif_url: ex.gif_url,
          order_index: ex.order_index,
        }))
      )
      setStep('details')
      return
    }
    // מצב יצירה — שחזור טיוטה אם קיימת
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (d.name || d.exercises?.length > 0) {
          setName(d.name ?? '')
          setDescription(d.description ?? '')
          setDifficulty(d.difficulty ?? null)
          setTrainingDays(d.trainingDays ?? [])
          setExercises(d.exercises ?? [])
          setStep(d.step ?? 'details')
        }
      }
    } catch {}
  }, [isOpen, initialPlan])

  // שמירת טיוטה ב-localStorage (רק במצב יצירה)
  useEffect(() => {
    if (!isOpen || initialPlan) return
    const draft = { name, description, difficulty, trainingDays, exercises, step }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [name, description, difficulty, trainingDays, exercises, step, isOpen, initialPlan])

  function toggleDay(d: number) {
    setTrainingDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  const addExercise = useCallback((ex: Exercise) => {
    setExercises((prev) => {
      if (prev.some((e) => e.exercise_id === ex.exerciseId)) return prev
      return [
        ...prev,
        {
          exercise_id: ex.exerciseId,
          exercise_name: ex.name_he,
          gif_url: ex.gifUrl,
          order_index: prev.length,
        },
      ]
    })
  }, [])

  function removeExercise(id: string) {
    setExercises((prev) =>
      prev
        .filter((e) => e.exercise_id !== id)
        .map((e, i) => ({ ...e, order_index: i }))
    )
  }

const exercisesPayload = exercises.map(
    ({ exercise_id, exercise_name, gif_url, order_index }) => ({
      exercise_id, exercise_name, gif_url, order_index,
    })
  )

  function handleSave() {
    if (!name.trim()) return
    if (initialPlan) {
      updatePlan(
        { planId: initialPlan.id, name: name.trim(), description: description.trim(), difficulty, training_days: trainingDays, exercises: exercisesPayload },
        { onSuccess: onClose }
      )
    } else {
      addPlan(
        { name: name.trim(), description: description.trim(), difficulty, training_days: trainingDays, exercises: exercisesPayload },
        { onSuccess: () => { localStorage.removeItem(DRAFT_KEY); onClose() } }
      )
    }
  }

  function handleClose() {
    if (!initialPlan) localStorage.removeItem(DRAFT_KEY)
    onClose()
  }

  const canSave = name.trim().length > 0

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={initialPlan ? 'עריכת תכנית' : 'תכנית אימון חדשה'}>
        {/* Step tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['details', 'exercises'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              style={{
                flex: 1,
                padding: '10px',
                background: step === s ? 'rgba(215,255,0,0.1)' : '#1a1a1a',
                border: step === s ? '1px solid rgba(215,255,0,0.3)' : '1px solid #222',
                borderRadius: '10px',
                color: step === s ? '#D7FF00' : '#555',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '13px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {s === 'details' ? 'פרטים' : `תרגילים (${exercises.length})`}
            </button>
          ))}
        </div>

        {/* ── DETAILS STEP ── */}
        {step === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', textAlign: 'right' }}>
                שם האימון *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='למשל: A — דחיפה'
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', textAlign: 'right' }}>
                תיאור (אופציונלי)
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="פירוט קצר על האימון"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', textAlign: 'right' }}>
                רמת קושי
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(difficulty === d ? null : d)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      background: difficulty === d ? 'rgba(215,255,0,0.1)' : '#1a1a1a',
                      border: difficulty === d ? '1px solid rgba(215,255,0,0.35)' : '1px solid #222',
                      borderRadius: '10px',
                      color: difficulty === d ? '#D7FF00' : '#666',
                      fontFamily: '"Rubik", sans-serif',
                      fontSize: '13px',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', textAlign: 'right' }}>
                ימי אימון
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {DAYS.map((label, idx) => {
                  const active = trainingDays.includes(idx)
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleDay(idx)}
                      style={{
                        flex: 1,
                        padding: '10px 4px',
                        background: active ? 'rgba(215,255,0,0.1)' : '#1a1a1a',
                        border: active ? '1px solid rgba(215,255,0,0.35)' : '1px solid #222',
                        borderRadius: '8px',
                        color: active ? '#D7FF00' : '#555',
                        fontFamily: '"Rubik", sans-serif',
                        fontSize: '12px',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSave}
                disabled={isPending || !canSave}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: canSave ? '#1a1a1a' : '#111',
                  border: canSave ? '1px solid #2a2a2a' : '1px solid #1a1a1a',
                  borderRadius: '12px',
                  color: canSave ? '#888' : '#333',
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: canSave && !isPending ? 'pointer' : 'not-allowed',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {isPending ? 'שומר...' : 'שמור'}
              </button>
              <button
                onClick={() => { setStep('exercises'); setPickerOpen(true) }}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: '#D7FF00',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#0a0a0a',
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={17} strokeWidth={2.5} color="#0a0a0a" />
                {exercises.length > 0 ? `תרגילים (${exercises.length})` : 'הוסף תרגילים'}
              </button>
            </div>
          </div>
        )}

        {/* ── EXERCISES STEP ── */}
        {step === 'exercises' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {/* Summary card */}
            <div
              style={{
                padding: '16px',
                background: exercises.length > 0 ? 'rgba(215,255,0,0.05)' : '#1a1a1a',
                border: exercises.length > 0 ? '1px solid rgba(215,255,0,0.15)' : '1px solid #222',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '32px', fontWeight: 700, color: exercises.length > 0 ? '#D7FF00' : '#333' }}>
                {exercises.length}
              </span>
              <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#555', display: 'block', marginTop: '2px' }}>
                תרגילים נבחרו
              </span>
            </div>

            <button
              onClick={() => setPickerOpen(true)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                color: '#D7FF00',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Plus size={17} strokeWidth={2.5} />
              {exercises.length > 0 ? 'ערוך תרגילים' : 'בחר תרגילים'}
            </button>

            <button
              onClick={() => setStep('details')}
              style={{
                width: '100%',
                padding: '10px',
                background: 'none',
                border: 'none',
                color: '#555',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '13px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <ChevronLeft size={14} strokeWidth={2} />
              חזור לפרטים
            </button>

            <div style={{ flex: 1 }} />

            <button
              onClick={handleSave}
              disabled={isPending || !canSave}
              style={{
                width: '100%',
                padding: '14px',
                background: canSave ? '#D7FF00' : '#1a1a1a',
                border: 'none',
                borderRadius: '12px',
                color: canSave ? '#0a0a0a' : '#333',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '17px',
                fontWeight: 700,
                cursor: canSave && !isPending ? 'pointer' : 'not-allowed',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {isPending ? 'שומר...' : 'שמור תכנית'}
            </button>
          </div>
        )}
      </Modal>

      <ExercisePickerSheet
        isOpen={pickerOpen}
        selectedExercises={exercises}
        onAdd={addExercise}
        onRemove={removeExercise}
        onDone={() => setPickerOpen(false)}
      />
    </>
  )
}
