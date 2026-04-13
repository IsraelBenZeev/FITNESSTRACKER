import { useState } from 'react'
import { GOAL_CALORIES, GOAL_PROTEIN } from './constants'

const STORAGE_KEY = 'ft_goals'

function readGoals(): { calories: number; protein: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed.calories === 'number' && typeof parsed.protein === 'number') {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return { calories: GOAL_CALORIES, protein: GOAL_PROTEIN }
}

export function useGoals() {
  const [goals, setGoalsState] = useState(readGoals)

  const setGoals = (calories: number, protein: number) => {
    const next = { calories, protein }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setGoalsState(next)
  }

  return {
    goalCalories: goals.calories,
    goalProtein: goals.protein,
    setGoals,
  }
}
