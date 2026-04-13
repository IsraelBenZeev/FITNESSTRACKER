import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, X, GripVertical, Info } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import { ExerciseDetailModal } from './ExerciseDetailModal'
import { useExercises } from './useExercises'
import { useAddPlan } from './useAddPlan'
import type { WorkoutPlan, Exercise } from '../../types/workout'

interface PlanExerciseRow {
  exercise_id: string
  exercise_name: string
  gif_url?: string
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
const BODY_PARTS_FILTER = ['הכל', 'חזה', 'גב', 'כתפיים', 'רגליים', 'ידיים', 'בטן', 'קרדיו']

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

export function CreatePlanModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<WorkoutPlan['difficulty']>(null)
  const [trainingDays, setTrainingDays] = useState<number[]>([])
  const [exercises, setExercises] = useState<PlanExerciseRow[]>([])
  const [search, setSearch] = useState('')
  const [bodyPartFilter, setBodyPartFilter] = useState('הכל')
  const [step, setStep] = useState<'details' | 'exercises'>('details')
  const [detailEx, setDetailEx] = useState<Exercise | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading: loadingEx,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useExercises(search, bodyPartFilter)

  const allExercises = data?.pages.flatMap((p) => p.data) ?? []

  const { mutate: addPlan, isPending } = useAddPlan()

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    const list = listRef.current
    if (!sentinel || !list) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: list, threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

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
      setDetailEx(null)
    }
  }, [isOpen])

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
          target_sets: 3,
          target_reps: 12,
          target_weight_kg: null,
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

  function updateExercise(id: string, field: keyof PlanExerciseRow, val: string) {
    setExercises((prev) =>
      prev.map((e) =>
        e.exercise_id !== id
          ? e
          : { ...e, [field]: val === '' ? null : Number(val) }
      )
    )
  }

  function handleSave() {
    if (!name.trim()) return
    addPlan(
      {
        name: name.trim(),
        description: description.trim(),
        difficulty,
        training_days: trainingDays,
        exercises: exercises.map(
          ({ exercise_id, exercise_name, gif_url, order_index, target_sets, target_reps, target_weight_kg }) => ({
            exercise_id,
            exercise_name,
            gif_url,
            order_index,
            target_sets,
            target_reps,
            target_weight_kg,
          })
        ),
      },
      { onSuccess: onClose }
    )
  }

  const canSave = name.trim().length > 0

  return (
    <>
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

        {/* ── DETAILS STEP ── */}
        {step === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                onClick={() => setStep('exercises')}
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
                }}
              >
                הוסף תרגילים
              </button>
            </div>
          </div>
        )}

        {/* ── EXERCISES STEP ── */}
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
                    {ex.gif_url && (
                      <img
                        src={ex.gif_url}
                        alt={ex.exercise_name}
                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#111' }}
                      />
                    )}
                    {!ex.gif_url && <GripVertical size={14} color="#333" />}
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
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
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

            {/* Exercise list with infinite scroll */}
            <div
              ref={listRef}
              style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}
            >
              {loadingEx && (
                <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#444', textAlign: 'center', margin: '12px 0' }}>
                  טוען תרגילים...
                </p>
              )}
              {!loadingEx && allExercises.length === 0 && (
                <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#444', textAlign: 'center', margin: '12px 0' }}>
                  לא נמצאו תרגילים
                </p>
              )}

              {allExercises.map((ex) => {
                const selected = exercises.some((e) => e.exercise_id === ex.exerciseId)
                return (
                  <div
                    key={ex.exerciseId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      background: selected ? 'rgba(215,255,0,0.05)' : '#1a1a1a',
                      border: selected ? '1px solid rgba(215,255,0,0.18)' : '1px solid #222',
                      borderRadius: '10px',
                    }}
                  >
                    {/* GIF thumbnail */}
                    {ex.gifUrl ? (
                      <img
                        src={ex.gifUrl}
                        alt={ex.name_he}
                        style={{ width: 52, height: 52, borderRadius: 7, objectFit: 'cover', flexShrink: 0, background: '#111' }}
                      />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: 7, background: '#111', flexShrink: 0 }} />
                    )}

                    {/* Text */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end', minWidth: 0 }}>
                      <span style={{
                        fontFamily: '"Rubik", sans-serif',
                        fontSize: '13px',
                        color: selected ? '#D7FF00' : '#f0f0f0',
                        textAlign: 'right',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}>
                        {ex.name_he}
                      </span>
                      <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>
                        {ex.bodyParts_he.join(' · ')}
                      </span>
                    </div>

                    {/* Info button */}
                    <button
                      onClick={() => setDetailEx(ex)}
                      style={{
                        width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#222', border: '1px solid #2a2a2a', borderRadius: '8px',
                        cursor: 'pointer', color: '#666', flexShrink: 0,
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Info size={15} strokeWidth={2} />
                    </button>

                    {/* Add button */}
                    <button
                      onClick={() => addExercise(ex)}
                      disabled={selected}
                      style={{
                        width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: selected ? 'rgba(215,255,0,0.1)' : '#D7FF00',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: selected ? 'default' : 'pointer',
                        color: selected ? '#D7FF00' : '#0a0a0a',
                        flexShrink: 0,
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {selected
                        ? <span style={{ fontSize: '14px', lineHeight: 1 }}>✓</span>
                        : <Plus size={16} strokeWidth={2.5} />
                      }
                    </button>
                  </div>
                )
              })}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} style={{ height: 1 }} />

              {/* Loading next page */}
              {isFetchingNextPage && (
                <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#444', textAlign: 'center', margin: '8px 0' }}>
                  טוען עוד...
                </p>
              )}
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

      {/* Exercise detail modal — rendered outside the plan modal */}
      <ExerciseDetailModal
        exercise={detailEx}
        isSelected={detailEx ? exercises.some((e) => e.exercise_id === detailEx.exerciseId) : false}
        onClose={() => setDetailEx(null)}
        onAdd={addExercise}
      />
    </>
  )
}
