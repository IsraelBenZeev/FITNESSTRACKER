import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronLeft, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  is_bodyweight: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  initialPlan?: WorkoutPlan
}

interface SortableRowProps {
  ex: PlanExerciseRow
  onToggleBodyweight: (id: string) => void
}

function SortableExerciseRow({ ex, onToggleBodyweight }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ex.exercise_id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-surface2 rounded-xl px-3 py-3 border border-[rgba(255,255,255,0.08)]"
    >
      <button
        {...attributes}
        {...listeners}
        className="w-6 h-7 flex items-center justify-center text-muted touch-none flex-shrink-0 cursor-grab active:cursor-grabbing"
        tabIndex={-1}
        type="button"
      >
        <GripVertical size={16} strokeWidth={2} />
      </button>
      <span className="text-sm font-body text-white flex-1 text-right">{ex.exercise_name}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-body ${ex.is_bodyweight ? 'text-accent' : 'text-muted'}`}>
          משקל גוף
        </span>
        <button
          dir="ltr"
          type="button"
          onClick={() => onToggleBodyweight(ex.exercise_id)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${ex.is_bodyweight ? 'bg-accent' : 'bg-[#516070]'}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-bg transition-transform ${ex.is_bodyweight ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
          />
        </button>
      </div>
    </div>
  )
}

const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const DIFFICULTIES: WorkoutPlan['difficulty'][] = ['קל', 'בינוני', 'קשה']
const DRAFT_KEY = 'ft_plan_draft'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#2C3545',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#C8D0DB',
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
          is_bodyweight: ex.is_bodyweight ?? false,
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
          is_bodyweight: false,
        },
      ]
    })
  }, [])

  function toggleBodyweight(exerciseId: string) {
    setExercises((prev) =>
      prev.map((e) =>
        e.exercise_id === exerciseId ? { ...e, is_bodyweight: !e.is_bodyweight } : e
      )
    )
  }

  function removeExercise(id: string) {
    setExercises((prev) =>
      prev
        .filter((e) => e.exercise_id !== id)
        .map((e, i) => ({ ...e, order_index: i }))
    )
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setExercises((prev) => {
      const oldIdx = prev.findIndex((e) => e.exercise_id === active.id)
      const newIdx = prev.findIndex((e) => e.exercise_id === over.id)
      return arrayMove(prev, oldIdx, newIdx).map((e, i) => ({ ...e, order_index: i }))
    })
  }

const exercisesPayload = exercises.map(
    ({ exercise_id, exercise_name, gif_url, order_index, is_bodyweight }) => ({
      exercise_id, exercise_name, gif_url, order_index, is_bodyweight,
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
                background: step === s ? 'rgba(150,200,40,0.1)' : '#2C3545',
                border: step === s ? '1px solid rgba(150,200,40,0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                color: step === s ? '#96C828' : '#8C9AAB',
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
              <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#8C9AAB', textAlign: 'right' }}>
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
              <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#8C9AAB', textAlign: 'right' }}>
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
              <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#8C9AAB', textAlign: 'right' }}>
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
                      background: difficulty === d ? 'rgba(150,200,40,0.1)' : '#2C3545',
                      border: difficulty === d ? '1px solid rgba(150,200,40,0.35)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      color: difficulty === d ? '#96C828' : '#8C9AAB',
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
              <label style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#8C9AAB', textAlign: 'right' }}>
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
                        background: active ? 'rgba(150,200,40,0.1)' : '#2C3545',
                        border: active ? '1px solid rgba(150,200,40,0.35)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: active ? '#96C828' : '#8C9AAB',
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
                  background: canSave ? '#2C3545' : '#252D3A',
                  border: canSave ? '1px solid rgba(255,255,255,0.08)' : '1px solid #2C3545',
                  borderRadius: '12px',
                  color: canSave ? '#8C9AAB' : '#516070',
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
                  background: '#96C828',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#1A2030',
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
                <Plus size={17} strokeWidth={2.5} color="#1A2030" />
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
                background: exercises.length > 0 ? 'rgba(150,200,40,0.05)' : '#2C3545',
                border: exercises.length > 0 ? '1px solid rgba(150,200,40,0.15)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '32px', fontWeight: 700, color: exercises.length > 0 ? '#96C828' : '#516070' }}>
                {exercises.length}
              </span>
              <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#8C9AAB', display: 'block', marginTop: '2px' }}>
                תרגילים נבחרו
              </span>
            </div>

            <button
              onClick={() => setPickerOpen(true)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#2C3545',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                color: '#96C828',
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

            {/* Exercise list with bodyweight toggles */}
            {exercises.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={exercises.map((e) => e.exercise_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[280px]">
                    {exercises.map((ex) => (
                      <SortableExerciseRow
                        key={ex.exercise_id}
                        ex={ex}
                        onToggleBodyweight={toggleBodyweight}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <button
              onClick={() => setStep('details')}
              style={{
                width: '100%',
                padding: '10px',
                background: 'none',
                border: 'none',
                color: '#8C9AAB',
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
                background: canSave ? '#96C828' : '#2C3545',
                border: 'none',
                borderRadius: '12px',
                color: canSave ? '#1A2030' : '#516070',
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
