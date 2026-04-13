import { useState, useEffect } from 'react'
import { Modal } from '../../shared/components/Modal'
import { Stepper } from '../../shared/components/Stepper'
import { useGoals, GoalsConfig } from '../../lib/useGoals'

interface EditGoalsModalProps {
  isOpen: boolean
  onClose: () => void
}

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DAY_NAMES  = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

type Tab = 'training' | 'rest'

export function EditGoalsModal({ isOpen, onClose }: EditGoalsModalProps) {
  const { goalsConfig, setGoals } = useGoals()
  const [local, setLocal] = useState<GoalsConfig>(goalsConfig)
  const [tab, setTab] = useState<Tab>('training')

  useEffect(() => {
    if (isOpen) setLocal(goalsConfig)
  }, [isOpen, goalsConfig])

  const toggleDay = (dow: number) => {
    setLocal((prev) => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(dow)
        ? prev.trainingDays.filter((d) => d !== dow)
        : [...prev.trainingDays, dow],
    }))
  }

  const handleSave = () => {
    setGoals(local)
    onClose()
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        flex: 1,
        padding: '9px 0',
        background: tab === t ? '#D7FF00' : '#1a1a1a',
        color: tab === t ? '#0a0a0a' : '#555',
        border: 'none',
        borderRadius: '8px',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="עריכת יעדים">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#111', borderRadius: '10px', padding: '4px' }}>
          {tabBtn('training', 'יום אימון')}
          {tabBtn('rest', 'יום מנוחה')}
        </div>

        {/* Steppers */}
        {tab === 'training' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Stepper
              label="קלוריות — יום אימון"
              value={local.trainingCalories}
              onChange={(v) => setLocal((p) => ({ ...p, trainingCalories: v }))}
              min={500} max={4000} step={50} unit="קל'"
            />
            <Stepper
              label="חלבון — יום אימון"
              value={local.trainingProtein}
              onChange={(v) => setLocal((p) => ({ ...p, trainingProtein: v }))}
              min={20} max={300} step={1} unit="g"
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Stepper
              label="קלוריות — יום מנוחה"
              value={local.restCalories}
              onChange={(v) => setLocal((p) => ({ ...p, restCalories: v }))}
              min={500} max={4000} step={50} unit="קל'"
            />
            <Stepper
              label="חלבון — יום מנוחה"
              value={local.restProtein}
              onChange={(v) => setLocal((p) => ({ ...p, restProtein: v }))}
              min={20} max={300} step={1} unit="g"
            />
          </div>
        )}

        {/* Day picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{
            fontFamily: '"Rubik", sans-serif',
            fontSize: '12px',
            color: '#666',
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            ימי אימון
          </span>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
            {DAY_LABELS.map((label, dow) => {
              const active = local.trainingDays.includes(dow)
              return (
                <button
                  key={dow}
                  onClick={() => toggleDay(dow)}
                  title={DAY_NAMES[dow]}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '8px',
                    border: active ? '1.5px solid #D7FF00' : '1.5px solid #2a2a2a',
                    background: active ? 'rgba(215,255,0,0.1)' : '#111',
                    color: active ? '#D7FF00' : '#444',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
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
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '14px',
            background: '#D7FF00',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '12px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: 'pointer',
          }}
        >
          שמור יעדים
        </button>
      </div>
    </Modal>
  )
}
