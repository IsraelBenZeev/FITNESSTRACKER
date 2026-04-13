import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

interface BodyStatPayload {
  id?: string
  date?: string
  weight_kg: number
  waist_cm: number
  notes: string
}

export function useAddBodyStat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BodyStatPayload) => {
      if (payload.id) {
        const { error } = await supabase
          .from('body_stats')
          .update({
            weight_kg: payload.weight_kg,
            waist_cm: payload.waist_cm,
            notes: payload.notes || null,
          })
          .eq('id', payload.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from('body_stats').insert({
          date: payload.date ?? todayDateString(),
          weight_kg: payload.weight_kg,
          waist_cm: payload.waist_cm,
          notes: payload.notes || null,
        })
        if (error) throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-stats'] })
    },
  })
}
