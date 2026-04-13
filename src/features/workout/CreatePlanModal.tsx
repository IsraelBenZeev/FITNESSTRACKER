import { useState, useEffect } from 'react'
import { Search, Plus, X, GripVertical } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { useExercises } from './useExercises'
import { useAddPlan } from './useAddPlan'
import type { WorkoutPlan } from '../../types/workout'

interface PlanExerciseRow {
  exercise_id: string
  exercise_name: string
  order_index: number
  target_sets: number
  target_reps: number | null
  target_weight_kg: number | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const DIFFICULTIES: WorkoutPlan['difficulty'][] = ['קל', 'בינוני', 'קשה']

const BODY_PARTS_FILTER = [
  'הכל', 'חזה', 'גב', 'כתפיים', 'רגליים', 'ידיים', 'בטן', 'קרדיו',
]

const BODY_PARTS_MAP: Record<string, string> = {
  chest: 'חזה', back: 'גב', shoulders: 'כתפיים', legs: 'רגליים',
  arms: 'ידיים', waist: 'בטן', cardio: 'קרדיו', neck: 'צוואר',
  'upper arms': 'ידיים', 'lower arms': 'אמות', 'upper legs': 'ירכיים',
  'lower legs': 'שוקיים',
}

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

export function CreatePlanModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<WorkoutPlan['difficulty']>(null)
  const [trainingDays, setTrainingDays] = useState<number[]>([])
  const [exercises, setExercises] = useState<PlanExerciseRow[]>([])

  const [search, setSearch] = useState('')
  const [bodyPartFilter, setBodyPartFilter] = useState('הכל')
  const [step, setStep] = useState<'details' | 'exercises'>('details')

  const { data: exerciseResults = [], isLoading: loadingEx } = useExercises(search)
  const { mutate: addPlan, isPending } = useAddPlan()

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setDescription('')
      setDifficulty(null)
      setTrainingDays([])
      setExercises([])
      setSearch('')
      setBodyPartFilter('הכל')
      setStep('details')
    }
  }, [isOpen])

  function toggleDay(d: number) {
    setTrainingDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  function addExercise(ex: { exerciseId: string; name_he: string }) {
    if (exercises.some((e) => e.exercise_id === ex.exerciseId)) return
    setExercises((prev) => [
      ...prev,
      {
        exercise_id: ex.exerciseId,
        exercise_name: ex.name_he,
        order_index: prev.length,
        target_sets: 3,
        target_reps: 12,
        target_weight_kg: null,
      },
    ])
  }

  function removeExercise(id: string) {
    setExercises((prev) =>
      prev
        .filter((e) => e.exercise_id !== id)
        .map((e, i) => ({ ...e, order_index: i }))
    )
  }

  function updateExercise(id: string, field: keyof PlanExerciseRow, val: string) {
    setExercises((prev) =>
      prev.map((e) =>
        e.exercise_id !== id
          ? e
          : { ...e, [field]: val === '' ? null : Number(val) }
      )
    )
  }

  const filteredExercises =
    bodyPartFilter === 'הכל'
      ? exerciseResults
      : exerciseResults.filter((ex) =>
          ex.bodyParts.some(
            (bp) => (BODY_PARTS_MAP[bp] ?? bp) === bodyPartFilter
          )
        )

  function handleSave() {
    if (!name.trim()) return
    addPlan(
      {
        name: name.trim(),
        description: description.trim(),
        difficulty,
        training_days: trainingDays,
        exercises: exercises.map(({ exercise_id, exercise_name, order_index, target_sets, target_reps, target_weight_kg }) => ({
          exercise_id,
          exercise_name,
          order_index,
          target_sets,
          target_reps,
          target_weight_kg,
        })),
      },
      { onSuccess: onClose }
    )
  }

  const canSave = name.trim().length > 0

  const numFieldStyle: React.CSSProperties = {
    width: '52px',
    padding: '6px 4px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#f0f0f0',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontSize: '15px',
    textAlign: 'center',
    outline: 'none',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="תכנית אימון חדשה">
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

      {step === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', textAlign: 'right' }}>
              שם האימון *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: A — דחיפה"
              style={inputStyle}
            />
          </div>

          {/* Description */}
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

          {/* Difficulty */}
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

          {/* Training days */}
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

          <button
            onClick={() => setStep('exercises')}
            style={{
              width: '100%',
              padding: '14px',
              background: '#D7FF00',
              border: 'none',
              borderRadius: '12px',
              color: '#0a0a0a',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '17px',
              fontWeight: 700,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            הוסף תרגילים
          </button>
        </div>
      )}

      {step === 'exercises' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Selected exercises */}
          {exercises.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', textAlign: 'right' }}>
                תרגילים שנבחרו
              </span>
              {exercises.map((ex) => (
                <div
                  key={ex.exercise_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    background: '#1a1a1a',
                    borderRadius: '10px',
                    border: '1px solid #2a2a2a',
                  }}
                >
                  <GripVertical size={14} color="#333" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#f0f0f0' }}>
                      {ex.exercise_name}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>ק"ג</span>
                      <input
                        type="number"
                        placeholder="—"
                        value={ex.target_weight_kg ?? ''}
                        onChange={(e) => updateExercise(ex.exercise_id, 'target_weight_kg', e.target.value)}
                        style={numFieldStyle}
                        inputMode="decimal"
                      />
                      <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>חזרות</span>
                      <input
                        type="number"
                        placeholder="12"
                        value={ex.target_reps ?? ''}
                        onChange={(e) => updateExercise(ex.exercise_id, 'target_reps', e.target.value)}
                        style={numFieldStyle}
                        inputMode="numeric"
                      />
                      <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>סטים</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={ex.target_sets}
                        onChange={(e) => updateExercise(ex.exercise_id, 'target_sets', e.target.value)}
                        style={numFieldStyle}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeExercise(ex.exercise_id)}
                    style={{
                      width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#333',
                      WebkitTapHighlightColor: 'transparent', flexShrink: 0,
                    }}
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש תרגיל..."
              style={{ ...inputStyle, paddingLeft: '36px' }}
            />
            <Search size={16} color="#444" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Body part filter */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {BODY_PARTS_FILTER.map((bp) => (
              <button
                key={bp}
                onClick={() => setBodyPartFilter(bp)}
                style={{
                  padding: '6px 12px',
                  flexShrink: 0,
                  background: bodyPartFilter === bp ? 'rgba(215,255,0,0.1)' : '#1a1a1a',
                  border: bodyPartFilter === bp ? '1px solid rgba(215,255,0,0.3)' : '1px solid #222',
                  borderRadius: '20px',
                  color: bodyPartFilter === bp ? '#D7FF00' : '#555',
                  fontFamily: '"Rubik", sans-serif',
                  fontSize: '12px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {bp}
              </button>
            ))}
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
            {loadingEx && (
              <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#444', textAlign: 'center', margin: 0 }}>
                טוען...
              </p>
            )}
            {!loadingEx && filteredExercises.length === 0 && (
              <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#444', textAlign: 'center', margin: 0 }}>
                לא נמצאו תרגילים
              </p>
            )}
            {filteredExercises.map((ex) => {
              const selected = exercises.some((e) => e.exercise_id === ex.exerciseId)
              return (
                <button
                  key={ex.exerciseId}
                  onClick={() => addExercise({ exerciseId: ex.exerciseId, name_he: ex.name_he })}
                  disabled={selected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: selected ? 'rgba(215,255,0,0.06)' : '#1a1a1a',
                    border: selected ? '1px solid rgba(215,255,0,0.2)' : '1px solid #222',
                    borderRadius: '8px',
                    cursor: selected ? 'default' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: selected ? '#D7FF00' : '#f0f0f0' }}>
                      {ex.name_he}
                    </span>
                    <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>
                      {ex.bodyParts_he.join(' · ')}
                    </span>
                  </div>
                  {!selected && <Plus size={16} color="#555" />}
                  {selected && <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#D7FF00' }}>✓</span>}
                </button>
              )
            })}
          </div>

          {/* Save */}
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
  )
}
