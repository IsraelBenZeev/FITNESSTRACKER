import { useState } from 'react'

const DRAFT_KEY = 'ft_plan_draft'

interface DraftInfo {
  name: string
  exerciseCount: number
}

export function usePlanDraft() {
  const [draft] = useState<DraftInfo | null>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      const d = JSON.parse(raw)
      if (!d.name && !(d.exercises?.length > 0)) return null
      return { name: d.name ?? '', exerciseCount: d.exercises?.length ?? 0 }
    } catch {
      return null
    }
  })

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
  }

  return { draft, clearDraft }
}
