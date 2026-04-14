import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../shared/context/ToastContext'

export function useDeletePlan() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
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
      showSuccess('התכנית נמחקה')
    },
    onError: () => {
      showError('שגיאה במחיקת התכנית')
    },
  })
}
