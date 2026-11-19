import { useMemo } from 'react'
import { todayLocal, daysAgoLocal, toLocalDateStr } from '../../lib/date'
import { useEntryDates } from '../nutrition/hooks'

/** מחזיר את מספר הימים הרצופים שנרשמה בהם תזונה (כולל היום אם נרשם) */
export function useStreak(): number {
  const { data } = useEntryDates()

  return useMemo(() => {
    const uniqueDays = [...new Set(data ?? [])].sort((a, b) => b.localeCompare(a))
    if (uniqueDays.length === 0) return 0

    // The streak is alive if the latest logged day is today or yesterday
    if (uniqueDays[0] !== todayLocal() && uniqueDays[0] !== daysAgoLocal(1)) return 0

    let streak = 0
    // Walk back one local calendar day at a time (noon avoids DST edge cases)
    const cursor = new Date(uniqueDays[0] + 'T12:00:00')
    for (const day of uniqueDays) {
      if (day !== toLocalDateStr(cursor)) break
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }, [data])
}
