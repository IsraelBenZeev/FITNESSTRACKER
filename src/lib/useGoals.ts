import { useState, useEffect } from 'react'
import { GOAL_CALORIES, GOAL_PROTEIN } from './constants'
import { supabase } from './supabase'

type Goals = { calories: number; protein: number }
type Listener = (goals: Goals) => void

// Module-level store — shared across all hook instances
const listeners = new Set<Listener>()
let currentGoals: Goals = { calories: GOAL_CALORIES, protein: GOAL_PROTEIN }

function notifyAll(goals: Goals) {
  currentGoals = goals
  listeners.forEach((fn) => fn(goals))
}

export async function fetchGoals(): Promise<Goals> {
  const { data, error } = await supabase
    .from('user_goals')
    .select('calories, protein')
    .single()
  if (error || !data) return { calories: GOAL_CALORIES, protein: GOAL_PROTEIN }
  return { calories: data.calories, protein: data.protein }
}

export async function saveGoals(calories: number, protein: number): Promise<void> {
  await supabase
    .from('user_goals')
    .update({ calories, protein, updated_at: new Date().toISOString() })
    .eq('id', 1)
  notifyAll({ calories, protein })
}

export function useGoals() {
  const [goals, setGoalsState] = useState<Goals>(currentGoals)
  const [loaded, setLoaded] = useState(false)

  // Subscribe to in-memory updates (cross-component sync)
  useEffect(() => {
    const listener: Listener = (next) => setGoalsState(next)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  // Load from DB on first mount
  useEffect(() => {
    if (loaded) return
    fetchGoals().then((g) => {
      notifyAll(g)
      setLoaded(true)
    })
  }, [loaded])

  return {
    goalCalories: goals.calories,
    goalProtein: goals.protein,
    setGoals: (calories: number, protein: number) => saveGoals(calories, protein),
  }
}
