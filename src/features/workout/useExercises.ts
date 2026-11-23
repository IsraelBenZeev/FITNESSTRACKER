import { useInfiniteQuery } from '@tanstack/react-query'
import { supabaseBodyBuddy } from '../../lib/supabaseBodyBuddy'
import type { Exercise, ExerciseInputField } from '../../types/workout'

const PAGE_SIZE = 40

// Hebrew body-part label → bodyParts values in BodyBuddy's exercises_v2
const HE_TO_PARTS: Record<string, string[]> = {
  חזה: ['chest'],
  גב: ['back'],
  כתפיים: ['shoulders'],
  רגליים: ['upper legs', 'lower legs', 'glutes'],
  ידיים: ['upper arms', 'lower arms'],
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
  'imageUrls',
  'input_fields',
].join(',')

interface ExercisePage {
  data: Exercise[]
  nextPage: number | null
}

type V2Row = Omit<Exercise, 'gifUrl'> & { imageUrls: string[] | null; input_fields: ExerciseInputField[] | null }

/** The app's exercise catalog (exercises_v2, active only — the same list the app shows) */
export function useExercises(search: string = '', bodyPartHe: string = '') {
  return useInfiniteQuery({
    queryKey: ['bb', 'exercises-v2', search.trim(), bodyPartHe],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<ExercisePage> => {
      if (!supabaseBodyBuddy) return { data: [], nextPage: null }

      const from = (pageParam as number) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let q = supabaseBodyBuddy
        .from('exercises_v2')
        .select(SELECT_FIELDS)
        .eq('status', 'active')
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

      const exercises = ((data ?? []) as unknown as V2Row[]).map(({ imageUrls, input_fields, ...rest }) => ({
        ...rest,
        gifUrl: imageUrls?.[0],
        input_fields: input_fields ?? [],
      }))
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
