import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bb } from '../../lib/supabaseBodyBuddy'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import { useToast } from '../../shared/context/ToastContext'
import { todayLocal } from '../../lib/date'

interface BodyStatPayload {
  id?: string
  date?: string
  weight_kg: number
  waist_cm: number
  notes: string
}

/** Writes to BodyBuddy's body_stats under the connected BodyBuddy user */
export function useAddBodyStat() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  const { bbUser } = useBodyBuddyAuth()

  return useMutation({
    mutationFn: async (payload: BodyStatPayload) => {
      const userId = bbUser?.id
      if (!userId) throw new Error('לא מחובר ל-BodyBuddy')
      if (payload.id) {
        const { error } = await bb()
          .from('body_stats')
          .update({ weight_kg: payload.weight_kg, waist_cm: payload.waist_cm, notes: payload.notes || null })
          .eq('id', payload.id)
          .eq('user_id', userId)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await bb().from('body_stats').insert({
          date: payload.date ?? todayLocal(),
          weight_kg: payload.weight_kg,
          waist_cm: payload.waist_cm,
          notes: payload.notes || null,
          user_id: userId,
        })
        if (error) throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bb', 'body-stats'] })
      showSuccess('הנתונים נשמרו בהצלחה')
    },
    onError: () => {
      showError('שגיאה בשמירת הנתונים')
    },
  })
}
