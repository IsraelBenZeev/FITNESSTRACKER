import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { getCurrentUserId } from '../../lib/auth-helpers'
import { useToast } from '../../shared/context/ToastContext'

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

interface AddMealPayload {
  meal_name: string
  food_items: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  time: string
}

export function useAddMeal() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  return useMutation({
    mutationFn: async (payload: AddMealPayload) => {
      const { error } = await supabase.from('nutrition_log').insert({
        date: todayDateString(),
        time: payload.time,
        meal_name: payload.meal_name,
        food_items: payload.food_items || null,
        calories: payload.calories,
        protein_g: payload.protein_g,
        carbs_g: payload.carbs_g,
        fat_g: payload.fat_g,
        user_id: await getCurrentUserId(),
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'today'] })
      showSuccess('הארוחה נוספה בהצלחה')
    },
    onError: () => {
      showError('שגיאה בהוספת הארוחה')
    },
  })
}
