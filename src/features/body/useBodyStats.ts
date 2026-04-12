import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { BodyStat } from '../../types/body'

interface UseBodyStatsResult {
  stats: BodyStat[]
  latest: BodyStat | null
  loading: boolean
  error: string | null
}

export function useBodyStats(): UseBodyStatsResult {
  const { data: stats = [], isLoading, error } = useQuery({
    queryKey: ['body-stats'],
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

  return { stats, latest, loading: isLoading, error: error ? (error as Error).message : null }
}
