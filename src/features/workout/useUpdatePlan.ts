import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../shared/context/ToastContext'
import type { WorkoutPlan, WorkoutPlanExercise } from '../../types/workout'

interface UpdatePlanPayload {
  planId: string
  name: string
  description: string
  difficulty: WorkoutPlan['difficulty']
  training_days: number[]
  exercises: Omit<WorkoutPlanExercise, 'id' | 'workout_plan_id' | 'created_at'>[]
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  return useMutation({
    mutationFn: async (payload: UpdatePlanPayload) => {
      const { error: updateErr } = await supabase
        .from('workout_plans')
        .update({
          name: payload.name,
          description: payload.description || null,
          difficulty: payload.difficulty,
          training_days: payload.training_days,
        })
        .eq('id', payload.planId)
      if (updateErr) throw new Error(updateErr.message)

      const { error: deleteErr } = await supabase
        .from('workout_plan_exercises')
        .delete()
        .eq('workout_plan_id', payload.planId)
      if (deleteErr) throw new Error(deleteErr.message)

      if (payload.exercises.length > 0) {
        const rows = payload.exercises.map((ex) => ({
          ...ex,
          workout_plan_id: payload.planId,
        }))
        const { error: insertErr } = await supabase
          .from('workout_plan_exercises')
          .insert(rows)
        if (insertErr) throw new Error(insertErr.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'plans'] })
      queryClient.invalidateQueries({ queryKey: ['workout', 'plan'] })
      showSuccess('התכנית עודכנה בהצלחה')
    },
    onError: () => {
      showError('שגיאה בעדכון התכנית')
    },
  })
}
