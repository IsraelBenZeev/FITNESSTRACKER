import { useState } from 'react'
import { Plus, Trash2, Dumbbell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../shared/components/Card'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { CreatePlanModal } from './CreatePlanModal'
import { useWorkoutPlans } from './useWorkoutPlans'
import { useDeletePlan } from './useDeletePlan'
import type { WorkoutPlan } from '../../types/workout'

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const DIFFICULTY_COLOR: Record<string, string> = {
  קל: '#4ade80',
  בינוני: '#fb923c',
  קשה: '#ff4757',
}

function PlanRow({ plan }: { plan: WorkoutPlan }) {
  const navigate = useNavigate()
  const { mutate: deletePlan, isPending } = useDeletePlan()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
    <div
      onClick={() => navigate(`/workout/plan/${plan.id}`)}
      style={{ cursor: 'pointer' }}
    >
    <Card style={{ padding: '14px 16px' }} hover>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmOpen(true) }}
              disabled={isPending}
              style={{
                width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer', color: '#333',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
            {plan.difficulty && (
              <span style={{
                fontFamily: '"Rubik", sans-serif', fontSize: '11px',
                color: DIFFICULTY_COLOR[plan.difficulty] ?? '#555',
                padding: '2px 8px',
                background: `${DIFFICULTY_COLOR[plan.difficulty] ?? '#555'}15`,
                borderRadius: '20px',
                border: `1px solid ${DIFFICULTY_COLOR[plan.difficulty] ?? '#555'}25`,
              }}>
                {plan.difficulty}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '20px', fontWeight: 600, color: '#f0f0f0' }}>
              {plan.name}
            </span>
            {plan.description && (
              <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555' }}>
                {plan.description}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#444' }}>
            {(plan.exercises ?? []).length} תרגילים
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {plan.training_days.sort((a, b) => a - b).map((d) => (
              <span
                key={d}
                style={{
                  padding: '3px 7px',
                  background: 'rgba(215,255,0,0.08)',
                  border: '1px solid rgba(215,255,0,0.15)',
                  borderRadius: '6px',
                  fontFamily: '"Rubik", sans-serif',
                  fontSize: '11px',
                  color: '#D7FF00',
                }}
              >
                {DAY_NAMES[d]}
              </span>
            ))}
          </div>
        </div>

        {(plan.exercises ?? []).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {(plan.exercises ?? []).slice(0, 4).map((ex) => (
              <span key={ex.id} style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#666', textAlign: 'right' }}>
                {ex.exercise_name}
              </span>
            ))}
            {(plan.exercises ?? []).length > 4 && (
              <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#333', textAlign: 'right' }}>
                +{(plan.exercises ?? []).length - 4} תרגילים נוספים
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
    </div>
    <ConfirmDialog
      isOpen={confirmOpen}
      message="האם למחוק את התכנית?"
      onConfirm={() => { setConfirmOpen(false); deletePlan(plan.id) }}
      onCancel={() => setConfirmOpen(false)}
    />
    </>
  )
}

interface PlanListProps {
  createOpen: boolean
  onCreateChange: (v: boolean) => void
}

export function PlanList({ createOpen, onCreateChange }: PlanListProps) {
  const { data: plans = [], isLoading } = useWorkoutPlans()

  if (isLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#555', fontFamily: '"Rubik", sans-serif' }}>
        טוען...
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {plans.length === 0 && (
          <div style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Dumbbell size={40} color="#222" strokeWidth={1.5} />
            <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '14px', color: '#444', margin: 0 }}>
              אין תכניות אימון עדיין
            </p>
          </div>
        )}
        {plans.map((plan) => (
          <PlanRow key={plan.id} plan={plan} />
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => onCreateChange(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: '#D7FF00',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(215,255,0,0.25)',
          zIndex: 40,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Plus size={22} color="#0a0a0a" strokeWidth={2.5} />
      </button>

      <CreatePlanModal isOpen={createOpen} onClose={() => onCreateChange(false)} />
    </>
  )
}
