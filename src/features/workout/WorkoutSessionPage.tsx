import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, Control, UseFormRegister } from 'react-hook-form'
import { ChevronRight, ChevronLeft, Plus, Trash2, Check, X } from 'lucide-react'
import { getSession, saveSession, clearSession, WorkoutSessionData } from './workoutSession'
import { useLogWorkout } from './useWorkoutLog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetValues {
  reps: string
  weight: string
}

interface ExerciseValues {
  sets: SetValues[]
}

interface FormValues {
  exercises: ExerciseValues[]
  notes: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function buildDefaultValues(session: WorkoutSessionData): FormValues {
  return {
    exercises: session.exercises.map((ex) => ({ sets: ex.sets })),
    notes: session.notes,
  }
}

// ─── ExerciseSlide ────────────────────────────────────────────────────────────

interface SlideProps {
  exerciseIndex: number
  session: WorkoutSessionData
  control: Control<FormValues>
  register: UseFormRegister<FormValues>
}

function ExerciseSlide({ exerciseIndex, session, control, register }: SlideProps) {
  const ex = session.exercises[exerciseIndex]!

  const { fields, append, remove } = useFieldArray<FormValues>({
    control,
    name: `exercises.${exerciseIndex}.sets`,
  })

  const inputStyle: React.CSSProperties = {
    width: '80px',
    padding: '10px 6px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    color: '#f0f0f0',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '22px',
    textAlign: 'center',
    outline: 'none',
    letterSpacing: '0.03em',
  }

  return (
    <div
      style={{
        flexShrink: 0,
        width: '100%',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '8px',
      }}
    >
      {/* GIF */}
      {ex.gif_url && (
        <div style={{ borderRadius: '14px', overflow: 'hidden', background: '#0a0a0a', lineHeight: 0 }}>
          <img
            src={ex.gif_url}
            alt={ex.exercise_name}
            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }}
          />
        </div>
      )}

      {/* Name + target */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '26px',
          fontWeight: 700,
          color: '#f0f0f0',
          lineHeight: 1.1,
        }}>
          {ex.exercise_name}
        </div>
        <div style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#555', marginTop: '4px' }}>
          יעד: {ex.target_sets} × {ex.target_reps ?? '—'}
          {ex.target_weight_kg ? ` · ${ex.target_weight_kg}ק"ג` : ''}
        </div>
      </div>

      {/* Sets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          <div style={{ width: 28 }} />
          <span style={{
            width: 80, textAlign: 'center',
            fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444',
          }}>חזרות</span>
          <span style={{
            width: 80, textAlign: 'center',
            fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444',
          }}>ק"ג</span>
          <div style={{ width: 32 }} />
        </div>

        {fields.map((field, setIdx) => (
          <div
            key={field.id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}
          >
            {/* Set number */}
            <span style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: 'rgba(215,255,0,0.08)',
              border: '1px solid rgba(215,255,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#D7FF00',
              flexShrink: 0,
            }}>
              {setIdx + 1}
            </span>

            <input
              type="number"
              inputMode="numeric"
              placeholder={ex.target_reps != null ? String(ex.target_reps) : '—'}
              style={inputStyle}
              {...register(`exercises.${exerciseIndex}.sets.${setIdx}.reps`)}
            />

            <input
              type="number"
              inputMode="decimal"
              placeholder={ex.target_weight_kg != null ? String(ex.target_weight_kg) : '0'}
              style={inputStyle}
              {...register(`exercises.${exerciseIndex}.sets.${setIdx}.weight`)}
            />

            <button
              type="button"
              onClick={() => remove(setIdx)}
              style={{
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer', color: '#333',
                flexShrink: 0, WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        ))}

        {/* Add set */}
        <button
          type="button"
          onClick={() => append({ reps: '', weight: '' })}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '10px',
            background: 'none',
            border: '1px dashed #2a2a2a',
            borderRadius: '10px',
            color: '#555',
            fontFamily: '"Rubik", sans-serif', fontSize: '13px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus size={14} strokeWidth={2} />
          הוסף סט
        </button>
      </div>
    </div>
  )
}

// ─── WorkoutSessionPage ───────────────────────────────────────────────────────

export function WorkoutSessionPage() {
  const navigate = useNavigate()
  const { mutate: logWorkout, isPending: isSaving } = useLogWorkout()

  // Read session synchronously on first render
  const [session] = useState<WorkoutSessionData | null>(() => getSession())
  const [currentIndex, setCurrentIndex] = useState(() => getSession()?.currentExerciseIndex ?? 0)
  const [elapsed, setElapsed] = useState(0)
  const [showCancel, setShowCancel] = useState(false)

  const carouselRef = useRef<HTMLDivElement>(null)

  // Redirect if no session
  useEffect(() => {
    if (!session) navigate('/workout', { replace: true })
  }, [session, navigate])

  // Elapsed timer
  useEffect(() => {
    if (!session) return
    const startMs = new Date(session.startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session])

  // ── RHF ──
  const { control, register, watch, handleSubmit } = useForm<FormValues>({
    defaultValues: session ? buildDefaultValues(session) : { exercises: [], notes: '' },
  })

  // Sync form → localStorage (debounced 500ms)
  const formValues = watch()
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!session) return
    if (syncRef.current) clearTimeout(syncRef.current)
    syncRef.current = setTimeout(() => {
      const updated: WorkoutSessionData = {
        ...session,
        currentExerciseIndex: currentIndex,
        notes: formValues.notes,
        exercises: session.exercises.map((ex, i) => ({
          ...ex,
          sets: (formValues.exercises[i]?.sets ?? []).map((s) => ({
            reps: s.reps ?? '',
            weight: s.weight ?? '',
          })),
        })),
      }
      saveSession(updated)
    }, 500)
    return () => { if (syncRef.current) clearTimeout(syncRef.current) }
  }, [formValues, currentIndex, session])

  // ── Carousel navigation ──
  const goTo = useCallback((idx: number) => {
    setCurrentIndex(idx)
    const container = carouselRef.current
    if (container) {
      container.scrollTo({ left: idx * container.clientWidth, behavior: 'smooth' })
    }
  }, [])

  // ── Finish workout ──
  const onFinish = handleSubmit((values) => {
    if (!session) return

    const sets: {
      exercise_id: string
      exercise_name: string
      set_number: number
      reps: number | null
      weight_kg: number | null
    }[] = []

    session.exercises.forEach((ex, i) => {
      const exSets = values.exercises[i]?.sets ?? []
      exSets.forEach((s, j) => {
        const reps = s.reps ? Number(s.reps) : null
        const weight = s.weight ? Number(s.weight) : null
        if (reps !== null || weight !== null) {
          sets.push({
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            set_number: j + 1,
            reps,
            weight_kg: weight,
          })
        }
      })
    })

    logWorkout(
      {
        date: new Date().toISOString().split('T')[0]!,
        workout_plan_id: session.planId,
        notes: values.notes,
        sets,
      },
      {
        onSuccess: () => {
          clearSession()
          navigate('/workout', { replace: true })
        },
      }
    )
  })

  if (!session) return null

  const exercises = session.exercises
  const totalEx = exercises.length

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0a0a0a',
      }}
    >
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #1a1a1a',
        flexShrink: 0,
      }}>
        {/* Cancel */}
        <button
          type="button"
          onClick={() => setShowCancel(true)}
          style={{
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#1a1a1a', border: '1px solid #222', borderRadius: '10px',
            cursor: 'pointer', color: '#666',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>

        {/* Plan name + timer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '17px', fontWeight: 600, color: '#f0f0f0',
          }}>
            {session.planName}
          </div>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '15px', color: '#D7FF00', letterSpacing: '0.06em',
          }}>
            {formatElapsed(elapsed)}
          </div>
        </div>

        {/* Finish */}
        <button
          type="button"
          onClick={onFinish}
          disabled={isSaving}
          style={{
            padding: '8px 14px',
            background: '#D7FF00',
            border: 'none',
            borderRadius: '10px',
            color: '#0a0a0a',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '15px', fontWeight: 700,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: '5px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Check size={15} strokeWidth={2.5} />
          {isSaving ? 'שומר...' : 'סיים'}
        </button>
      </div>

      {/* ── Exercise counter ── */}
      {totalEx > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '10px 16px 0',
          flexShrink: 0,
        }}>
          {exercises.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              style={{
                width: i === currentIndex ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentIndex ? '#D7FF00' : '#2a2a2a',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s',
                WebkitTapHighlightColor: 'transparent',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Carousel ── */}
      <div
        ref={carouselRef}
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          // Hide scrollbar
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          gap: 0,
        } as React.CSSProperties}
        onScroll={(e) => {
          const container = e.currentTarget
          const idx = Math.round(container.scrollLeft / container.clientWidth)
          if (idx !== currentIndex) setCurrentIndex(idx)
        }}
      >
        {exercises.map((_, exIdx) => (
          <div
            key={exIdx}
            style={{
              flexShrink: 0,
              width: '100%',
              scrollSnapAlign: 'start',
              overflowY: 'auto',
              padding: '16px',
              boxSizing: 'border-box',
            }}
          >
            <ExerciseSlide
              exerciseIndex={exIdx}
              session={session}
              control={control}
              register={register}
            />
          </div>
        ))}
      </div>

      {/* ── Prev / Next navigation ── */}
      {totalEx > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid #1a1a1a',
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px',
              background: currentIndex === 0 ? 'none' : '#1a1a1a',
              border: currentIndex === 0 ? '1px solid transparent' : '1px solid #222',
              borderRadius: '10px',
              color: currentIndex === 0 ? '#333' : '#888',
              fontFamily: '"Rubik", sans-serif', fontSize: '13px',
              cursor: currentIndex === 0 ? 'default' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={16} strokeWidth={2} />
            הקודם
          </button>

          <span style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '16px', color: '#555',
          }}>
            {currentIndex + 1} / {totalEx}
          </span>

          <button
            type="button"
            onClick={() => currentIndex < totalEx - 1 ? goTo(currentIndex + 1) : onFinish()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px',
              background: currentIndex === totalEx - 1 ? '#D7FF00' : '#1a1a1a',
              border: 'none',
              borderRadius: '10px',
              color: currentIndex === totalEx - 1 ? '#0a0a0a' : '#888',
              fontFamily: currentIndex === totalEx - 1 ? '"Barlow Condensed", sans-serif' : '"Rubik", sans-serif',
              fontSize: currentIndex === totalEx - 1 ? '15px' : '13px',
              fontWeight: currentIndex === totalEx - 1 ? 700 : 400,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {currentIndex === totalEx - 1 ? 'סיים אימון' : 'הבא'}
            {currentIndex < totalEx - 1 && <ChevronRight size={16} strokeWidth={2} />}
            {currentIndex === totalEx - 1 && <Check size={15} strokeWidth={2.5} />}
          </button>
        </div>
      )}

      {/* Notes - below last exercise */}
      {currentIndex === totalEx - 1 && (
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <textarea
            placeholder="הערות לאימון..."
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '10px',
              color: '#888',
              fontFamily: '"Rubik", sans-serif', fontSize: '13px',
              resize: 'none', outline: 'none',
              boxSizing: 'border-box',
              textAlign: 'right', direction: 'rtl',
            }}
            {...register('notes')}
          />
        </div>
      )}

      {/* ── Cancel dialog ── */}
      {showCancel && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#111',
            borderRadius: '16px',
            borderTop: '2px solid #ff4757',
            padding: '24px',
            width: '100%',
            maxWidth: '320px',
            display: 'flex', flexDirection: 'column', gap: '16px',
            textAlign: 'right',
          }}>
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '20px', fontWeight: 600, color: '#f0f0f0',
            }}>
              לבטל את האימון?
            </span>
            <p style={{
              fontFamily: '"Rubik", sans-serif', fontSize: '13px',
              color: '#666', margin: 0, lineHeight: 1.5,
            }}>
              ההתקדמות לא תישמר. האם אתה בטוח?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCancel(false)}
                style={{
                  flex: 1, padding: '12px',
                  background: '#1a1a1a', border: '1px solid #222', borderRadius: '10px',
                  color: '#888', fontFamily: '"Rubik", sans-serif', fontSize: '14px',
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                המשך
              </button>
              <button
                onClick={() => { clearSession(); navigate('/workout', { replace: true }) }}
                style={{
                  flex: 1, padding: '12px',
                  background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
                  borderRadius: '10px',
                  color: '#ff4757', fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: '16px', fontWeight: 700,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                בטל אימון
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
