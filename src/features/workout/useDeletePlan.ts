import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export function useDeletePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', planId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'plans'] })
    },
  })
}
