import { useState } from 'react'
import { Flame, LogIn, LogOut, RefreshCw } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { useStreak } from '../../features/today/useStreak'
import { useAuth } from '../../lib/AuthContext'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import { Modal } from './Modal'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function getInitials(name: string | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

/**
 * Two Google sign-ins, one per backend:
 * FitnessTracker (workouts, goals) and BodyBuddy (nutrition, body stats).
 * The header always shows which of them this device is connected to.
 */
export function Header() {
  const streak = useStreak()
  const { user } = useAuth()
  const { bbUser } = useBodyBuddyAuth()
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const fullName = user?.user_metadata?.full_name as string | undefined

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border-col bg-bg/85 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] backdrop-blur-md">
        <span className="font-display text-2xl leading-none tracking-[0.05em] text-accent">FITNESS</span>

        <div className="flex min-w-0 items-center gap-3">
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 py-0.5 pe-2.5 ps-2" aria-label={`רצף ${streak} ימים`}>
              <Flame size={13} strokeWidth={2} className="text-orange-500" aria-hidden />
              <span className="font-display text-[15px] leading-none tracking-wide text-orange-500">{streak}</span>
            </span>
          )}

          <span className="truncate font-body text-[13px] text-muted">
            {new Date().toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })}
          </span>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`חשבונות מחוברים: FitnessTracker ${user ? 'מחובר' : 'לא מחובר'}, BodyBuddy ${bbUser ? 'מחובר' : 'לא מחובר'}`}
            className={`flex h-9 items-center gap-2 rounded-full border border-border-col bg-surface pe-1 ps-2.5 transition-colors duration-150 hover:border-subtle ${focusRing}`}
          >
            <StatusDot label="FT" ok={!!user} />
            <StatusDot label="BB" ok={!!bbUser} />
            {avatarUrl && !imgError ? (
              <img src={avatarUrl} alt="" onError={() => setImgError(true)} className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <span className="flex h-7 w-7 select-none items-center justify-center rounded-full border border-subtle bg-surface2 font-body text-[11px] font-semibold text-accent">
                {getInitials(fullName)}
              </span>
            )}
          </button>
        </div>
      </header>

      <AccountsSheet isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}

function StatusDot({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className="flex items-center gap-1 font-body text-xs font-medium text-text-col">
      <span aria-hidden className={`h-2 w-2 rounded-full ${ok ? 'bg-accent' : 'bg-danger'}`} />
      {label}
    </span>
  )
}

function AccountsSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth()
  const { bbUser, connect, disconnect, configured } = useBodyBuddyAuth()
  const sameAccount = !!user?.email && !!bbUser?.email && user.email.toLowerCase() === bbUser.email.toLowerCase()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="חשבונות מחוברים">
      <div className="flex flex-col gap-3">
        <AccountCard
          name="FitnessTracker"
          purpose="אימונים ויעדים"
          account={user}
          actions={
            <ActionButton onClick={() => { onClose(); void signOut() }} icon={<LogOut size={15} strokeWidth={2} />} danger>
              התנתק
            </ActionButton>
          }
        />
        <AccountCard
          name="BodyBuddy"
          purpose="תזונה, מאכלים ושקילות — אותם נתונים כמו באפליקציה"
          account={bbUser}
          actions={
            !configured ? (
              <span className="font-body text-xs text-danger">חסרות הגדרות BodyBuddy</span>
            ) : bbUser ? (
              <>
                <ActionButton onClick={() => void disconnect().then(connect)} icon={<RefreshCw size={15} strokeWidth={2} />}>החלף חשבון</ActionButton>
                <ActionButton onClick={() => void disconnect()} icon={<LogOut size={15} strokeWidth={2} />} danger>התנתק</ActionButton>
              </>
            ) : (
              <ActionButton onClick={() => void connect()} icon={<LogIn size={15} strokeWidth={2} />} primary>התחבר עם Google</ActionButton>
            )
          }
        />
        {user && bbUser && (
          <p className={`font-body text-sm ${sameAccount ? 'text-muted' : 'text-danger'}`}>
            {sameAccount ? 'שני החיבורים הם לאותו חשבון Google.' : 'שים לב: החיבורים הם לשני חשבונות Google שונים.'}
          </p>
        )}
      </div>
    </Modal>
  )
}

function AccountCard({ name, purpose, account, actions }: { name: string; purpose: string; account: User | null; actions: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border-col bg-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="font-body text-base font-semibold text-heading">{name}</h3>
          <p className="font-body text-xs text-muted">{purpose}</p>
        </div>
        <span className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-xs ${account ? 'bg-accent-soft text-accent' : 'bg-danger/10 text-danger'}`}>
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${account ? 'bg-accent' : 'bg-danger'}`} />
          {account ? 'מחובר' : 'לא מחובר'}
        </span>
      </div>
      {account?.email && (
        <p className="truncate font-body text-sm text-text-col" dir="ltr">{account.email}</p>
      )}
      <div className="flex flex-wrap gap-2">{actions}</div>
    </section>
  )
}

function ActionButton({ onClick, icon, children, danger, primary }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode; danger?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 items-center gap-1.5 rounded-xl px-3.5 font-body text-sm transition-colors duration-150 ${focusRing}
        ${primary ? 'bg-accent font-semibold text-bg' : danger ? 'border border-danger/40 text-danger hover:bg-danger/10' : 'border border-border-col text-text-col hover:border-subtle'}`}
    >
      {icon}
      {children}
    </button>
  )
}
