import { useNavigate } from 'react-router-dom'
import { Play, Dumbbell } from 'lucide-react'
import { Card } from '../../shared/components/Card'
import { useWorkoutPlans } from './useWorkoutPlans'
import { hasActiveSession } from './workoutSession'
import type { WorkoutPlan } from '../../types/workout'

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const DIFFICULTY_COLOR: Record<string, string> = {
  קל: '#4ade80',
  בינוני: '#fb923c',
  קשה: '#ff4757',
}

function PlanCard({ plan, onStart }: { plan: WorkoutPlan; onStart: () => void }) {
  const days = plan.training_days
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d])
    .join(' · ')

  return (
    <Card style={{ padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '22px',
              fontWeight: 600,
              color: '#f0f0f0',
            }}>
              {plan.name}
            </span>
            {plan.description && (
              <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#555' }}>
                {plan.description}
              </span>
            )}
          </div>
          {plan.difficulty && (
            <span style={{
              fontFamily: '"Rubik", sans-serif',
              fontSize: '11px',
              color: DIFFICULTY_COLOR[plan.difficulty] ?? '#555',
              padding: '3px 8px',
              background: `${DIFFICULTY_COLOR[plan.difficulty] ?? '#555'}15`,
              borderRadius: '20px',
              border: `1px solid ${DIFFICULTY_COLOR[plan.difficulty] ?? '#555'}30`,
              flexShrink: 0,
            }}>
              {plan.difficulty}
            </span>
          )}
        </div>

        {/* Exercises list */}
        {(plan.exercises ?? []).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(plan.exercises ?? []).map((ex) => (
              <div key={ex.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                background: '#1a1a1a',
                borderRadius: '6px',
              }}>
                <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555' }}>
                  {ex.target_sets} × {ex.target_reps ?? '—'}
                  {ex.target_weight_kg ? ` @ ${ex.target_weight_kg}ק"ג` : ''}
                </span>
                <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#888' }}>
                  {ex.exercise_name}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <button
            onClick={onStart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: '#D7FF00',
              border: 'none',
              borderRadius: '10px',
              color: '#0a0a0a',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Play size={14} strokeWidth={2.5} fill="#0a0a0a" />
            לפרטי תכנית
          </button>
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>
            {days}
          </span>
        </div>
      </div>
    </Card>
  )
}

export function TodayWorkout() {
  const navigate = useNavigate()
  const { data: plans = [], isLoading } = useWorkoutPlans()
  const hasSession = hasActiveSession()

  const todayDay = new Date().getDay() // 0=Sun ... 6=Sat
  const todayPlans = plans.filter((p) => p.training_days.includes(todayDay))
  const otherPlans = plans.filter((p) => !p.training_days.includes(todayDay))

  if (isLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#555', fontFamily: '"Rubik", sans-serif' }}>
        טוען...
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Dumbbell size={40} color="#222" strokeWidth={1.5} />
        <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '14px', color: '#444', margin: 0 }}>
          עדיין אין תכניות אימון.<br />
          עבור ל"תכניות" כדי ליצור אחת.
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {hasSession && (
          <button
            onClick={() => navigate('/workout/session')}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(215,255,0,0.1)',
              border: '1px solid rgba(215,255,0,0.25)',
              borderRadius: '10px',
              color: '#D7FF00',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '13px',
              textAlign: 'right',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            יש אימון פעיל. לחץ כדי להמשיך
          </button>
        )}

        {todayPlans.length > 0 && (
          <>
            <h3 style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '14px',
              color: '#D7FF00',
              margin: 0,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'right',
            }}>
              אימון היום
            </h3>
            {todayPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onStart={() => navigate(`/workout/plan/${plan.id}`)} />
            ))}
          </>
        )}

        {todayPlans.length === 0 && (
          <div style={{
            padding: '20px',
            background: '#111',
            borderRadius: '10px',
            border: '1px solid #1a1a1a',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '14px', color: '#444', margin: 0 }}>
              היום אין אימון מתוכנן
            </p>
          </div>
        )}

        {otherPlans.length > 0 && (
          <>
            <h3 style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '14px',
              color: '#555',
              margin: '8px 0 0',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'right',
            }}>
              תכניות נוספות
            </h3>
            {otherPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onStart={() => navigate(`/workout/plan/${plan.id}`)} />
            ))}
          </>
        )}
      </div>
    </>
  )
}
