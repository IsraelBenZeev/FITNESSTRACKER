import { useToday } from './useToday'
import { GOAL_CALORIES, GOAL_PROTEIN } from '../../lib/constants'
import { StatCard } from '../../shared/components/StatCard'
import { ProgressBar } from '../../shared/components/ProgressBar'
import { Card } from '../../shared/components/Card'
import { MealCard } from './MealCard'

export function TodayPage() {
  const { meals, totals, loading } = useToday()

  const remaining = GOAL_CALORIES - totals.calories
  const isOver = totals.calories > GOAL_CALORIES

  if (loading) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#555', fontFamily: '"DM Sans", sans-serif' }}>
        טוען...
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <StatCard label="קלוריות" value={totals.calories} unit=" קל'" danger={isOver} />
        <StatCard label="חלבון" value={totals.protein} unit="g" />
        <StatCard label="פחמימות" value={totals.carbs} unit="g" />
      </div>

      {/* Progress */}
      <Card style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <ProgressBar value={totals.calories} goal={GOAL_CALORIES} label="קלוריות" unit=" קל'" />
        <ProgressBar value={totals.protein} goal={GOAL_PROTEIN} label="חלבון" unit="g" />
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
            fontFamily: '"DM Sans", sans-serif',
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
            fontFamily: '"Bebas Neue", cursive',
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
              fontFamily: '"DM Sans", sans-serif',
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
    </div>
  )
}
