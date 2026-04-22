import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { getCurrentUserId } from '../../lib/auth-helpers'
import { useToast } from '../../shared/context/ToastContext'
import type { WorkoutLog, WorkoutSetLog } from '../../types/workout'

export function useTodayWorkoutLog() {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]!

  return useQuery({
    queryKey: ['workout', 'logs', 'today', user?.id, today],
    enabled: !!user?.id,
    queryFn: async (): Promise<WorkoutLog[]> => {
      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('date', today)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      if (!logs?.length) return []

      const logIds = logs.map((l) => l.id)
      const { data: sets, error: setErr } = await supabase
        .from('workout_set_logs')
        .select('*')
        .in('workout_log_id', logIds)
        .order('set_number', { ascending: true })
      if (setErr) throw new Error(setErr.message)

      return logs.map((log) => ({
        ...log,
        set_logs: (sets ?? []).filter(
          (s: WorkoutSetLog) => s.workout_log_id === log.id
        ),
      })) as WorkoutLog[]
    },
  })
}

interface SetPayload {
  exercise_id: string
  exercise_name: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  notes: string | null
}

interface LogWorkoutPayload {
  date: string
  workout_plan_id: string | null
  notes: string
  sets: SetPayload[]
}

export function useWorkoutHistory() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['workout', 'logs', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WorkoutLog[]> => {
      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)
      if (error) throw new Error(error.message)

      const logIds = (logs ?? []).map((l) => l.id)
      if (logIds.length === 0) return []

      const { data: setLogs, error: setErr } = await supabase
        .from('workout_set_logs')
        .select('*')
        .in('workout_log_id', logIds)
        .order('set_number', { ascending: true })
      if (setErr) throw new Error(setErr.message)

      return (logs ?? []).map((log) => ({
        ...log,
        set_logs: (setLogs ?? []).filter(
          (s: WorkoutSetLog) => s.workout_log_id === log.id
        ),
      })) as WorkoutLog[]
    },
  })
}

export function useDeleteWorkoutLog() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  return useMutation({
    mutationFn: async (logId: string) => {
      const { error: setErr } = await supabase
        .from('workout_set_logs')
        .delete()
        .eq('workout_log_id', logId)
      if (setErr) throw new Error(setErr.message)

      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', logId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'logs'] })
      showSuccess('האימון נמחק')
    },
    onError: () => {
      showError('שגיאה במחיקת האימון')
    },
  })
}

export function useLogWorkout() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  return useMutation({
    mutationFn: async (payload: LogWorkoutPayload) => {
      const { data: log, error } = await supabase
        .from('workout_logs')
        .insert({
          date: payload.date,
          workout_plan_id: payload.workout_plan_id,
          notes: payload.notes || null,
          user_id: await getCurrentUserId(),
        })
        .select()
        .single()
      if (error) throw new Error(error.message)

      if (payload.sets.length > 0) {
        const rows = payload.sets.map((s) => ({
          ...s,
          workout_log_id: log.id,
        }))
        const { error: setErr } = await supabase
          .from('workout_set_logs')
          .insert(rows)
        if (setErr) throw new Error(setErr.message)
      }
      return log
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'logs'] })
      showSuccess('האימון נשמר בהצלחה')
    },
    onError: () => {
      showError('שגיאה בשמירת האימון')
    },
  })
}
