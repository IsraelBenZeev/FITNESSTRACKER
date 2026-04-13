import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Play, Dumbbell, Calendar } from 'lucide-react'
import { usePlanDetail } from './usePlanDetail'
import { initSession, hasActiveSession } from './workoutSession'

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const DIFFICULTY_COLOR: Record<string, string> = {
  קל: '#4ade80',
  בינוני: '#fb923c',
  קשה: '#ff4757',
}

export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { data: plan, isLoading, error } = usePlanDetail(planId)

  function handleStart() {
    if (!plan) return
    // Warn if session already active
    if (hasActiveSession()) {
      const ok = window.confirm('יש אימון פעיל. האם להתחיל אימון חדש?')
      if (!ok) {
        navigate('/workout/session')
        return
      }
    }
    initSession(plan)
    navigate('/workout/session')
  }

  if (isLoading) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center', color: '#555', fontFamily: '"Rubik", sans-serif' }}>
        טוען...
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center', color: '#ff4757', fontFamily: '"Rubik", sans-serif' }}>
        שגיאה בטעינת התכנית
      </div>
    )
  }

  const exercises = plan.exercises ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid #1a1a1a',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#1a1a1a', border: '1px solid #222', borderRadius: '10px',
            cursor: 'pointer', color: '#888',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ArrowRight size={18} strokeWidth={2} />
        </button>
        <span style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '20px',
          fontWeight: 600,
          color: '#f0f0f0',
          letterSpacing: '0.03em',
        }}>
          {plan.name}
        </span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Plan meta */}
        <div style={{
          background: '#111',
          borderRadius: '14px',
          border: '1px solid #1a1a1a',
          borderTop: '2px solid #D7FF00',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {plan.description && (
            <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '14px', color: '#888', margin: 0, textAlign: 'right' }}>
              {plan.description}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {plan.difficulty && (
              <span style={{
                padding: '4px 12px',
                background: `${DIFFICULTY_COLOR[plan.difficulty]}15`,
                border: `1px solid ${DIFFICULTY_COLOR[plan.difficulty]}30`,
                borderRadius: '20px',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '12px',
                color: DIFFICULTY_COLOR[plan.difficulty],
              }}>
                {plan.difficulty}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Dumbbell size={14} color="#555" />
              <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#555' }}>
                {exercises.length} תרגילים
              </span>
            </div>
          </div>

          {plan.training_days.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {plan.training_days.sort((a, b) => a - b).map((d) => (
                  <span
                    key={d}
                    style={{
                      padding: '3px 8px',
                      background: 'rgba(215,255,0,0.08)',
                      border: '1px solid rgba(215,255,0,0.15)',
                      borderRadius: '6px',
                      fontFamily: '"Rubik", sans-serif',
                      fontSize: '12px',
                      color: '#D7FF00',
                    }}
                  >
                    {DAY_NAMES[d]}
                  </span>
                ))}
              </div>
              <Calendar size={14} color="#555" />
            </div>
          )}
        </div>

        {/* Exercise list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '13px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#555',
            textAlign: 'right',
          }}>
            תרגילים
          </span>

          {exercises.map((ex, i) => (
            <div
              key={ex.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: '#111',
                borderRadius: '12px',
                border: '1px solid #1a1a1a',
              }}
            >
              {/* Number */}
              <span style={{
                flexShrink: 0,
                width: 28, height: 28,
                borderRadius: '50%',
                background: 'rgba(215,255,0,0.08)',
                border: '1px solid rgba(215,255,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '13px',
                color: '#D7FF00',
              }}>
                {i + 1}
              </span>

              {/* GIF */}
              {ex.gif_url ? (
                <img
                  src={ex.gif_url}
                  alt={ex.exercise_name}
                  style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#0a0a0a' }}
                />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 8, background: '#1a1a1a', flexShrink: 0 }} />
              )}

              {/* Info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '14px', color: '#f0f0f0', textAlign: 'right' }}>
                  {ex.exercise_name}
                </span>
                <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '14px', color: '#666' }}>
                  {ex.target_sets} × {ex.target_reps ?? '—'}
                  {ex.target_weight_kg ? ` · ${ex.target_weight_kg}ק"ג` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start button — sticky bottom */}
      <div style={{ padding: '16px', borderTop: '1px solid #1a1a1a', background: '#0a0a0a' }}>
        <button
          onClick={handleStart}
          style={{
            width: '100%',
            padding: '16px',
            background: '#D7FF00',
            border: 'none',
            borderRadius: '14px',
            color: '#0a0a0a',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Play size={18} strokeWidth={2.5} fill="#0a0a0a" />
          התחל אימון
        </button>
      </div>
    </div>
  )
}
