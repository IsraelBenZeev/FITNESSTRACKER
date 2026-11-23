import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBbUserId } from '../nutrition/hooks'
import { triggerFeedback } from '../../store/uiStore'
import * as api from './api'
import type { ExerciseSet, Plan, Session } from './types'

export const wkKeys = {
  all: ['bb', 'wk'] as const,
  plans: (uid?: string) => ['bb', 'wk', 'plans', uid] as const,
  plan: (id?: string) => ['bb', 'wk', 'plan', id] as const,
  exercises: (ids: string[]) => ['bb', 'wk', 'exercises', ids.join(',')] as const,
  sessions: (planId: string) => ['bb', 'wk', 'sessions', planId] as const,
  sessionSets: (id: string) => ['bb', 'wk', 'session-sets', id] as const,
  latestSets: (planId?: string) => ['bb', 'wk', 'latest-sets', planId] as const,
  stats: (uid?: string) => ['bb', 'wk', 'stats', uid] as const,
  progress: (planId: string) => ['bb', 'wk', 'progress', planId] as const,
}

export function usePlans() {
  const uid = useBbUserId()
  return useQuery({ queryKey: wkKeys.plans(uid), enabled: !!uid, queryFn: () => api.getPlans(uid!) })
}

export function usePlan(id: string | undefined) {
  return useQuery({ queryKey: wkKeys.plan(id), enabled: !!id, queryFn: () => api.getPlan(id!) })
}

export function useExercisesByIds(ids: string[]) {
  return useQuery({
    queryKey: wkKeys.exercises(ids),
    enabled: ids.length > 0,
    queryFn: () => api.getExercisesByIds(ids),
    staleTime: 10 * 60 * 1000,
  })
}

export function useWorkoutStats() {
  const uid = useBbUserId()
  return useQuery({ queryKey: wkKeys.stats(uid), enabled: !!uid, queryFn: api.getUserWorkoutStats })
}

const PAGE = 20
export function useInfiniteSessions(planId: string) {
  const uid = useBbUserId()
  return useInfiniteQuery({
    queryKey: wkKeys.sessions(planId),
    enabled: !!uid,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getSessionsPage(uid!, planId, pageParam as number, PAGE),
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length + 1 : undefined),
  })
}

export function useSessionSets(sessionId: string) {
  return useQuery({ queryKey: wkKeys.sessionSets(sessionId), enabled: !!sessionId, queryFn: () => api.getSessionSets(sessionId) })
}

export function useLatestPlanSets(planId: string | undefined) {
  const uid = useBbUserId()
  return useQuery({
    queryKey: wkKeys.latestSets(planId),
    enabled: !!uid && !!planId,
    staleTime: Infinity,
    queryFn: () => api.getLatestPlanSets(uid!, planId!),
  })
}

export function usePlanProgress(planId: string) {
  return useQuery({ queryKey: wkKeys.progress(planId), queryFn: () => api.getPlanProgress(planId) })
}

function useInvalidateWorkouts() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: wkKeys.all })
}

export function useArchivePlan() {
  const uid = useBbUserId()
  const invalidate = useInvalidateWorkouts()
  return useMutation({
    mutationFn: (id: string) => api.setPlanActive(id, uid!, false),
    onSuccess: () => { invalidate(); triggerFeedback('התוכנית הועברה לארכיון', 'success') },
  })
}

export function useDeletePlanForever() {
  const uid = useBbUserId()
  const invalidate = useInvalidateWorkouts()
  return useMutation({
    mutationFn: (id: string) => api.deletePlan(id, uid!),
    onSuccess: () => { invalidate(); triggerFeedback('התוכנית נמחקה', 'success') },
  })
}

export function useDuplicatePlan() {
  const invalidate = useInvalidateWorkouts()
  return useMutation({
    mutationFn: (plan: Plan) => api.duplicatePlan(plan),
    onSuccess: () => { invalidate(); triggerFeedback('שוכפל בהצלחה', 'success') },
  })
}

export function useSaveWorkoutSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ session, sets }: { session: Session; sets: Omit<ExerciseSet, 'id' | 'created_at'>[] }) =>
      api.saveWorkoutSession(session, sets),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: wkKeys.all })
      // Old screens (Today / exports) read workouts under this key
      qc.invalidateQueries({ queryKey: ['bb', 'workout'] })
    },
  })
}

export function useArchivedPlans() {
  const uid = useBbUserId()
  return useQuery({ queryKey: ['bb', 'wk', 'archived', uid], enabled: !!uid, queryFn: () => api.getArchivedPlans(uid!) })
}

export function useRestorePlan() {
  const uid = useBbUserId()
  const invalidate = useInvalidateWorkouts()
  return useMutation({
    mutationFn: (id: string) => api.setPlanActive(id, uid!, true),
    onSuccess: () => { invalidate(); triggerFeedback('התוכנית שוחזרה', 'success') },
  })
}
