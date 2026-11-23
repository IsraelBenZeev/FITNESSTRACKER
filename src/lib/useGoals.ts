import { GOAL_CALORIES, GOAL_PROTEIN } from './constants'
import { useGoalHistory } from '../features/history/useGoalHistory'

/**
 * Today's goal of record: BodyBuddy's nutrition_goals (same as the app).
 * The constants are only a fallback until a goal exists.
 */
export function useGoals() {
  const { current } = useGoalHistory()
  return {
    goalCalories: current?.calories ?? GOAL_CALORIES,
    goalProtein: current?.protein ?? GOAL_PROTEIN,
  }
}
