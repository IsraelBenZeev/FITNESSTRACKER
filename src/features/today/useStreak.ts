import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { todayLocal, daysAgoLocal, toLocalDateStr } from '../../lib/date'
import { fetchAllRows } from '../../lib/fetchAllRows'

/** מחזיר את מספר הימים הרצופים שנוסף לוג תזונה (כולל היום אם הוגדר) */
export function useStreak(): number {
  const { user } = useAuth()
  const userId = user?.id

  const { data = 0 } = useQuery({
    queryKey: ['nutrition', 'streak', userId],
    enabled: !!userId,
    queryFn: async () => {
      // All rows: a long streak spans more than the 1,000-row response cap
      const data = await fetchAllRows<{ date: string }>((from, to) =>
        supabase
          .from('nutrition_log')
          .select('date')
          .order('date', { ascending: false })
          .order('id', { ascending: true })
          .range(from, to),
      )

      // ימים ייחודיים, ממוינים מהחדש לישן
      const uniqueDays = [...new Set<string>((data ?? []).map((r: { date: string }) => r.date))].sort(
        (a, b) => b.localeCompare(a)
      )

      if (uniqueDays.length === 0) return 0

      const today = todayLocal()
      const yesterday = daysAgoLocal(1)
      // The streak is alive if the latest logged day is today or yesterday
      if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0

      let streak = 0
      // Walk back one local calendar day at a time (noon avoids DST edge cases)
      const cursor = new Date(uniqueDays[0] + 'T12:00:00')

      for (const day of uniqueDays) {
        if (day !== toLocalDateStr(cursor)) break
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }

      return streak
    },
    staleTime: 5 * 60 * 1000,
  })

  return data
}
