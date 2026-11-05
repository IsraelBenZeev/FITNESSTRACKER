import { useState, useEffect } from 'react'
import { GOAL_CALORIES, GOAL_PROTEIN } from './constants'
import { supabase } from './supabase'
import { todayLocal } from './date'

export type GoalsConfig = {
  trainingCalories: number
  trainingProtein: number
  restCalories: number
  restProtein: number
  trainingDays: number[] // 0 = Sunday … 6 = Saturday
}

type Listener = (config: GoalsConfig) => void

const DEFAULT_CONFIG: GoalsConfig = {
  trainingCalories: GOAL_CALORIES,
  trainingProtein: GOAL_PROTEIN,
  restCalories: 1650,
  restProtein: 100,
  trainingDays: [1, 3, 5],
}

// Module-level store
const listeners = new Set<Listener>()
let currentConfig: GoalsConfig = DEFAULT_CONFIG

function notifyAll(config: GoalsConfig) {
  currentConfig = config
  listeners.forEach((fn) => fn(config))
}

function rowToConfig(row: Record<string, unknown>): GoalsConfig {
  return {
    trainingCalories: row.training_calories as number,
    trainingProtein:  row.training_protein  as number,
    restCalories:     row.rest_calories     as number,
    restProtein:      row.rest_protein      as number,
    trainingDays:     (row.training_days    as number[]) ?? [],
  }
}

export async function fetchGoalsConfig(): Promise<GoalsConfig> {
  const { data, error } = await supabase
    .from('user_goals')
    .select('training_calories, training_protein, rest_calories, rest_protein, training_days')
    .single()
  if (error || !data) return DEFAULT_CONFIG
  return rowToConfig(data)
}

export async function saveGoalsConfig(config: GoalsConfig): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('user_goals')
    .upsert({
      user_id:           user.id,
      training_calories: config.trainingCalories,
      training_protein:  config.trainingProtein,
      rest_calories:     config.restCalories,
      rest_protein:      config.restProtein,
      training_days:     config.trainingDays,
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'user_id' })
  notifyAll(config)

  // Today's goal changed: re-stamp today's meals so the day is judged by the goal now in effect.
  // Past days keep the goal they were logged with.
  const today = todayLocal()
  const { goalCalories, goalProtein } = goalsForDate(config, new Date())
  await supabase
    .from('nutrition_log')
    .update({ goal_calories: goalCalories, goal_protein: goalProtein })
    .eq('date', today)
    .eq('user_id', user.id)
}

/** Goal that applies on a given date under a config (training vs rest day) */
export function goalsForDate(config: GoalsConfig, date: Date): { goalCalories: number; goalProtein: number; isTrainingDay: boolean } {
  const isTrainingDay = config.trainingDays.includes(date.getDay())
  return {
    goalCalories: isTrainingDay ? config.trainingCalories : config.restCalories,
    goalProtein:  isTrainingDay ? config.trainingProtein  : config.restProtein,
    isTrainingDay,
  }
}

export function useGoals() {
  const [config, setConfig] = useState<GoalsConfig>(currentConfig)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const listener: Listener = (next) => setConfig(next)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  useEffect(() => {
    if (loaded) return
    fetchGoalsConfig().then((c) => {
      notifyAll(c)
      setLoaded(true)
    })
  }, [loaded])

  const { goalCalories, goalProtein, isTrainingDay } = goalsForDate(config, new Date())

  return {
    goalCalories,
    goalProtein,
    isTrainingDay,
    goalsConfig:   config,
    setGoals:      saveGoalsConfig,
  }
}
