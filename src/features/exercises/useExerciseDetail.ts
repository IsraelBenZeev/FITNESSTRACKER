/**
 * Data for the exercise screen — BodyBuddy-Client hooks useGetExercisesByIds, useGetExerciseHistory
 * (rpc get_exercise_progress), useAddExerciseToPlan (rpc add_exercise_to_plans), useRemoveExerciseFromPlan.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bb } from '../../lib/supabaseBodyBuddy'
import { useBbUserId } from '../nutrition/hooks'
import { getExercisesByIds, isCustomId } from '../workouts/api'
import { wkKeys } from '../workouts/hooks'
import type { Exercise, ExerciseProgress } from '../workouts/types'

export interface ExerciseDetail extends Exercise {
  secondaryMuscles_he: string[]
}

export function useExerciseDetail(exerciseId: string) {
  return useQuery({
    queryKey: ['bb', 'exercise-detail', exerciseId],
    enabled: !!exerciseId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<ExerciseDetail | null> => {
      if (isCustomId(exerciseId)) {
        const [ex] = await getExercisesByIds([exerciseId])
        return ex ? { ...ex, secondaryMuscles_he: [] } : null
      }
      const { data, error } = await bb().from('exercises_v2').select('*').eq('exerciseId', exerciseId).maybeSingle()
      if (error) throw error
      if (!data) return null
      const r = data as Partial<ExerciseDetail> & { exerciseId: string }
      return {
        exerciseId: r.exerciseId,
        name: r.name ?? '',
        name_he: r.name_he ?? r.name ?? '',
        imageUrls: r.imageUrls ?? [],
        videoUrl: r.videoUrl ?? null,
        targetMuscles: r.targetMuscles ?? [],
        targetMuscles_he: r.targetMuscles_he ?? [],
        bodyParts: r.bodyParts ?? [],
        bodyParts_he: r.bodyParts_he ?? [],
        equipments_he: r.equipments_he ?? [],
        instructions_he: r.instructions_he ?? [],
        input_fields: r.input_fields ?? [],
        secondaryMuscles_he: r.secondaryMuscles_he ?? [],
      }
    },
  })
}

export function useExerciseHistory(exerciseId: string) {
  const uid = useBbUserId()
  return useQuery({
    queryKey: ['bb', 'exercise-history', exerciseId, uid],
    enabled: !!uid && !!exerciseId,
    staleTime: Infinity,
    queryFn: async (): Promise<ExerciseProgress | null> => {
      const { data, error } = await bb().rpc('get_exercise_progress', { p_exercise_id: exerciseId })
      if (error) throw error
      return ((data ?? {}) as Record<string, ExerciseProgress>)[exerciseId] ?? null
    },
  })
}

export function useAddExerciseToPlans() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ exerciseId, planIds }: { exerciseId: string; planIds: string[] }) => {
      const { error } = await bb().rpc('add_exercise_to_plans', { plan_ids: planIds, new_exercise_id: exerciseId })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: wkKeys.all }),
  })
}

export function useRemoveExerciseFromPlan() {
  const uid = useBbUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ exerciseId, planId }: { exerciseId: string; planId: string }) => {
      const { data: plan, error: fetchError } = await bb()
        .from('workouts_plans')
        .select('exercise_ids')
        .eq('id', planId)
        .eq('user_id', uid!)
        .single()
      if (fetchError) throw fetchError
      const nextIds = ((plan?.exercise_ids as string[] | null) ?? []).filter((id) => id !== exerciseId)
      const { error } = await bb().from('workouts_plans').update({ exercise_ids: nextIds }).eq('id', planId).eq('user_id', uid!)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: wkKeys.all }),
  })
}
