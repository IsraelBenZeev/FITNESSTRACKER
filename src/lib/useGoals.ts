import { useState, useEffect } from 'react'
import { GOAL_CALORIES, GOAL_PROTEIN } from './constants'

const STORAGE_KEY = 'ft_goals'

type Goals = { calories: number; protein: number }
type Listener = (goals: Goals) => void

// Module-level store — shared across all hook instances
const listeners = new Set<Listener>()

let currentGoals: Goals = (() => {
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
})()

function setGoalsGlobal(calories: number, protein: number) {
  currentGoals = { calories, protein }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentGoals))
  listeners.forEach((fn) => fn(currentGoals))
}

export function useGoals() {
  const [goals, setGoalsState] = useState<Goals>(currentGoals)

  useEffect(() => {
    const listener: Listener = (next) => setGoalsState(next)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  return {
    goalCalories: goals.calories,
    goalProtein: goals.protein,
    setGoals: setGoalsGlobal,
  }
}
