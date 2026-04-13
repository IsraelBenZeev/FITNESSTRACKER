import { useState, useEffect } from 'react'
import { Modal } from '../../shared/components/Modal'
import { Stepper } from '../../shared/components/Stepper'
import { useAddMeal } from './useAddMeal'

const MEAL_OPTIONS = [
  'ארוחת בוקר',
  'ארוחת צהריים',
  'ארוחת ערב',
  'חטיף',
  'שייק',
  'פוסט וורקאות',
]

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddMealModal({ isOpen, onClose }: AddMealModalProps) {
  const [mealName, setMealName] = useState(MEAL_OPTIONS[0]!)
  const [foodItems, setFoodItems] = useState('')
  const [calories, setCalories] = useState(0)
  const [proteinG, setProteinG] = useState(0)
  const [carbsG, setCarbsG] = useState(0)
  const [fatG, setFatG] = useState(0)

  const { mutate, isPending } = useAddMeal()

  useEffect(() => {
    if (isOpen) {
      setMealName(MEAL_OPTIONS[0]!)
      setFoodItems('')
      setCalories(0)
      setProteinG(0)
      setCarbsG(0)
      setFatG(0)
    }
  }, [isOpen])

  const handleSubmit = () => {
    mutate(
      { meal_name: mealName, food_items: foodItems, calories, protein_g: proteinG, carbs_g: carbsG, fat_g: fatG },
      { onSuccess: onClose }
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#f0f0f0',
    fontFamily: '"Rubik", sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="הוספת ארוחה">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Meal type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#666', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            סוג ארוחה
          </span>
          <select
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {MEAL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Food items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#666', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            מה אכלת? (אופציונלי)
          </span>
          <input
            type="text"
            value={foodItems}
            onChange={(e) => setFoodItems(e.target.value)}
            placeholder="לדוגמה: אורז, חזה עוף, ירקות"
            style={inputStyle}
          />
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#1a1a1a' }} />

        {/* Steppers */}
        <Stepper label="קלוריות" value={calories} onChange={setCalories} min={0} max={3000} step={25} unit="קל'" />
        <Stepper label="חלבון" value={proteinG} onChange={setProteinG} min={0} max={200} step={1} unit="g" />
        <Stepper label="פחמימות" value={carbsG} onChange={setCarbsG} min={0} max={300} step={1} unit="g" />
        <Stepper label="שומן" value={fatG} onChange={setFatG} min={0} max={100} step={1} unit="g" />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={calories === 0 || isPending}
          style={{
            marginTop: '4px',
            width: '100%',
            padding: '14px',
            background: calories === 0 || isPending ? '#1a1a1a' : '#D7FF00',
            color: calories === 0 || isPending ? '#333' : '#0a0a0a',
            border: 'none',
            borderRadius: '12px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: calories === 0 || isPending ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {isPending ? 'שומר...' : 'שמור ארוחה'}
        </button>
      </div>
    </Modal>
  )
}
