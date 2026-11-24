/**
 * Forgot password, choose a new password, and email confirmation —
 * ForgotPasswordScreen / ResetPasswordScreen / ConfirmSignupScreen from BodyBuddy-Client.
 * The emailed links land here with `?token_hash=…`; verifying it signs the user in.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Lock, LogIn, Mail, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { ActionButton } from '../workouts/ui/primitives'
import { triggerFeedback } from '../../store/uiStore'
import { AuthPage, EmailField, TextField } from './ui'
import { EMAIL_RE, completePasswordRecovery, completeSignupConfirmation, sendPasswordRecoveryEmail, signOut, updatePassword } from './authService'

function Verifying({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
      <Loader2 size={40} className="animate-spin text-lime-300" aria-hidden />
      <p className="typo-body text-background-400">{label}</p>
    </div>
  )
}

function BackToLogin() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/auth/login', { replace: true })}
      className="typo-body mx-auto mt-8 min-h-[44px] px-3 font-semibold text-lime-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
    >
      חזרה להתחברות
    </button>
  )
}

// ---------- /auth/forgot-password ----------

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { control, handleSubmit } = useForm<{ email: string }>({ defaultValues: { email: params.get('email') ?? '' } })

  const onSubmit = async ({ email }: { email: string }) => {
    setLoading(true)
    const { error } = await sendPasswordRecoveryEmail(email.trim())
    setLoading(false)
    if (error) {
      triggerFeedback('לא הצלחנו לשלוח קישור לאיפוס סיסמה. נסה שוב.', 'failed')
      return
    }
    setSent(true)
    triggerFeedback('אם קיים חשבון עם כתובת זו, נשלח אליו קישור לאיפוס סיסמה.', 'success')
  }

  return (
    <AuthPage subtitle="איפוס סיסמה">
      {sent ? (
        <div className="flex flex-col items-center gap-6">
          <p className="typo-body text-center leading-6 text-background-400">בדוק את תיבת הדואר שלך. הקישור יאפשר לך לבחור סיסמה חדשה.</p>
          <ActionButton onPress={() => navigate('/auth/login', { replace: true })} label="חזרה להתחברות" icon={LogIn} variant="primary" size="md" fullWidth />
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <p className="typo-body mb-8 text-center leading-6 text-background-400">הזן את כתובת המייל שלך ונשלח קישור לאיפוס הסיסמה.</p>
          <EmailField control={control} name="email" className="mb-6" rules={{ required: 'אימייל חובה', pattern: { value: EMAIL_RE, message: 'אימייל לא תקין' } }} />
          <ActionButton type="submit" onPress={() => {}} label="שלח קישור לאיפוס" icon={Mail} variant="primary" size="md" fullWidth loading={loading} />
        </form>
      )}
      <BackToLogin />
    </AuthPage>
  )
}

// ---------- /auth/reset-password?token_hash=… ----------

interface ResetForm { password: string; confirmPassword: string }

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tokenHash = params.get('token_hash')
  const [verifying, setVerifying] = useState(true)
  const [valid, setValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const started = useRef(false)
  const { control, handleSubmit, watch } = useForm<ResetForm>({ defaultValues: { password: '', confirmPassword: '' } })
  const password = watch('password')

  useEffect(() => {
    // A token is single-use: StrictMode's second effect run must not verify it again
    if (started.current) return
    started.current = true
    if (!tokenHash) {
      setVerifying(false)
      return
    }
    void completePasswordRecovery(tokenHash).then(({ error }) => {
      setValid(!error)
      setVerifying(false)
      if (error) triggerFeedback('קישור האיפוס אינו תקין או שפג תוקפו.', 'failed')
    })
  }, [tokenHash])

  const onSubmit = async ({ password: next }: ResetForm) => {
    setLoading(true)
    const { error } = await updatePassword(next)
    if (error) {
      setLoading(false)
      triggerFeedback('לא הצלחנו לעדכן את הסיסמה. בקש קישור חדש ונסה שוב.', 'failed')
      return
    }
    // Like the app: back to sign-in with the new password
    await signOut()
    setLoading(false)
    triggerFeedback('הסיסמה עודכנה בהצלחה. אפשר להתחבר מחדש.', 'success')
    navigate('/auth/login', { replace: true })
  }

  return (
    <AuthPage subtitle="בחירת סיסמה חדשה">
      {verifying ? (
        <Verifying label="מאמתים את קישור האיפוס..." />
      ) : valid ? (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <TextField control={control} name="password" label="סיסמה חדשה" placeholder="••••••••" autoComplete="new-password" password rules={{ required: 'סיסמה חובה', minLength: { value: 6, message: 'לפחות 6 תווים' } }} />
          <TextField
            control={control}
            name="confirmPassword"
            label="אימות סיסמה חדשה"
            placeholder="••••••••"
            autoComplete="new-password"
            password
            className="mb-6"
            rules={{ required: 'אימות סיסמה חובה', validate: (v) => v === password || 'הסיסמאות לא תואמות' }}
          />
          <ActionButton type="submit" onPress={() => {}} label="עדכן סיסמה" icon={Lock} variant="primary" size="md" fullWidth loading={loading} />
        </form>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <p className="typo-body text-center leading-6 text-background-400">הקישור לא זמין יותר. בקש קישור איפוס חדש כדי להמשיך.</p>
          <ActionButton onPress={() => navigate('/auth/forgot-password', { replace: true })} label="בקשת קישור חדש" icon={Mail} variant="primary" size="md" fullWidth />
        </div>
      )}
    </AuthPage>
  )
}

// ---------- /auth/confirm-signup?token_hash=… ----------

export function ConfirmSignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tokenHash = params.get('token_hash')
  const [verifying, setVerifying] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!tokenHash) {
      setVerifying(false)
      return
    }
    void completeSignupConfirmation(tokenHash).then(({ error }) => {
      setConfirmed(!error)
      setVerifying(false)
      if (error) {
        triggerFeedback('קישור האימות אינו תקין או שפג תוקפו.', 'failed')
        return
      }
      // Verified and signed in — into the app
      triggerFeedback('כתובת המייל אומתה בהצלחה!', 'success')
      navigate('/today', { replace: true })
    })
  }, [tokenHash, navigate])

  return (
    <AuthPage subtitle="אימות כתובת מייל">
      {verifying ? (
        <Verifying label="מאמתים את כתובת המייל..." />
      ) : !confirmed ? (
        <div className="flex flex-col items-center gap-6">
          <p className="typo-body text-center leading-6 text-background-400">קישור האימות אינו תקין או שפג תוקפו. אפשר לנסות להירשם שוב.</p>
          <ActionButton onPress={() => navigate('/auth/signup', { replace: true })} label="חזרה להרשמה" icon={UserPlus} variant="primary" size="md" fullWidth />
        </div>
      ) : (
        <Verifying label="נכנסים לחשבון..." />
      )}
    </AuthPage>
  )
}
