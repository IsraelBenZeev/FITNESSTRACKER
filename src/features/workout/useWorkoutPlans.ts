import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import type { WorkoutPlan, WorkoutPlanExercise } from '../../types/workout'

export function useWorkoutPlans() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['workout', 'plans', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WorkoutPlan[]> => {
      const { data: plans, error } = await supabase
        .from('workout_plans')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)

      const planIds = (plans ?? []).map((p) => p.id)
      if (planIds.length === 0) return []

      const { data: exercises, error: exErr } = await supabase
        .from('workout_plan_exercises')
        .select('*')
        .in('workout_plan_id', planIds)
        .order('order_index', { ascending: true })
      if (exErr) throw new Error(exErr.message)

      return (plans ?? []).map((plan) => ({
        ...plan,
        exercises: (exercises ?? []).filter(
          (e: WorkoutPlanExercise) => e.workout_plan_id === plan.id
        ),
      })) as WorkoutPlan[]
    },
  })
}
