import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

/** מחזיר את מספר הימים הרצופים שנוסף לוג תזונה (כולל היום אם הוגדר) */
export function useStreak(): number {
  const { data = 0 } = useQuery({
    queryKey: ['nutrition', 'streak'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_log')
        .select('date')
        .order('date', { ascending: false })
      if (error) throw new Error(error.message)

      // ימים ייחודיים, ממוינים מהחדש לישן
      const uniqueDays = [...new Set((data ?? []).map((r: { date: string }) => r.date))].sort(
        (a, b) => b.localeCompare(a)
      )

      if (uniqueDays.length === 0) return 0

      const today = todayDateString()
      // מתחילים מהיום או מאתמול
      const startDate = uniqueDays[0] === today ? today : (() => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return yesterday.toISOString().split('T')[0] ?? ''
      })()

      if (uniqueDays[0] !== today && uniqueDays[0] !== startDate) return 0

      let streak = 0
      let cursor = new Date(startDate + 'T00:00:00')

      for (const day of uniqueDays) {
        const expected = cursor.toISOString().split('T')[0]
        if (day === expected) {
          streak++
          cursor.setDate(cursor.getDate() - 1)
        } else {
          break
        }
      }

      return streak
    },
    staleTime: 5 * 60 * 1000,
  })

  return data
}
