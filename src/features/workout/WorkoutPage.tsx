import { useState } from 'react'
import { TodayWorkout } from './TodayWorkout'
import { PlanList } from './PlanList'
import { WorkoutHistory } from './WorkoutHistory'

type SubTab = 'today' | 'plans' | 'history'

const SUBTABS: { id: SubTab; label: string }[] = [
  { id: 'today', label: 'היום' },
  { id: 'plans', label: 'תכניות' },
  { id: 'history', label: 'היסטוריה' },
]

export function WorkoutPage() {
  const [tab, setTab] = useState<SubTab>('today')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Sub-tab bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid #1a1a1a',
          padding: '0 16px',
          display: 'flex',
          gap: '0',
        }}
      >
        {SUBTABS.map(({ id, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #D7FF00' : '2px solid transparent',
                color: active ? '#D7FF00' : '#555',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '16px', flex: 1 }}>
        {tab === 'today' && <TodayWorkout />}
        {tab === 'plans' && <PlanList />}
        {tab === 'history' && <WorkoutHistory />}
      </div>
    </div>
  )
}
