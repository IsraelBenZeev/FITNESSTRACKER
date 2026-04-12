import { useRef } from 'react'
import { useDayMeals } from './useHistory'
import { MealCard } from '../today/MealCard'
import type { DayTotals } from '../../types/nutrition'

interface DayDetailSheetProps {
  dateStr: string | null
  totals: DayTotals | null
  onClose: () => void
}

function formatDate(dateStr: string): string {
  // Parse as local date to avoid UTC offset issues
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function DayDetailSheet({ dateStr, totals, onClose }: DayDetailSheetProps) {
  const { meals, loading } = useDayMeals(dateStr)
  const isOpen = !!dateStr

  // Swipe-to-dismiss
  const touchStartY = useRef<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) onClose()
    touchStartY.current = null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
      />

      {/* Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#111111',
          borderTop: '2px solid #D7FF00',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '85vh',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          zIndex: 101,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          direction: 'rtl',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: '40px', height: '4px', background: '#333', borderRadius: '2px' }} />
        </div>

        <div style={{ padding: '12px 16px 24px' }}>
          {/* Date heading */}
          {dateStr && (
            <h2
              style={{
                fontFamily: '"Bebas Neue", cursive',
                fontSize: '22px',
                color: '#f0f0f0',
                margin: '0 0 16px 0',
                letterSpacing: '0.05em',
              }}
            >
              {formatDate(dateStr)}
            </h2>
          )}

          {/* Macro summary */}
          {totals && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <MacroStat label="קלוריות" value={totals.calories} accent />
              <MacroStat label="חלבון" value={Math.round(totals.protein)} unit="g" />
              <MacroStat label="פחמימות" value={Math.round(totals.carbs)} unit="g" />
              <MacroStat label="שומן" value={Math.round(totals.fat)} unit="g" />
            </div>
          )}

          <div style={{ height: '1px', background: '#222', margin: '0 0 16px' }} />

          {/* Meals heading */}
          <h3
            style={{
              fontFamily: '"Bebas Neue", cursive',
              fontSize: '18px',
              color: '#888',
              margin: '0 0 12px 0',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            ארוחות
          </h3>

          {/* Meals list */}
          {loading ? (
            <div
              style={{
                padding: '32px 0',
                textAlign: 'center',
                color: '#555',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '14px',
              }}
            >
              טוען...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function MacroStat({ label, value, unit, accent = false }: {
  label: string
  value: number
  unit?: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        background: '#1a1a1a',
        border: `1px solid ${accent ? 'rgba(215,255,0,0.2)' : '#222'}`,
        borderRadius: '8px',
        padding: '10px 8px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: '"Bebas Neue", cursive',
          fontSize: '20px',
          color: accent ? '#D7FF00' : '#f0f0f0',
          lineHeight: 1,
          marginBottom: '4px',
        }}
      >
        {value}{unit}
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '10px',
          color: '#555',
        }}
      >
        {label}
      </div>
    </div>
  )
}
