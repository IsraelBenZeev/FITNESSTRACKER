import { useQuery } from '@tanstack/react-query'
import { supabaseBodyBuddy } from '../../lib/supabaseBodyBuddy'
import type { Exercise } from '../../types/workout'

export function useExercises(search: string = '') {
  return useQuery({
    queryKey: ['bodybuddy', 'exercises', search],
    queryFn: async (): Promise<Exercise[]> => {
      if (!supabaseBodyBuddy) return []
      let q = supabaseBodyBuddy
        .from('exercises')
        .select('exerciseId,name,name_he,bodyParts,bodyParts_he,targetMuscles,targetMuscles_he,equipments,equipments_he,gifUrl,gif_available')
        .order('sort_order', { ascending: true })

      if (search.trim()) {
        q = q.or(`name_he.ilike.%${search.trim()}%,name.ilike.%${search.trim()}%`)
      }

      const { data, error } = await q.limit(60)
      if (error) throw new Error(error.message)
      return (data ?? []) as Exercise[]
    },
    staleTime: 10 * 60 * 1000,
    enabled: supabaseBodyBuddy != null,
  })
}
