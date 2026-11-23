import { LogIn } from 'lucide-react'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import { BodyBuddyLogo } from '../../shared/components/BodyBuddyLogo'

/** Sign-in with the BodyBuddy account — all data (nutrition, workouts, body stats) lives there */
export function LoginPage() {
  const { connect, configured } = useBodyBuddyAuth()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-bg p-6">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <BodyBuddyLogo className="h-[186px] w-[160px]" />
        <span className="font-body text-sm text-muted">התחבר עם חשבון ה-BodyBuddy שלך</span>
      </div>

      {configured ? (
        <button
          type="button"
          onClick={() => void connect()}
          className="flex h-14 w-full max-w-[320px] items-center justify-center gap-2.5 rounded-2xl bg-accent font-body text-base font-bold text-bg transition-transform duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <LogIn size={18} strokeWidth={2.5} aria-hidden />
          המשך עם Google
        </button>
      ) : (
        <p className="max-w-[320px] text-center font-body text-sm text-danger">
          חסרות הגדרות BodyBuddy (VITE_BODYBUDDY_SUPABASE_URL / _ANON_KEY).
        </p>
      )}
    </div>
  )
}
