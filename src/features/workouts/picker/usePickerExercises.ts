/**
 * Data for the exercise picker — BodyBuddy-Client/src/hooks/useEcercises.ts (useExercises,
 * useUserCustomExercises) + service/exercisesService.ts (getExercisesByBodyParts).
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { bb } from '../../../lib/supabaseBodyBuddy'
import { useBbUserId } from '../../nutrition/hooks'
import { CUSTOM_PREFIX } from '../api'
import { MUSCLE_PARTS } from '../form/muscles'
import type { Exercise } from '../types'

export interface PickerExercise extends Exercise {
  subBodyParts: string[]
  subBodyParts_he: string[]
  homeFriendly: boolean
}

/** The body parts the app's plan form opens the picker with (workoutsPlans/form/Form.tsx) */
export const PICKER_BODY_PARTS = [
  'neck', 'lower arms', 'shoulders', 'cardio', 'upper arms', 'chest', 'lower legs', 'back', 'upper legs', 'waist',
] as const

export const PARTS_HE: Record<string, string> = {
  neck: 'צוואר', chest: 'חזה', shoulders: 'כתפיים', 'upper arms': 'ידיים', 'lower arms': 'אמות',
  waist: 'בטן', 'upper legs': 'רגל', 'lower legs': 'שוק', glutes: 'ישבן', back: 'גב', general: 'כללי', cardio: 'אירובי',
}

const LIMIT = 30

type Row = Partial<PickerExercise> & { exerciseId: string }

const normalize = (r: Row): PickerExercise => ({
  exerciseId: r.exerciseId,
  name: r.name ?? '',
  name_he: r.name_he ?? r.name ?? '',
  imageUrls: r.imageUrls ?? [],
  videoUrl: r.videoUrl ?? null,
  targetMuscles: r.targetMuscles ?? [],
  targetMuscles_he: r.targetMuscles_he ?? [],
  bodyParts: r.bodyParts ?? [],
  bodyParts_he: r.bodyParts_he ?? [],
  subBodyParts: r.subBodyParts ?? [],
  subBodyParts_he: r.subBodyParts_he ?? [],
  equipments_he: r.equipments_he ?? [],
  instructions_he: r.instructions_he ?? [],
  input_fields: r.input_fields ?? [],
  homeFriendly: !!r.homeFriendly,
})

/** Catalog exercises of the given body parts, 30 per page, in the app's sort order */
export function useCatalogExercises(parts: string[], enabled = true) {
  const sorted = [...parts].sort()
  return useInfiniteQuery({
    queryKey: ['bb', 'picker', 'list', sorted],
    enabled: enabled && parts.length > 0,
    initialPageParam: 1,
    staleTime: Infinity,
    queryFn: async ({ pageParam }) => {
      const from = ((pageParam as number) - 1) * LIMIT
      const { data, error } = await bb()
        .from('exercises_v2')
        .select('*')
        .overlaps('bodyParts', parts)
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .range(from, from + LIMIT - 1)
      if (error) throw error
      return ((data ?? []) as Row[]).map(normalize)
    },
    getNextPageParam: (last, all) => (last.length < LIMIT ? undefined : all.length + 1),
  })
}

interface CustomRow {
  id: string
  name: string
  body_part: string
  target_muscle: string | null
  equipment: string | null
  home_friendly: boolean | null
  instructions: string[] | null
  image_urls: string[] | null
  input_fields: Exercise['input_fields'] | null
}

/** types/customExercise.ts CUSTOM_EQUIPMENT_OPTIONS */
const EQUIPMENT_HE: Record<string, string> = {
  'body weight': 'משקל גוף', dumbbell: 'דמבל', barbell: 'מוט ברזל', 'EZ bar': 'מוט EZ', 'cable machine': 'מכבל',
  machine: 'מכונה', bench: 'ספסל', 'incline bench': 'ספסל משופע', 'decline bench': 'ספסל שיפוע הפוך',
  'preacher bench': 'ספסל פריצ׳ר', 'squat rack': 'מתקן סקוואט', 'pull-up bar': 'מתח', 'dip station': 'מתקן מקבילים',
  "captain's chair": 'כיסא קפטן', rope: 'חבל', 'V-bar': 'ידית V', 'weight plate': 'דיסקית משקל', 'ab wheel': 'גלגל בטן',
}

const subFullLabel =(key: string) => {
  for (const part of MUSCLE_PARTS) {
    if (part.key === key) return part.label
    const sub = part.subs.find((s) => s.key === key)
    if (sub) return sub.fullLabel
  }
  return undefined
}

/** The user's own active exercises (customExercisesService.getUserCustomExercises) */
export function useUserCustomExercises() {
  const uid = useBbUserId()
  return useQuery({
    queryKey: ['bb', 'picker', 'custom', uid],
    enabled: !!uid,
    queryFn: async (): Promise<PickerExercise[]> => {
      const { data, error } = await bb()
        .from('user_custom_exercises')
        .select('*')
        .eq('user_id', uid!)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return ((data ?? []) as CustomRow[]).map((r) => ({
        exerciseId: CUSTOM_PREFIX + r.id,
        name: r.name,
        name_he: r.name,
        imageUrls: r.image_urls ?? [],
        videoUrl: null,
        targetMuscles: r.target_muscle ? [r.target_muscle] : [],
        targetMuscles_he: r.target_muscle ? [subFullLabel(r.target_muscle) ?? r.target_muscle] : [],
        bodyParts: [r.body_part],
        bodyParts_he: [PARTS_HE[r.body_part] ?? r.body_part],
        subBodyParts: [],
        subBodyParts_he: [],
        equipments_he: r.equipment ? [EQUIPMENT_HE[r.equipment] ?? r.equipment] : [],
        instructions_he: r.instructions ?? [],
        input_fields: r.input_fields ?? [],
        homeFriendly: !!r.home_friendly,
      }))
    },
  })
}

/** Cloudinary thumbnail (utils/cloudinaryImage.ts) — signed and non-Cloudinary URLs pass through */
export function thumbnailUrl(url: string | undefined, width: number) {
  if (!url) return undefined
  const marker = '/upload/'
  const i = url.indexOf(marker)
  if (!url.includes('res.cloudinary.com') || i === -1 || url.includes('/s--')) return url
  const at = i + marker.length
  return `${url.slice(0, at)}f_auto,q_auto,w_${width}/${url.slice(at)}`
}
