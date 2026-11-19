import { AlertTriangle, Link2, LogIn } from 'lucide-react'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import { useAuth } from '../../lib/AuthContext'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * Nutrition and body stats are stored in BodyBuddy. Until this device is connected
 * to the BodyBuddy account, pages that need it show this card instead.
 */
export function ConnectBodyBuddy({ what }: { what: string }) {
  const { configured, connect } = useBodyBuddyAuth()

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-col bg-surface px-5 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Link2 size={22} strokeWidth={2} aria-hidden />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-body text-lg font-semibold text-heading">חיבור ל-BodyBuddy</h2>
        <p className="font-body text-sm leading-relaxed text-muted [text-wrap:balance]">
          {what} נשמרים עכשיו בחשבון ה-BodyBuddy שלך. צריך להתחבר פעם אחת במכשיר הזה, עם אותו חשבון Google.
        </p>
      </div>
      {configured ? (
        <button
          type="button"
          onClick={() => void connect()}
          className={`flex h-12 w-full max-w-[320px] items-center justify-center gap-2 rounded-2xl bg-accent font-body text-base font-semibold text-bg transition-transform duration-150 active:scale-[0.98] ${focusRing}`}
        >
          <LogIn size={18} strokeWidth={2.5} aria-hidden />
          התחבר ל-BodyBuddy עם Google
        </button>
      ) : (
        <p className="font-body text-sm text-danger">חסרות הגדרות BodyBuddy באפליקציה (משתני סביבה).</p>
      )}
    </div>
  )
}

/** Renders the page only when this device is connected to BodyBuddy */
export function RequireBodyBuddy({ what, children }: { what: string; children: React.ReactNode }) {
  const { bbUser, bbLoading } = useBodyBuddyAuth()
  if (bbLoading) return <p className="px-4 py-10 text-center font-body text-sm text-muted" aria-busy="true">טוען…</p>
  if (!bbUser) {
    return (
      <div className="px-4 pt-6">
        <ConnectBodyBuddy what={what} />
      </div>
    )
  }
  return <>{children}</>
}

/** Warns when the BodyBuddy account is not the same Google account as FitnessTracker */
export function AccountMismatchBanner() {
  const { user } = useAuth()
  const { bbUser, disconnect } = useBodyBuddyAuth()
  const ftEmail = user?.email?.toLowerCase()
  const bbEmail = bbUser?.email?.toLowerCase()
  if (!ftEmail || !bbEmail || ftEmail === bbEmail) return null

  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-3.5">
      <AlertTriangle size={18} strokeWidth={2} className="mt-0.5 flex-shrink-0 text-danger" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="font-body text-sm text-text-col">
          מחובר ל-BodyBuddy בחשבון אחר (<span dir="ltr">{bbUser?.email}</span>). הנתונים יישמרו שם.
        </p>
        <button type="button" onClick={() => void disconnect()} className={`self-start rounded-lg font-body text-sm font-medium text-danger underline underline-offset-2 ${focusRing}`}>
          התנתק מ-BodyBuddy
        </button>
      </div>
    </div>
  )
}
