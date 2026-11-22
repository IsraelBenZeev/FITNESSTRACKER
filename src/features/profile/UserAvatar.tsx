import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

function initials(name: string | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  lg: 'h-16 w-16 text-xl',
}

/** Google photo, or initials when there is none (or it fails to load) */
export function UserAvatar({ user, size = 'sm' }: { user: User | null; size?: keyof typeof SIZES }) {
  const [failed, setFailed] = useState(false)
  const url = user?.user_metadata?.avatar_url as string | undefined
  const name = user?.user_metadata?.full_name as string | undefined

  if (url && !failed) {
    return <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${SIZES[size]} flex-shrink-0 rounded-full object-cover ring-1 ring-border-col`} />
  }
  return (
    <span aria-hidden className={`${SIZES[size]} flex flex-shrink-0 select-none items-center justify-center rounded-full border border-accent-line bg-accent-soft font-body font-semibold text-accent`}>
      {initials(name)}
    </span>
  )
}
