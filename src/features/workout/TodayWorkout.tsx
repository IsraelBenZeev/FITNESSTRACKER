import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Dumbbell, ChevronLeft, X, Check } from 'lucide-react'
import { Card } from '../../shared/components/Card'
import { useWorkoutPlans } from './useWorkoutPlans'
import { useTodayWorkoutLog } from './useWorkoutLog'
import type { WorkoutPlan, WorkoutLog, WorkoutSetLog } from '../../types/workout'

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const DIFFICULTY_COLOR: Record<string, string> = {
  קל: '#4ade80',
  בינוני: '#fb923c',
  קשה: '#ff4757',
}

// ─── CompletedWorkoutModal ────────────────────────────────────────────────────

function groupByExercise(sets: WorkoutSetLog[]) {
  const map = new Map<string, WorkoutSetLog[]>()
  for (const s of sets) {
    const arr = map.get(s.exercise_name) ?? []
    arr.push(s)
    map.set(s.exercise_name, arr)
  }
  return map
}

function CompletedWorkoutModal({
  log,
  planName,
  onClose,
}: {
  log: WorkoutLog
  planName: string
  onClose: () => void
}) {
  const sets = log.set_logs ?? []
  const grouped = groupByExercise(sets)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111',
          borderRadius: '20px 20px 0 0',
          borderTop: '2px solid #D7FF00',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#1a1a1a', border: '1px solid #222', borderRadius: '8px',
              cursor: 'pointer', color: '#666',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '18px', fontWeight: 700, color: '#f0f0f0',
            }}>
              {planName}
            </div>
            <div style={{
              fontFamily: '"Rubik", sans-serif',
              fontSize: '11px', color: '#444',
            }}>
              {log.date}
            </div>
          </div>
          <div style={{ width: 32 }} />
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '12px 16px 24px', flex: 1, minHeight: 0 }}>
          {grouped.size === 0 ? (
            <p style={{
              fontFamily: '"Rubik", sans-serif', fontSize: '13px',
              color: '#444', textAlign: 'center', margin: '24px 0',
            }}>
              לא נרשמו סטים לאימון זה
            </p>
          ) : (
            Array.from(grouped.entries()).map(([exName, exSets]) => (
              <div key={exName} style={{ marginBottom: '16px' }}>
                <div style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: '15px', fontWeight: 600, color: '#D7FF00',
                  marginBottom: '6px', textAlign: 'right',
                }}>
                  {exName}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {exSets.map((s, i) => (
                    <div key={s.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      background: '#1a1a1a',
                      borderRadius: '6px',
                    }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {s.weight_kg != null && (
                          <span style={{
                            fontFamily: '"Bebas Neue", sans-serif',
                            fontSize: '16px', color: '#f0f0f0',
                          }}>
                            {s.weight_kg} <span style={{ fontSize: '11px', color: '#555', fontFamily: '"Rubik", sans-serif' }}>ק"ג</span>
                          </span>
                        )}
                        {s.reps != null && (
                          <span style={{
                            fontFamily: '"Bebas Neue", sans-serif',
                            fontSize: '16px', color: '#f0f0f0',
                          }}>
                            {s.reps} <span style={{ fontSize: '11px', color: '#555', fontFamily: '"Rubik", sans-serif' }}>חזרות</span>
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontFamily: '"Rubik", sans-serif', fontSize: '11px',
                        color: '#D7FF00', opacity: 0.6,
                      }}>
                        סט {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CompactPlanCard ──────────────────────────────────────────────────────────

function CompactPlanCard({ plan, onStart }: { plan: WorkoutPlan; onStart: () => void }) {
  const days = plan.training_days
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d])
    .join(' · ')

  return (
    <Card style={{ padding: '12px 14px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        {/* Right: name + days */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '18px', fontWeight: 600, color: '#f0f0f0',
            }}>
              {plan.name}
            </span>
            {plan.difficulty && (
              <span style={{
                fontFamily: '"Rubik", sans-serif',
                fontSize: '10px',
                color: DIFFICULTY_COLOR[plan.difficulty] ?? '#555',
                padding: '2px 7px',
                background: `${DIFFICULTY_COLOR[plan.difficulty] ?? '#555'}15`,
                borderRadius: '20px',
                border: `1px solid ${DIFFICULTY_COLOR[plan.difficulty] ?? '#555'}30`,
                flexShrink: 0,
              }}>
                {plan.difficulty}
              </span>
            )}
          </div>
          {days && (
            <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>
              {days}
            </span>
          )}
        </div>

        {/* Left: button */}
        <button
          onClick={onStart}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 12px',
            background: '#D7FF00',
            border: 'none',
            borderRadius: '8px',
            color: '#0a0a0a',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Play size={12} strokeWidth={2.5} fill="#0a0a0a" />
          פרטים
          <ChevronLeft size={12} strokeWidth={2.5} />
        </button>
      </div>
    </Card>
  )
}

// ─── TodayWorkout ─────────────────────────────────────────────────────────────

export function TodayWorkout() {
  const navigate = useNavigate()
  const { data: plans = [], isLoading: plansLoading } = useWorkoutPlans()
  const { data: todayLogs = [], isLoading: logLoading } = useTodayWorkoutLog()
  const [selectedLog, setSelectedLog] = useState<import('../../types/workout').WorkoutLog | null>(null)

  const todayDay = new Date().getDay()
  const todayPlans = plans.filter((p) => p.training_days.includes(todayDay))
  const otherPlans = plans.filter((p) => !p.training_days.includes(todayDay))
  const hasCompletedToday = todayLogs.length > 0

  function getPlanName(planId: string | null): string {
    if (!planId) return 'אימון חופשי'
    return plans.find((p) => p.id === planId)?.name ?? 'אימון חופשי'
  }

  if (plansLoading || logLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#555', fontFamily: '"Rubik", sans-serif' }}>
        טוען...
      </div>
    )
  }

  if (plans.length === 0 && !hasCompletedToday) {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Completed workouts today */}
        {hasCompletedToday && (
          <>
            <h3 style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '13px', color: '#D7FF00',
              margin: 0, letterSpacing: '0.08em',
              textTransform: 'uppercase', textAlign: 'right',
            }}>
              אימוני היום
            </h3>
            {todayLogs.map((log) => (
              <Card key={log.id} style={{ padding: '12px 14px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}>
                  <button
                    onClick={() => setSelectedLog(log)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '8px 12px',
                      background: '#1a1a1a',
                      border: '1px solid #222',
                      borderRadius: '8px',
                      color: '#888',
                      fontFamily: '"Rubik", sans-serif', fontSize: '12px',
                      cursor: 'pointer', flexShrink: 0,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    פרטי ביצוע
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontFamily: '"Rubik", sans-serif', fontSize: '11px',
                      color: '#4ade80',
                      padding: '2px 8px',
                      background: 'rgba(74,222,128,0.08)',
                      borderRadius: '20px',
                      border: '1px solid rgba(74,222,128,0.2)',
                    }}>
                      <Check size={10} strokeWidth={2.5} />
                      הושלם
                    </span>
                    <span style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontSize: '18px', fontWeight: 600, color: '#f0f0f0',
                    }}>
                      {getPlanName(log.workout_plan_id)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}

        {/* Today's scheduled plans (always show if available) */}
        {todayPlans.length > 0 && (
          <>
            <h3 style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '13px', color: hasCompletedToday ? '#555' : '#D7FF00',
              margin: 0, letterSpacing: '0.08em',
              textTransform: 'uppercase', textAlign: 'right',
            }}>
              {hasCompletedToday ? 'תכנית היום' : 'אימון היום'}
            </h3>
            {todayPlans.map((plan) => (
              <CompactPlanCard key={plan.id} plan={plan} onStart={() => navigate(`/workout/plan/${plan.id}`)} />
            ))}
          </>
        )}

        {/* No workout scheduled message */}
        {todayPlans.length === 0 && !hasCompletedToday && (
          <div style={{
            padding: '16px',
            background: '#111', borderRadius: '10px',
            border: '1px solid #1a1a1a', textAlign: 'center',
          }}>
            <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '14px', color: '#444', margin: 0 }}>
              היום אין אימון מתוכנן
            </p>
          </div>
        )}

        {/* Other plans */}
        {otherPlans.length > 0 && (
          <>
            <h3 style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '13px', color: '#555',
              margin: '6px 0 0', letterSpacing: '0.08em',
              textTransform: 'uppercase', textAlign: 'right',
            }}>
              תכניות נוספות
            </h3>
            {otherPlans.map((plan) => (
              <CompactPlanCard key={plan.id} plan={plan} onStart={() => navigate(`/workout/plan/${plan.id}`)} />
            ))}
          </>
        )}
      </div>

      {/* Completed workout modal */}
      {selectedLog && (
        <CompletedWorkoutModal
          log={selectedLog}
          planName={getPlanName(selectedLog.workout_plan_id)}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  )
}
