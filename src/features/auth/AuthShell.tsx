import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, LogIn, UserPlus, type LucideIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { BodyBuddyLogo } from '../../shared/components/BodyBuddyLogo'
import { ActionButton } from '../workouts/ui/primitives'
import { triggerFeedback } from '../../store/uiStore'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import { AuthOrbBackground, EmailField, GoogleIcon, SegmentedTabs, TextField } from './ui'
import { EMAIL_RE, getSignInMethod, signInWithEmail, signUpWithEmail } from './authService'

type AuthTab = 'login' | 'register'

const TABS: { key: AuthTab; label: string }[] = [
  { key: 'login', label: 'התחברות' },
  { key: 'register', label: 'הרשמה' },
]

/**
 * Sign-in / sign-up (BodyBuddy-Client/src/Features/auth/AuthShell.tsx): logo, segmented tabs,
 * the active form in a card, then "or" and Google, shared by both tabs.
 */
export function AuthShell({ initialTab }: { initialTab: AuthTab }) {
  const navigate = useNavigate()
  const { connect, configured } = useBodyBuddyAuth()
  const [tab, setTab] = useState<AuthTab>(initialTab)
  const [googleLoading, setGoogleLoading] = useState(false)

  const changeTab = (t: AuthTab) => {
    setTab(t)
    navigate(t === 'login' ? '/auth/login' : '/auth/signup', { replace: true })
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    // Redirects to Google; the page unloads, so loading stays on until it does
    await connect()
  }

  return (
    <div className="relative min-h-dvh bg-background-1200">
      <AuthOrbBackground />
      {googleLoading && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[99] flex flex-col items-center justify-center gap-4 bg-background-1200/80">
          <Loader2 size={40} className="animate-spin text-lime-300" aria-hidden />
          <p className="typo-body text-background-400">מתחבר עם Google...</p>
        </div>
      )}

      {/* Anchored to the top (not centered), so the logo and tabs don't move when the card height changes between tabs */}
      <main className="relative mx-auto flex w-full max-w-[440px] flex-col px-5 pb-8 pt-16">
        <div className="mb-8 flex flex-col items-center">
          <BodyBuddyLogo className="h-[93px] w-[80px]" />
          <p className="typo-body mt-3 text-center text-background-400">המאמן האישי שלך בכיס</p>
        </div>

        {!configured && (
          <p role="alert" className="typo-label mb-4 text-center text-danger">חסרות הגדרות BodyBuddy (VITE_BODYBUDDY_SUPABASE_URL / _ANON_KEY)</p>
        )}

        <SegmentedTabs tabs={TABS} active={tab} onChange={changeTab} />

        <div key={tab} className="animate-[pageEnter_0.26s_ease] rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-md shadow-black">
          {tab === 'login' ? <LoginFields /> : <RegisterFields onNavigateToLogin={() => changeTab('login')} />}
        </div>

        <div className="my-5 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-white/10" />
          <span className="typo-caption text-background-400">או</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* Shared by both tabs — Google tells by itself whether the account is new or existing */}
        <ActionButton
          onPress={() => void handleGoogle()}
          label="המשך עם Google"
          icon={GoogleIcon as unknown as LucideIcon}
          variant="secondary"
          size="md"
          fullWidth
          loading={googleLoading}
          disabled={!configured}
        />
      </main>
    </div>
  )
}

// ---------- Login ----------

interface LoginForm { email: string; password: string }

function LoginFields() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { control, handleSubmit, getValues } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } })

  // Carries the typed email over, so it doesn't need typing again on the reset screen
  const goToForgot = () => {
    const email = getValues('email').trim()
    navigate(email ? `/auth/forgot-password?email=${encodeURIComponent(email)}` : '/auth/forgot-password')
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    const { error } = await signInWithEmail(data.email, data.password)
    const method = error ? await getSignInMethod(data.email) : null
    setLoading(false)
    if (error) {
      triggerFeedback(method === 'google' ? 'החשבון הזה מחובר דרך Google - התחבר עם Google' : 'שגיאה בהתחברות - בדוק את הפרטים שלך', 'failed')
      return
    }
    triggerFeedback('התחברת בהצלחה', 'success')
    // The auth state change swaps the routes; land on the app's home
    navigate('/today', { replace: true })
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <EmailField control={control} name="email" rules={{ required: 'אימייל חובה', pattern: { value: EMAIL_RE, message: 'אימייל לא תקין' } }} />
      <TextField
        control={control}
        name="password"
        label="סיסמה"
        placeholder="••••••••"
        autoComplete="current-password"
        password
        className="mb-2"
        rules={{ required: 'סיסמה חובה', minLength: { value: 6, message: 'לפחות 6 תווים' } }}
      />
      <button
        type="button"
        onClick={goToForgot}
        className="typo-body mb-6 min-h-[44px] font-semibold text-lime-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
      >
        שכחת סיסמה?
      </button>
      <ActionButton type="submit" onPress={() => {}} label="התחבר" icon={LogIn} variant="primary" size="md" fullWidth loading={loading} />
    </form>
  )
}

// ---------- Register ----------

interface RegisterForm { fullName: string; email: string; password: string; confirmPassword: string }

function RegisterFields({ onNavigateToLogin }: { onNavigateToLogin: () => void }) {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { control, handleSubmit, watch } = useForm<RegisterForm>({ defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' } })
  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    const { error } = await signUpWithEmail(data.email, data.password, data.fullName.trim())
    setLoading(false)
    if (error) {
      triggerFeedback(error.message || 'שגיאה בהרשמה - נסה שוב', 'failed')
      return
    }
    setEmailSent(true)
    triggerFeedback('נשלח מייל אימות לכתובת שהזנת.', 'success')
  }

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <p className="typo-body text-center leading-6 text-background-400">
          שלחנו אליך מייל לאימות כתובת המייל. יש ללחוץ על הקישור במייל כדי להשלים את ההרשמה.
        </p>
        <ActionButton onPress={onNavigateToLogin} label="חזרה להתחברות" icon={LogIn} variant="primary" size="md" fullWidth />
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <TextField
        control={control}
        name="fullName"
        label="שם מלא"
        placeholder="ישראל ישראלי"
        autoComplete="name"
        rules={{ required: 'שם מלא חובה', minLength: { value: 2, message: 'שם קצר מדי' } }}
      />
      <EmailField control={control} name="email" rules={{ required: 'אימייל חובה', pattern: { value: EMAIL_RE, message: 'אימייל לא תקין' } }} />
      <TextField
        control={control}
        name="password"
        label="סיסמה"
        placeholder="••••••••"
        autoComplete="new-password"
        password
        rules={{ required: 'סיסמה חובה', minLength: { value: 6, message: 'לפחות 6 תווים' } }}
      />
      <TextField
        control={control}
        name="confirmPassword"
        label="אימות סיסמה"
        placeholder="••••••••"
        autoComplete="new-password"
        password
        className="mb-6"
        rules={{ required: 'אימות סיסמה חובה', validate: (v) => v === password || 'הסיסמאות לא תואמות' }}
      />
      <ActionButton type="submit" onPress={() => {}} label="הירשם" icon={UserPlus} variant="primary" size="md" fullWidth loading={loading} />
    </form>
  )
}

/** Route wrapper: /auth/login and /auth/signup open the same shell on a different tab */
export function AuthRoute({ tab }: { tab: AuthTab }) {
  const [params] = useSearchParams()
  return <AuthShell key={tab} initialTab={params.get('tab') === 'register' ? 'register' : tab} />
}
