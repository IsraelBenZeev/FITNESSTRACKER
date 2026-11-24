/** app/exercises/[parts].tsx — the exercises of the areas picked on the avatar (mode 'view') */
import { useMemo } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ExercisesListScreen } from '../workouts/picker/ExercisePicker'
import { partsBodyHebrew, type BodyPart } from './avatar/types'

export function ExercisesListPage() {
  const [params] = useSearchParams()
  const raw = params.get('parts')
  const parts = useMemo(() => {
    try {
      const list = JSON.parse(raw ?? '[]') as unknown
      return Array.isArray(list) ? list.filter((p): p is BodyPart => typeof p === 'string' && p in partsBodyHebrew) : []
    } catch {
      return []
    }
  }, [raw])
  if (parts.length === 0) return <Navigate to="/exercises" replace />
  return <ExercisesListScreen parts={parts} />
}
