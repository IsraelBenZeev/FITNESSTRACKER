import { useState } from 'react'
import { TodayWorkout } from './TodayWorkout'
import { PlanList } from './PlanList'
import { WorkoutHistory } from './WorkoutHistory'
import { ActiveWorkoutBanner } from './ActiveWorkoutBanner'
import { DraftResumeDialog } from './DraftResumeDialog'
import { usePlanDraft } from './usePlanDraft'

type SubTab = 'today' | 'plans' | 'history'

const SUBTABS: { id: SubTab; label: string }[] = [
  { id: 'today', label: 'היום' },
  { id: 'plans', label: 'תכניות' },
  { id: 'history', label: 'היסטוריה' },
]

export function WorkoutPage() {
  const [tab, setTab] = useState<SubTab>('today')
  const [createOpen, setCreateOpen] = useState(false)
  const { draft, clearDraft } = usePlanDraft()
  const [showDraftPrompt, setShowDraftPrompt] = useState(() => !!draft)

  function handleResume() {
    setShowDraftPrompt(false)
    setTab('plans')
    setCreateOpen(true)
  }

  function handleDiscard() {
    clearDraft()
    setShowDraftPrompt(false)
  }

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

      {/* Content — always mount all tabs so PlanList/CreatePlanModal portal works */}
      <div style={{ padding: '16px', flex: 1 }}>
        <ActiveWorkoutBanner />
        <div className={tab === 'today' ? '' : 'hidden'}><TodayWorkout /></div>
        <div className={tab === 'plans' ? '' : 'hidden'}>
          <PlanList createOpen={createOpen} onCreateChange={setCreateOpen} />
        </div>
        <div className={tab === 'history' ? '' : 'hidden'}><WorkoutHistory /></div>
      </div>

      {showDraftPrompt && draft && (
        <DraftResumeDialog
          draftName={draft.name}
          exerciseCount={draft.exerciseCount}
          onResume={handleResume}
          onDiscard={handleDiscard}
          onDismiss={() => setShowDraftPrompt(false)}
        />
      )}
    </div>
  )
}
