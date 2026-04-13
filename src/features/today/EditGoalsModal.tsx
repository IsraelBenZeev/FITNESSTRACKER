import { useState, useEffect } from 'react'
import { Modal } from '../../shared/components/Modal'
import { Stepper } from '../../shared/components/Stepper'
import { useGoals } from '../../lib/useGoals'

interface EditGoalsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditGoalsModal({ isOpen, onClose }: EditGoalsModalProps) {
  const { goalCalories, goalProtein, setGoals } = useGoals()
  const [localCalories, setLocalCalories] = useState(goalCalories)
  const [localProtein, setLocalProtein] = useState(goalProtein)

  useEffect(() => {
    if (isOpen) {
      setLocalCalories(goalCalories)
      setLocalProtein(goalProtein)
    }
  }, [isOpen, goalCalories, goalProtein])

  const handleSave = () => {
    setGoals(localCalories, localProtein)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="עריכת יעדים">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Stepper
          label="יעד קלוריות"
          value={localCalories}
          onChange={setLocalCalories}
          min={500}
          max={4000}
          step={50}
          unit="קל'"
        />
        <Stepper
          label="יעד חלבון"
          value={localProtein}
          onChange={setLocalProtein}
          min={20}
          max={300}
          step={1}
          unit="g"
        />

        <button
          onClick={handleSave}
          style={{
            marginTop: '4px',
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
