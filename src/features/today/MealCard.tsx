import { Card } from '../../shared/components/Card'
import { MealIcon } from '../../shared/icons/MealIcon'
import type { NutritionLog } from '../../types/nutrition'

interface MealCardProps {
  meal: NutritionLog
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <Card hover style={{ padding: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      {/* Icon */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'rgba(215,255,0,0.08)',
          border: '1px solid rgba(215,255,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MealIcon mealName={meal.meal_name} size={18} color="#D7FF00" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
          <div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#f0f0f0',
                marginBottom: '2px',
              }}
            >
              {meal.meal_name}
            </div>
            {meal.food_items && (
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '12px',
                  color: '#555',
                  lineHeight: 1.4,
                }}
              >
                {meal.food_items}
              </div>
            )}
          </div>
          <span
            style={{
              fontFamily: '"Bebas Neue", cursive',
              fontSize: '20px',
              color: '#D7FF00',
              letterSpacing: '0.03em',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {meal.calories}
          </span>
        </div>

        {/* Macro pills */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {meal.protein_g != null && (
            <MacroPill label="חלבון" value={meal.protein_g} accent />
          )}
          {meal.carbs_g != null && (
            <MacroPill label="פחמ'" value={meal.carbs_g} />
          )}
          {meal.fat_g != null && (
            <MacroPill label="שומן" value={meal.fat_g} />
          )}
        </div>
      </div>
    </Card>
  )
}

function MacroPill({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <span
      style={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '11px',
        padding: '2px 7px',
        borderRadius: '20px',
        background: accent ? 'rgba(215,255,0,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${accent ? 'rgba(215,255,0,0.2)' : '#222'}`,
        color: accent ? '#D7FF00' : '#555',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {label} {Math.round(value)}g
    </span>
  )
}
