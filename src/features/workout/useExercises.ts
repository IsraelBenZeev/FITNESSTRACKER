import { useInfiniteQuery } from '@tanstack/react-query'
import { supabaseBodyBuddy } from '../../lib/supabaseBodyBuddy'
import type { Exercise } from '../../types/workout'

const PAGE_SIZE = 40

// Hebrew body-part label → English bodyParts values in DB
const HE_TO_PARTS: Record<string, string[]> = {
  חזה: ['chest'],
  גב: ['back'],
  כתפיים: ['shoulders'],
  רגליים: ['legs', 'upper legs', 'lower legs'],
  ידיים: ['arms', 'upper arms', 'lower arms'],
  בטן: ['waist'],
  קרדיו: ['cardio'],
  צוואר: ['neck'],
}

const SELECT_FIELDS = [
  'exerciseId',
  'name',
  'name_he',
  'bodyParts',
  'bodyParts_he',
  'targetMuscles',
  'targetMuscles_he',
  'secondaryMuscles',
  'secondaryMuscles_he',
  'equipments',
  'equipments_he',
  'instructions',
  'instructions_he',
  'gifUrl',
  'gif_available',
].join(',')

interface ExercisePage {
  data: Exercise[]
  nextPage: number | null
}

export function useExercises(search: string = '', bodyPartHe: string = '') {
  return useInfiniteQuery({
    queryKey: ['bodybuddy', 'exercises', search.trim(), bodyPartHe],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<ExercisePage> => {
      if (!supabaseBodyBuddy) return { data: [], nextPage: null }

      const from = (pageParam as number) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let q = supabaseBodyBuddy
        .from('exercises')
        .select(SELECT_FIELDS)
        .eq('gif_available', true)
        .order('sort_order', { ascending: true })
        .range(from, to)

      const trimmed = search.trim()
      if (trimmed) {
        q = q.or(`name_he.ilike.%${trimmed}%,name.ilike.%${trimmed}%`)
      }

      if (bodyPartHe && bodyPartHe !== 'הכל') {
        const parts = HE_TO_PARTS[bodyPartHe]
        if (parts?.length) {
          q = q.overlaps('bodyParts', parts)
        }
      }

      const { data, error } = await q
      if (error) throw new Error(error.message)

      const exercises = (data ?? []) as unknown as Exercise[]
      return {
        data: exercises,
        nextPage: exercises.length === PAGE_SIZE ? (pageParam as number) + 1 : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: supabaseBodyBuddy != null,
    staleTime: 10 * 60 * 1000,
  })
}
