import { useQuery } from '@tanstack/react-query'
import { bb } from '../../lib/supabaseBodyBuddy'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import type { BodyStat } from '../../types/body'
import { todayLocal } from '../../lib/date'
import { fetchAllRows } from '../../lib/fetchAllRows'

interface UseBodyStatsResult {
  stats: BodyStat[]
  latest: BodyStat | null
  todayStat: BodyStat | null
  loading: boolean
  error: string | null
}

/** Body stats from BodyBuddy (same table the app uses), for the connected BodyBuddy user */
export function useBodyStats(): UseBodyStatsResult {
  const { bbUser } = useBodyBuddyAuth()
  const userId = bbUser?.id

  const { data: stats = [], isLoading, error } = useQuery({
    queryKey: ['bb', 'body-stats', userId],
    enabled: !!userId,
    queryFn: async () =>
      fetchAllRows<BodyStat>((from, to) =>
        bb()
          .from('body_stats')
          .select('id, date, weight_kg, waist_cm, notes, created_at')
          .eq('user_id', userId!)
          .order('date', { ascending: true })
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to),
      ).then((rows) =>
        rows.map((r) => ({ ...r, weight_kg: r.weight_kg == null ? null : Number(r.weight_kg), waist_cm: r.waist_cm == null ? null : Number(r.waist_cm) })),
      ),
  })

  const latest = stats.length > 0 ? stats[stats.length - 1] ?? null : null
  const todayStat = stats.find((s) => s.date === todayLocal()) ?? null

  return { stats, latest, todayStat, loading: isLoading, error: error ? (error as Error).message : null }
}
