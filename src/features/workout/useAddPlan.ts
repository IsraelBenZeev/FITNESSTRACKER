import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { getCurrentUserId } from '../../lib/auth-helpers'
import type { WorkoutPlan, WorkoutPlanExercise } from '../../types/workout'

interface PlanPayload {
  name: string
  description: string
  difficulty: WorkoutPlan['difficulty']
  training_days: number[]
  exercises: Omit<WorkoutPlanExercise, 'id' | 'workout_plan_id' | 'created_at'>[]
}

export function useAddPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PlanPayload) => {
      const { data: plan, error } = await supabase
        .from('workout_plans')
        .insert({
          name: payload.name,
          description: payload.description || null,
          difficulty: payload.difficulty,
          training_days: payload.training_days,
          user_id: await getCurrentUserId(),
        })
        .select()
        .single()
      if (error) throw new Error(error.message)

      if (payload.exercises.length > 0) {
        const rows = payload.exercises.map((ex) => ({
          ...ex,
          workout_plan_id: plan.id,
        }))
        const { error: exErr } = await supabase
          .from('workout_plan_exercises')
          .insert(rows)
        if (exErr) throw new Error(exErr.message)
      }
      return plan
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'plans'] })
    },
  })
}
