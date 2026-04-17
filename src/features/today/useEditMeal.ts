import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../shared/context/ToastContext'

interface EditMealPayload {
  id: string
  meal_name: string
  food_items: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  time: string
}

export function useEditMeal() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  return useMutation({
    mutationFn: async (payload: EditMealPayload) => {
      const { error } = await supabase
        .from('nutrition_log')
        .update({
          meal_name: payload.meal_name,
          food_items: payload.food_items || null,
          calories: payload.calories,
          protein_g: payload.protein_g,
          carbs_g: payload.carbs_g,
          fat_g: payload.fat_g,
          time: payload.time,
        })
        .eq('id', payload.id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition'] })
      showSuccess('הארוחה עודכנה בהצלחה')
    },
    onError: () => {
      showError('שגיאה בעדכון הארוחה')
    },
  })
}
