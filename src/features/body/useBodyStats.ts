import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import type { BodyStat } from '../../types/body'

interface UseBodyStatsResult {
  stats: BodyStat[]
  latest: BodyStat | null
  todayStat: BodyStat | null
  loading: boolean
  error: string | null
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

export function useBodyStats(): UseBodyStatsResult {
  const { user } = useAuth()
  const userId = user?.id

  const { data: stats = [], isLoading, error } = useQuery({
    queryKey: ['body-stats', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('body_stats')
        .select('*')
        .order('date', { ascending: true })
      if (err) throw new Error(err.message)
      return (data ?? []) as BodyStat[]
    },
  })

  const latest = stats.length > 0 ? stats[stats.length - 1] ?? null : null
  const todayStat = stats.find((s) => s.date === todayDateString()) ?? null

  return { stats, latest, todayStat, loading: isLoading, error: error ? (error as Error).message : null }
}
