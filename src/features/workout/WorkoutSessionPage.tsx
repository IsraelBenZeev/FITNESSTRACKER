import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, useWatch, Control, Controller } from 'react-hook-form'
import { ChevronRight, ChevronLeft, Plus, Trash2, Check, X } from 'lucide-react'
import { getSession, saveSession, clearSession, WorkoutSessionData } from './workoutSession'
import { useLogWorkout } from './useWorkoutLog'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetValues {
  reps: string
  weight: string
}

interface ExerciseValues {
  sets: SetValues[]
  notes: string
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
    exercises: session.exercises.map((ex) => ({ sets: ex.sets, notes: ex.notes ?? '' })),
    notes: session.notes,
  }
}

// ─── StepperInput ─────────────────────────────────────────────────────────────

interface StepperProps {
  value: string
  onChange: (v: string) => void
  step: number
  min: number
  decimals?: boolean
  label: string
}

function StepperInput({ value, onChange, step, min, decimals, label }: StepperProps) {
  const num = parseFloat(value) || 0
  const display = decimals ? num.toFixed(1) : String(num)

  const btnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    color: '#888',
    fontSize: '20px',
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <span style={{
        fontFamily: '"Rubik", sans-serif',
        fontSize: '10px',
        color: '#444',
        letterSpacing: '0.03em',
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          onClick={() => onChange(String(Math.max(min, parseFloat((num - step).toFixed(10)))))}
          style={btnStyle}
        >
          −
        </button>
        <span style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: '26px',
          color: '#f0f0f0',
          width: '44px',
          textAlign: 'center',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}>
          {display}
        </span>
        <button
          type="button"
          onClick={() => onChange(String(parseFloat((num + step).toFixed(10))))}
          style={btnStyle}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── ExerciseSlide ────────────────────────────────────────────────────────────

interface SlideProps {
  exerciseIndex: number
  session: WorkoutSessionData
  control: Control<FormValues>
}

function ExerciseSlide({ exerciseIndex, session, control }: SlideProps) {
  const ex = session.exercises[exerciseIndex]!

  const { fields, append, remove } = useFieldArray<FormValues>({
    control,
    name: `exercises.${exerciseIndex}.sets`,
  })

  const currentSets = useWatch({ control, name: `exercises.${exerciseIndex}.sets` })

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
        <div style={{
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#0d0d0d',
          lineHeight: 0,
          border: '1px solid #1a1a1a',
        }}>
          <img
            src={ex.gif_url}
            alt={ex.exercise_name}
            style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', display: 'block' }}
          />
        </div>
      )}

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '26px',
          fontWeight: 700,
          color: '#f0f0f0',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}>
          {ex.exercise_name}
        </div>
      </div>

      {/* Sets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {fields.map((field, setIdx) => (
          <div
            key={field.id}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {/* Set number */}
            <span style={{
              width: 28,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(215,255,0,0.08)',
              border: '1px solid rgba(215,255,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '12px',
              color: '#D7FF00',
              flexShrink: 0,
              alignSelf: 'flex-end',
              marginBottom: '2px',
            }}>
              {setIdx + 1}
            </span>

            {/* Reps stepper */}
            <Controller
              control={control}
              name={`exercises.${exerciseIndex}.sets.${setIdx}.reps`}
              render={({ field: f }) => (
                <StepperInput
                  value={f.value}
                  onChange={f.onChange}
                  step={1}
                  min={0}
                  decimals={false}
                  label="חזרות"
                />
              )}
            />

            {/* Weight stepper */}
            <Controller
              control={control}
              name={`exercises.${exerciseIndex}.sets.${setIdx}.weight`}
              render={({ field: f }) => (
                <StepperInput
                  value={f.value}
                  onChange={f.onChange}
                  step={1}
                  min={0}
                  decimals={true}
                  label='ק"ג'
                />
              )}
            />

            {/* Delete */}
            <button
              type="button"
              onClick={() => remove(setIdx)}
              style={{
                width: 32,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ff4757',
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
                alignSelf: 'flex-end',
              }}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        ))}

        {/* Add set */}
        <button
          type="button"
          onClick={() => {
            const last = currentSets?.[currentSets.length - 1]
            append({
              reps: last?.reps ?? '',
              weight: last?.weight ?? '',
            })
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '12px',
            background: 'none',
            border: '1px dashed #2a2a2a',
            borderRadius: '10px',
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

      {/* Exercise notes */}
      <Controller
        control={control}
        name={`exercises.${exerciseIndex}.notes`}
        render={({ field }) => (
          <textarea
            {...field}
            placeholder="הערות לתרגיל..."
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '10px',
              color: '#888',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '13px',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              textAlign: 'right',
              direction: 'rtl',
            }}
          />
        )}
      />
    </div>
  )
}

// ─── WorkoutSessionPage ───────────────────────────────────────────────────────

export function WorkoutSessionPage() {
  const navigate = useNavigate()
  const { mutate: logWorkout, isPending: isSaving } = useLogWorkout()

  const [session] = useState<WorkoutSessionData | null>(() => getSession())
  const [currentIndex, setCurrentIndex] = useState(() => getSession()?.currentExerciseIndex ?? 0)
  const [elapsed, setElapsed] = useState(0)
  const [showCancel, setShowCancel] = useState(false)
  const [showLeave, setShowLeave] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)

  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session) navigate('/workout', { replace: true })
  }, [session, navigate])

  useEffect(() => {
    if (!session) return
    const startMs = new Date(session.startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session])

  // Intercept browser back button
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handler = () => {
      window.history.pushState(null, '', window.location.href)
      setShowLeave(true)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const { control, watch, handleSubmit } = useForm<FormValues>({
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
          notes: formValues.exercises[i]?.notes ?? '',
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
      notes: string | null
    }[] = []

    session.exercises.forEach((ex, i) => {
      const exForm = values.exercises[i]
      const exNotes = exForm?.notes || null
      const exSets = exForm?.sets ?? []
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
            notes: exNotes,
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
        paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
        paddingBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        borderBottom: '1px solid #1a1a1a',
        flexShrink: 0,
      }}>
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

        <button
          type="button"
          onClick={() => setShowFinishModal(true)}
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

      {/* ── Dots + counter ── */}
      {totalEx > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 16px 0',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '14px',
            color: '#444',
            minWidth: '32px',
            textAlign: 'right',
          }}>
            {currentIndex + 1}/{totalEx}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {exercises.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                style={{
                  width: i === currentIndex ? 20 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: i === currentIndex ? '#D7FF00' : '#252525',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.25s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Carousel wrapper with floating side buttons ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* כפתור הקודם — צד ימין (RTL) */}
        {totalEx > 1 && (
          <button
            type="button"
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            style={{
              position: 'absolute',
              right: 8,
              top: 120,
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: currentIndex === 0 ? 'rgba(20,20,20,0.3)' : 'rgba(20,20,20,0.88)',
              border: `1px solid ${currentIndex === 0 ? '#1a1a1a' : '#2a2a2a'}`,
              color: currentIndex === 0 ? '#2a2a2a' : '#aaa',
              cursor: currentIndex === 0 ? 'default' : 'pointer',
              backdropFilter: 'blur(4px)',
              WebkitTapHighlightColor: 'transparent',
              transition: 'opacity 0.2s',
            }}
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        )}

        {/* כפתור הבא / סיים — צד שמאל (RTL) */}
        {totalEx > 1 && (
          <button
            type="button"
            onClick={() => currentIndex < totalEx - 1 ? goTo(currentIndex + 1) : setShowFinishModal(true)}
            style={{
              position: 'absolute',
              left: 8,
              top: 120,
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: currentIndex === totalEx - 1 ? '#D7FF00' : 'rgba(20,20,20,0.88)',
              border: currentIndex === totalEx - 1 ? 'none' : '1px solid #2a2a2a',
              color: currentIndex === totalEx - 1 ? '#0a0a0a' : '#aaa',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              WebkitTapHighlightColor: 'transparent',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {currentIndex === totalEx - 1
              ? <Check size={17} strokeWidth={2.5} />
              : <ChevronLeft size={18} strokeWidth={2} />
            }
          </button>
        )}

        {/* ── Carousel (dir=ltr prevents RTL scrollLeft bugs) ── */}
        <div
          ref={carouselRef}
          dir="ltr"
          style={{
            height: '100%',
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            touchAction: 'pan-x',
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
              dir="rtl"
              style={{
                flexShrink: 0,
                width: '100%',
                scrollSnapAlign: 'start',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '16px',
                boxSizing: 'border-box',
                touchAction: 'pan-y',
              }}
            >
              <ExerciseSlide
                exerciseIndex={exIdx}
                session={session}
                control={control}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notes - below last exercise */}
      {currentIndex === totalEx - 1 && (
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <textarea
                {...field}
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
              />
            )}
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

      <ConfirmDialog
        isOpen={showLeave}
        message="האם לעזוב את האימון? ההתקדמות שלך שמורה — תוכל לחזור בכל עת."
        confirmLabel="עזוב"
        cancelLabel="המשך אימון"
        onConfirm={() => { setShowLeave(false); navigate('/workout', { replace: true }) }}
        onCancel={() => setShowLeave(false)}
      />

      {/* ── Finish confirmation modal ── */}
      {showFinishModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#111',
            borderRadius: '16px',
            borderTop: '2px solid #D7FF00',
            padding: '24px',
            width: '100%',
            maxWidth: '320px',
            display: 'flex', flexDirection: 'column', gap: '16px',
            textAlign: 'right',
            position: 'relative',
          }}>
            {/* X button */}
            <button
              type="button"
              onClick={() => setShowFinishModal(false)}
              style={{
                position: 'absolute', top: 12, left: 12,
                width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none',
                color: '#444', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={18} strokeWidth={2} />
            </button>

            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '21px', fontWeight: 600, color: '#f0f0f0',
            }}>
              האם לסיים את האימון?
            </span>
            <p style={{
              fontFamily: '"Rubik", sans-serif', fontSize: '13px',
              color: '#555', margin: 0, lineHeight: 1.5,
            }}>
              האימון יישמר בהיסטוריה שלך
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setShowFinishModal(false); onFinish() }}
                disabled={isSaving}
                style={{
                  padding: '14px',
                  background: '#D7FF00',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#0a0a0a',
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: '17px', fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Check size={16} strokeWidth={2.5} />
                {isSaving ? 'שומר...' : 'כן, שמור'}
              </button>

              <button
                type="button"
                onClick={() => { clearSession(); navigate('/workout', { replace: true }) }}
                style={{
                  padding: '14px',
                  background: 'rgba(255,71,87,0.08)',
                  border: '1px solid rgba(255,71,87,0.25)',
                  borderRadius: '12px',
                  color: '#ff4757',
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: '17px', fontWeight: 700,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                צא ללא שמירה
              </button>

              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                style={{
                  padding: '12px',
                  background: 'none',
                  border: '1px solid #222',
                  borderRadius: '12px',
                  color: '#555',
                  fontFamily: '"Rubik", sans-serif',
                  fontSize: '14px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                בטל
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
