import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '../../shared/components/Card'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { MealIcon } from '../../shared/icons/MealIcon'
import type { NutritionLog } from '../../types/nutrition'

interface MealCardProps {
  meal: NutritionLog
  onEdit?: (meal: NutritionLog) => void
  onDelete?: (meal: NutritionLog) => void
}

export function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: '"Rubik", sans-serif',
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
                  fontFamily: '"Rubik", sans-serif',
                  fontSize: '12px',
                  color: '#555',
                  lineHeight: 1.4,
                }}
              >
                {meal.food_items}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '20px',
                color: '#D7FF00',
                letterSpacing: '0.03em',
                lineHeight: 1,
              }}
            >
              {meal.calories}
            </span>
          </div>
        </div>

        {/* Macro pills */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: (onEdit || onDelete) ? '10px' : 0 }}>
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

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            {onEdit && (
              <ActionButton onClick={() => onEdit(meal)} icon={<Pencil size={13} strokeWidth={2} />} />
            )}
            {onDelete && (
              <ActionButton onClick={() => setConfirmOpen(true)} icon={<Trash2 size={13} strokeWidth={2} />} danger />
            )}
          </div>
        )}
      </div>
    </Card>
    <ConfirmDialog
      isOpen={confirmOpen}
      message="האם למחוק את הארוחה?"
      onConfirm={() => { setConfirmOpen(false); onDelete?.(meal) }}
      onCancel={() => setConfirmOpen(false)}
    />
    </>
  )
}

function MacroPill({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <span
      style={{
        fontFamily: '"Rubik", sans-serif',
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

function ActionButton({
  onClick,
  icon,
  label,
  danger = false,
}: {
  onClick: () => void
  icon?: React.ReactNode
  label?: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        background: danger ? 'rgba(255,71,87,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${danger ? 'rgba(255,71,87,0.2)' : '#2a2a2a'}`,
        borderRadius: '6px',
        color: danger ? '#ff4757' : '#555',
        padding: '4px 8px',
        cursor: 'pointer',
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        fontWeight: 500,
        WebkitTapHighlightColor: 'transparent',
        transition: 'opacity 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
