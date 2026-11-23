import { useNavigate, useLocation } from 'react-router-dom'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import { UserAvatar } from '../../features/profile/UserAvatar'
import { BodyBuddyLockup } from './BodyBuddyLogo'

/** Logo, and the user (photo + first name) — tap to open the user screen. */
export function Header() {
  const { bbUser } = useBodyBuddyAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const person = bbUser
  const fullName = (person?.user_metadata?.full_name as string | undefined) ?? ''
  const firstName = fullName.trim().split(/\s+/)[0] || 'הפרופיל שלי'
  const onProfile = pathname.startsWith('/profile')

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border-col bg-bg/85 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] backdrop-blur-md">
      <BodyBuddyLockup />

      <button
        type="button"
        onClick={() => navigate(onProfile ? '/today' : '/profile')}
        aria-label={onProfile ? 'חזרה להיום' : `מסך המשתמש של ${fullName || 'המשתמש'}`}
        aria-current={onProfile ? 'page' : undefined}
        className={`-me-1 flex h-11 min-w-0 items-center gap-2.5 rounded-full py-1 pe-1 ps-3 transition-colors duration-150 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${onProfile ? 'bg-surface' : ''}`}
      >
        <span className="truncate font-body text-sm font-medium text-text-col">{firstName}</span>
        <UserAvatar user={person} />
      </button>
    </header>
  )
}
