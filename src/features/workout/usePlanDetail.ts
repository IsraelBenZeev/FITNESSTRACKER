import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { WorkoutPlan, WorkoutPlanExercise } from '../../types/workout'

export function usePlanDetail(planId: string | undefined) {
  return useQuery({
    queryKey: ['workout', 'plan', planId],
    enabled: !!planId,
    queryFn: async (): Promise<WorkoutPlan> => {
      const { data: plan, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', planId!)
        .single()
      if (error) throw new Error(error.message)

      const { data: exercises, error: exErr } = await supabase
        .from('workout_plan_exercises')
        .select('*')
        .eq('workout_plan_id', planId!)
        .order('order_index', { ascending: true })
      if (exErr) throw new Error(exErr.message)

      return { ...plan, exercises: exercises as WorkoutPlanExercise[] } as WorkoutPlan
    },
    staleTime: 5 * 60 * 1000,
  })
}
