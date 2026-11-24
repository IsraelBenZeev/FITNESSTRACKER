/**
 * Favorite exercises — BodyBuddy-Client/src/hooks/useEcercises.ts (useFavoriteIds, useToggleFavorite)
 * + service/exercisesService.ts (table favorite_exercises).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bb } from '../../lib/supabaseBodyBuddy'
import { useBbUserId } from '../nutrition/hooks'

export function useFavoriteIds(enabled = true) {
  const uid = useBbUserId()
  return useQuery({
    queryKey: ['bb', 'favorites', uid],
    enabled: enabled && !!uid,
    staleTime: Infinity,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await bb()
        .from('favorite_exercises')
        .select('exercise_id')
        .eq('user_id', uid!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((r) => r.exercise_id as string)
    },
  })
}

export function useToggleFavorite() {
  const uid = useBbUserId()
  const qc = useQueryClient()
  const key = ['bb', 'favorites', uid]
  return useMutation({
    mutationFn: async ({ exerciseId, isFav }: { exerciseId: string; isFav: boolean }) => {
      const q = isFav
        ? bb().from('favorite_exercises').delete().eq('user_id', uid!).eq('exercise_id', exerciseId)
        : bb().from('favorite_exercises').insert({ user_id: uid!, exercise_id: exerciseId })
      const { error } = await q
      if (error) throw error
    },
    onMutate: async ({ exerciseId, isFav }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<string[]>(key)
      qc.setQueryData<string[]>(key, (old = []) => (isFav ? old.filter((id) => id !== exerciseId) : [...old, exerciseId]))
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(key, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}
