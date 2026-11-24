/**
 * Building blocks of the auth screens, ported from BodyBuddy-Client:
 * AuthOrbBackground, SegmentedTabs, FormInput (password with eye toggle), EmailAutocompleteInput (domain picker).
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import ReactDOM from 'react-dom'
import { Check, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { Controller, useWatch, type Control, type FieldValues, type Path, type RegisterOptions } from 'react-hook-form'
import { BodyBuddyLogo } from '../../shared/components/BodyBuddyLogo'

// ---------- Screen frame ----------

/** Slow-drifting lime orbs behind the auth card (AuthOrbBackground) */
export function AuthOrbBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <span className="absolute -right-[70px] -top-[60px] h-[220px] w-[220px] animate-[bbOrbA_5.2s_ease-in-out_infinite_alternate] rounded-full bg-gradient-to-br from-lime-500/[0.16] to-lime-500/0 motion-reduce:animate-none" />
      <span className="absolute -left-[60px] bottom-[140px] h-[170px] w-[170px] animate-[bbOrbB_6.2s_ease-in-out_infinite_alternate] rounded-full bg-gradient-to-br from-lime-700/[0.14] to-lime-700/0 motion-reduce:animate-none" />
      <span className="absolute -bottom-[40px] right-[10px] h-[130px] w-[130px] animate-[bbOrbC_4.4s_ease-in-out_infinite_alternate] rounded-full bg-gradient-to-br from-lime-300/10 to-lime-300/0 motion-reduce:animate-none" />
    </div>
  )
}

/** Single-column auth screen: logo + subtitle on top, content below (ForgotPassword / ResetPassword / ConfirmSignup) */
export function AuthPage({ subtitle, children, centered = true }: { subtitle: string; children: ReactNode; centered?: boolean }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background-1200">
      <main className={`relative mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 py-12 ${centered ? 'justify-center' : ''}`}>
        <div className="mb-12 flex flex-col items-center">
          <BodyBuddyLogo className="h-[174px] w-[150px]" />
          <h1 className="typo-body mt-4 text-center text-background-400">{subtitle}</h1>
        </div>
        {children}
      </main>
    </div>
  )
}

// ---------- SegmentedTabs ----------

export function SegmentedTabs<K extends string>({ tabs, active, onChange }: { tabs: { key: K; label: string }[]; active: K; onChange: (key: K) => void }) {
  return (
    <div role="tablist" className="mb-6 flex h-14 items-stretch rounded-full border border-white/10 bg-background-900 p-1">
      {tabs.map((t) => {
        const selected = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.key)}
            className={`typo-btn-secondary flex min-h-[44px] flex-1 items-center justify-center rounded-full border transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 ${
              selected ? 'border-lime-500/50 bg-lime-500/20 text-lime-300' : 'border-transparent text-background-400'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------- Inputs ----------

const shell = (hasError: boolean) =>
  `flex items-center gap-3 rounded-2xl border bg-background-800 px-4 transition-colors duration-150 focus-within:border-lime-500/70 ${hasError ? 'border-danger' : 'border-background-600'}`

const inputCls = 'typo-input min-w-0 flex-1 bg-transparent py-4 text-heading placeholder:text-background-400 focus:outline-none'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} role="alert" className="typo-caption mt-1 text-danger">{message}</p>
}

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  rules?: RegisterOptions<T, Path<T>>
  label: string
  placeholder?: string
  autoComplete?: string
  /** password: hidden text with an eye toggle */
  password?: boolean
  className?: string
}

/** FormInput: lime label above a rounded dark field; password fields get the eye toggle */
export function TextField<T extends FieldValues>({ control, name, rules, label, placeholder, autoComplete, password, className = 'mb-5' }: TextFieldProps<T>) {
  const id = useId()
  const [show, setShow] = useState(false)
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <div className={className}>
          <label htmlFor={id} className="typo-body-primary mb-2 block text-lime-400">{label}</label>
          <div className={shell(!!error)}>
            <input
              id={id}
              {...field}
              value={(field.value as string) ?? ''}
              type={password && !show ? 'password' : 'text'}
              placeholder={placeholder}
              autoComplete={autoComplete}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              dir={password ? 'ltr' : undefined}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-err` : undefined}
              className={`${inputCls} ${password ? 'text-right' : ''}`}
            />
            {password && (
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'הסתר סיסמה' : 'הצג סיסמה'}
                className="-me-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-background-400 transition-colors hover:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
              >
                {show ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            )}
          </div>
          <FieldError id={`${id}-err`} message={error?.message} />
        </div>
      )}
    />
  )
}

const DOMAINS = ['gmail.com', 'walla.co.il', 'outlook.com', 'hotmail.com', 'icloud.com']
const localPartOf = (v: string) => (v.includes('@') ? v.slice(0, v.indexOf('@')) : v)

/**
 * EmailAutocompleteInput: the user types only the part before "@" and picks the domain from a list;
 * typing "@" (or "כתובת אחרת...") switches to a free full address.
 */
export function EmailField<T extends FieldValues>({ control, name, rules, label = 'אימייל', className = 'mb-5' }: Omit<TextFieldProps<T>, 'password' | 'placeholder' | 'autoComplete' | 'label'> & { label?: string }) {
  const id = useId()
  const [domain, setDomain] = useState(DOMAINS[0]!)
  const [free, setFree] = useState(false)
  const [picker, setPicker] = useState(false)

  // A value set from outside (e.g. the email carried over from the login screen) picks its domain
  const watched = useWatch({ control, name }) as string | undefined
  useEffect(() => {
    if (!watched || !watched.includes('@')) return
    const d = watched.slice(watched.indexOf('@') + 1)
    if (DOMAINS.includes(d)) setDomain(d)
    else if (d) setFree(true)
  }, [watched])

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => {
        const email = (value as string) ?? ''
        const onLocal = (text: string) => {
          if (text.includes('@')) {
            setFree(true)
            onChange(text)
            return
          }
          onChange(text ? `${text}@${domain}` : '')
        }
        const pick = (d: string) => {
          setDomain(d)
          setFree(false)
          setPicker(false)
          const local = localPartOf(email)
          onChange(local ? `${local}@${d}` : '')
        }
        return (
          <div className={className}>
            <label htmlFor={id} className="typo-body-primary mb-2 block text-lime-400">{label}</label>
            <div dir="ltr" className={shell(!!error)}>
              <input
                id={id}
                ref={ref}
                type={free ? 'email' : 'text'}
                inputMode="email"
                autoComplete={free ? 'email' : 'username'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={free ? `yourmail@${domain}` : 'your mail'}
                value={free ? email : localPartOf(email)}
                onChange={(e) => (free ? onChange(e.target.value) : onLocal(e.target.value))}
                onBlur={onBlur}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-err` : undefined}
                className={inputCls}
              />
              {!free && (
                <button
                  type="button"
                  onClick={() => setPicker(true)}
                  aria-label={`הדומיין הנוכחי הוא ${domain}, לחץ כדי לבחור דומיין אחר`}
                  className="typo-input flex min-h-[44px] flex-shrink-0 items-center gap-1 text-lime-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
                >
                  @{domain}
                  <ChevronDown size={14} />
                </button>
              )}
            </div>
            <FieldError id={`${id}-err`} message={error?.message} />
            <DomainSheet
              open={picker}
              domains={DOMAINS}
              selected={free ? null : domain}
              onPick={pick}
              onOther={() => {
                setFree(true)
                setPicker(false)
              }}
              onClose={() => setPicker(false)}
            />
          </div>
        )
      }}
    />
  )
}

function DomainSheet({ open, domains, selected, onPick, onOther, onClose }: { open: boolean; domains: string[]; selected: string | null; onPick: (d: string) => void; onOther: () => void; onClose: () => void }) {
  const firstRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    firstRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="בחר דומיין למייל">
      <button type="button" aria-label="סגור בחירת דומיין" onClick={onClose} className="absolute inset-0 animate-[pageEnter_0.2s_ease] bg-black/55" />
      <div className="relative mx-auto w-full max-w-[520px] animate-[trayIn_0.25s_cubic-bezier(0.2,0.8,0.2,1)] rounded-t-3xl border-t border-white/10 bg-background-900 p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
        <h2 className="typo-h4 mb-3 text-center text-heading">בחר דומיין למייל</h2>
        {domains.map((d, i) => (
          <button
            key={d}
            ref={i === 0 ? firstRef : undefined}
            type="button"
            onClick={() => onPick(d)}
            className="flex min-h-[48px] w-full items-center justify-between rounded-xl px-2 py-3.5 transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
          >
            <span dir="ltr" className="typo-body text-heading">@{d}</span>
            {d === selected && <Check size={20} className="text-lime-300" />}
          </button>
        ))}
        <button
          type="button"
          onClick={onOther}
          className="typo-body mt-1 min-h-[48px] w-full border-t border-white/10 px-2 py-3.5 text-center text-lime-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
        >
          כתובת אחרת...
        </button>
      </div>
    </div>,
    document.body,
  )
}

// ---------- Google ----------

/** Monochrome Google "G" (the app's Ionicons logo-google) */
export function GoogleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="fill-current">
      <path d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.6 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.51z" />
    </svg>
  )
}
