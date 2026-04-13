import { useState } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { useToday } from './useToday'
import { useGoals } from '../../lib/useGoals'
import { StatCard } from '../../shared/components/StatCard'
import { ProgressBar } from '../../shared/components/ProgressBar'
import { Card } from '../../shared/components/Card'
import { MealCard } from './MealCard'
import { AddMealModal } from './AddMealModal'
import { EditGoalsModal } from './EditGoalsModal'

export function TodayPage() {
  const { meals, totals, loading } = useToday()
  const { goalCalories, goalProtein } = useGoals()
  const [addMealOpen, setAddMealOpen] = useState(false)
  const [editGoalsOpen, setEditGoalsOpen] = useState(false)

  const remaining = goalCalories - totals.calories
  const isOver = totals.calories > goalCalories

  if (loading) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#555', fontFamily: '"Rubik", sans-serif' }}>
        טוען...
      </div>
    )
  }

  return (
    <>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <StatCard label="קלוריות" value={totals.calories} unit=" קל'" danger={isOver} />
          <StatCard label="חלבון" value={totals.protein} unit="g" />
          <StatCard label="פחמימות" value={totals.carbs} unit="g" />
        </div>

        {/* Progress */}
        <Card style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '15px', color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              יעדים
            </span>
            <button
              onClick={() => setEditGoalsOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#444',
                padding: '4px 6px',
                borderRadius: '6px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Settings2 size={15} strokeWidth={1.5} color="#444" />
            </button>
          </div>
          <ProgressBar value={totals.calories} goal={goalCalories} label="קלוריות" unit=" קל'" />
          <ProgressBar value={totals.protein} goal={goalProtein} label="חלבון" unit="g" />
        </Card>

        {/* Remaining banner */}
        <div
          style={{
            borderRadius: '10px',
            padding: '11px 16px',
            background: isOver ? 'rgba(255,71,87,0.08)' : 'rgba(215,255,0,0.06)',
            border: `1px solid ${isOver ? 'rgba(255,71,87,0.25)' : 'rgba(215,255,0,0.15)'}`,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"Rubik", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: isOver ? '#ff4757' : '#D7FF00',
            }}
          >
            {isOver
              ? `חרגת ב-${Math.round(Math.abs(remaining))} קל'`
              : `נשאר להיום: ${Math.round(remaining)} קל'`}
          </span>
        </div>

        {/* Meals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '18px',
              color: '#888',
              margin: 0,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            ארוחות היום
          </h2>
          {meals.length === 0 ? (
            <div
              style={{
                fontFamily: '"Rubik", sans-serif',
                fontSize: '14px',
                color: '#444',
                textAlign: 'center',
                padding: '28px',
              }}
            >
              אין ארוחות רשומות להיום עדיין
            </div>
          ) : (
            meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
          )}
        </div>

        {/* Bottom spacing for FAB */}
        <div style={{ height: '72px' }} />
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddMealOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(56px + 20px)',
          right: '16px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#D7FF00',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 60,
          boxShadow: '0 4px 20px rgba(215,255,0,0.28)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Plus size={24} color="#0a0a0a" strokeWidth={2.5} />
      </button>

      <AddMealModal isOpen={addMealOpen} onClose={() => setAddMealOpen(false)} />
      <EditGoalsModal isOpen={editGoalsOpen} onClose={() => setEditGoalsOpen(false)} />
    </>
  )
}
