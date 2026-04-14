import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../shared/context/ToastContext'

export function useDeleteMeal() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('nutrition_log')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition'] })
      showSuccess('הארוחה נמחקה')
    },
    onError: () => {
      showError('שגיאה במחיקת הארוחה')
    },
  })
}
