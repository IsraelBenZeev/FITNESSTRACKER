/**
 * Small building blocks ported from BodyBuddy-Client/src/ui (ActionButton, ProgressRing, LevelBars,
 * CloseButton, Loading). Same classes and colors; React Native animations become CSS transitions.
 * `style` is used only for values computed at runtime (ring offset, sizes), never for static styling.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown, Loader2, X, type LucideIcon } from 'lucide-react'

// ---------- ActionButton ----------

type ButtonVariant = 'outline' | 'secondary' | 'primary' | 'soft' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const SIZE: Record<ButtonSize, { button: string; icon: string; iconSize: number }> = {
  sm: { button: 'py-2 px-4 gap-2', icon: 'w-9 h-9', iconSize: 18 },
  md: { button: 'py-3 px-6 gap-3', icon: 'w-12 h-12', iconSize: 26 },
  lg: { button: 'py-4 px-6 gap-3', icon: 'w-14 h-14', iconSize: 28 },
}

const VARIANT: Record<ButtonVariant, { button: string; iconWrapper: string; text: string }> = {
  soft: {
    button: 'rounded-full bg-lime-500/[0.18] border border-lime-500/45',
    iconWrapper: 'rounded-full bg-black/15',
    text: 'typo-label font-bold text-lime-300',
  },
  danger: {
    button: 'rounded-full bg-danger/[0.12] border border-danger/40',
    iconWrapper: 'rounded-full bg-black/15',
    text: 'typo-label font-bold text-danger',
  },
  outline: {
    button: 'bg-gradient-to-r from-lime-500/15 to-lime-500/5 border border-lime-500/40 rounded-full',
    iconWrapper: 'bg-lime-500/25 border border-lime-500/50 rounded-full',
    text: 'typo-btn-cta text-lime-400',
  },
  secondary: {
    button: 'bg-gradient-to-r from-white/10 to-white/5 border border-white/60 rounded-full',
    iconWrapper: 'bg-white/15 border border-white/20 rounded-full',
    text: 'typo-btn-cta text-heading',
  },
  primary: {
    button: 'bg-background-700 border border-lime-500 rounded-full',
    iconWrapper: 'bg-lime-500/55 border border-lime-500 rounded-full',
    text: 'typo-btn-cta text-lime-300',
  },
}

const DISABLED = {
  button: 'bg-background-800 border border-background-600 rounded-full',
  iconWrapper: 'bg-background-700 border border-background-600 rounded-full',
  text: 'typo-btn-cta text-background-400',
}

interface ActionButtonProps {
  onPress: () => void
  label: string
  icon?: LucideIcon
  size?: ButtonSize
  variant?: ButtonVariant
  fullWidth?: boolean
  iconOnly?: boolean
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
  /** 'submit' inside a <form>, so Enter in a field submits it (onPress is then ignored) */
  type?: 'button' | 'submit'
}

export function ActionButton({
  onPress, label, icon: Icon, size = 'md', variant = 'outline', fullWidth, iconOnly, disabled, loading, ariaLabel, type = 'button',
}: ActionButtonProps) {
  const v = disabled ? DISABLED : VARIANT[variant]
  const s = SIZE[size]
  const busy = disabled || loading
  const base = `${v.button} flex items-center justify-center transition-transform duration-150 active:scale-95 active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 ${loading ? 'opacity-70' : ''}`

  if (iconOnly) {
    return (
      <button type="button" onClick={onPress} disabled={busy} aria-label={ariaLabel ?? label} aria-busy={loading} className={`${base} h-11 w-11 flex-shrink-0`}>
        {loading ? <Loader2 size={20} className="animate-spin text-lime-300" /> : Icon && <Icon size={22} strokeWidth={2} className={variant === 'danger' ? 'text-danger' : 'text-lime-300'} />}
      </button>
    )
  }

  return (
    <button
      type={type}
      onClick={type === 'submit' ? undefined : onPress}
      disabled={busy}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`${base} flex-row ${s.button} ${fullWidth ? 'w-full' : ''}`}
    >
      {(Icon || loading) && (
        <span className={`${v.iconWrapper} ${s.icon} flex items-center justify-center`}>
          {loading ? <Loader2 size={s.iconSize} className="animate-spin" /> : Icon && <Icon size={s.iconSize} strokeWidth={2} />}
        </span>
      )}
      <span className={v.text}>{label}</span>
    </button>
  )
}

// ---------- ProgressRing ----------

interface ProgressRingProps {
  /** 0–1 */
  progress: number
  size?: number
  strokeWidth?: number
  /** Tailwind stroke class for the filled arc */
  colorClass?: string
  trackClass?: string
  children?: ReactNode
}

/** Ring that fills with an animation; children are centered inside (BodyBuddy-Client/src/ui/ProgressRing) */
export function ProgressRing({
  progress, size = 190, strokeWidth = 12, colorClass = 'stroke-lime-300', trackClass = 'stroke-white/[0.08]', children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.min(1, Math.max(0, progress))))
    return () => cancelAnimationFrame(id)
  }, [progress])

  return (
    <span className="relative flex flex-shrink-0 flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown)}
          className={`${colorClass} transition-[stroke-dashoffset] duration-[900ms] ease-out motion-reduce:transition-none`}
        />
      </svg>
      {children}
    </span>
  )
}

// ---------- LevelBars ----------

/** Rising bars that light up one after another (BodyBuddy-Client/src/ui/LevelBars) */
export function LevelBars({
  level, total = 5, barWidth = 4, minBarHeight = 6, heightStep = 3, startDelay = 300, stepDelay = 120,
}: { level: number; total?: number; barWidth?: number; minBarHeight?: number; heightStep?: number; startDelay?: number; stepDelay?: number }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setOn(true), 16)
    return () => clearTimeout(id)
  }, [])
  return (
    <span className="flex items-end gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const active = i + 1 <= level
        const partial = level > i && level < i + 1 ? level - i : 0
        return (
          <span
            key={i}
            className={`flex origin-bottom flex-col justify-end overflow-hidden rounded-full transition-[background-color,transform] duration-[450ms] ease-out ${
              on && active ? 'scale-y-100 bg-lime-300' : 'scale-y-[0.85] bg-white/10'
            }`}
            style={{ width: barWidth, height: minBarHeight + i * heightStep, transitionDelay: `${startDelay + i * stepDelay}ms` }}
          >
            {partial > 0 && <span className="bg-lime-300" style={{ height: `${partial * 100}%` }} />}
          </span>
        )
      })}
    </span>
  )
}

// ---------- CloseButton ----------

/** The app's round close button (44×44); `minimize` shows a chevron-down in the same shape */
export function CloseButton({
  onPress, label, kind = 'close', tone = 'default',
}: { onPress: () => void; label: string; kind?: 'close' | 'minimize'; tone?: 'default' | 'gray' }) {
  const Icon = kind === 'minimize' ? ChevronDown : X
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 ${
        tone === 'gray' ? 'border border-white/10 bg-background-800 text-heading' : 'border border-lime-500/40 bg-lime-500/15 p-1 text-lime-300'
      }`}
    >
      <Icon size={22} strokeWidth={2} />
    </button>
  )
}

// ---------- Loading ----------

/** The app's loading mark: the BodyBuddy hexagon spinning with an elastic ease */
export function Loading({ size = 64, label = 'טוען' }: { size?: number; label?: string }) {
  return (
    <span role="progressbar" aria-label={label} aria-busy className="flex items-center justify-center py-6">
      <svg viewBox="40 0 637 710" width={size} height={size} className="animate-bb-spin motion-reduce:animate-none" aria-hidden>
        <path
          fillRule="evenodd"
          className="fill-subtle"
          d="M624.163 356.05C624.163 356.05 657.694 325.231 663.672 309.531C672.416 286.599 670.886 205.878 670.886 205.878C670.867 184.64 659.54 165.021 641.141 154.437L387.313 8.19626C368.915 -2.38839 346.256 -2.36874 327.914 8.24777L74.3022 154.928C55.9224 165.582 44.6289 185.22 44.6473 206.421L44.9013 499.417C44.9197 520.656 56.2473 540.274 74.6456 550.859L328.474 697.137C346.872 707.721 369.531 707.702 387.873 697.085L641.447 550.367C659.827 539.751 671.121 520.113 671.102 498.874C671.102 498.874 668.825 420.514 663.975 399.991C657.736 373.626 624.126 356.05 624.126 356.05L624.163 356.05ZM578.538 519.107L380.735 628.169C362.767 638.56 340.67 638.842 322.46 628.856L127.054 521.821C107.607 511.162 95.7164 490.608 96.1841 468.47L100.822 245.703C101.254 224.951 112.51 205.913 130.478 195.522L335.015 77.1643C352.983 66.7728 375.079 66.4915 393.29 76.477L588.696 183.512C605.369 191.027 609.201 204.958 611.43 226.719C611.43 226.719 611.789 252.377 611.048 261.78C608.899 288.677 601.028 324.343 526.611 326.056C522.716 326.134 519.573 329.321 519.577 333.217L519.616 378.841C519.62 383.073 523.256 386.366 527.487 385.988C546.998 384.211 596.884 383.83 607.481 424.276C614.019 449.255 612.953 472.255 607.386 487.393C603.762 497.285 587.971 513.705 578.538 519.144L578.538 519.107Z"
        />
        <path
          className="fill-accent"
          d="M283.792 276.638C286.162 276.636 288.078 279.099 288.081 282.151L288.112 317.829C288.113 319.649 289.264 321.127 290.677 321.126L406.577 321.026C407.99 321.024 409.137 319.544 409.135 317.724L409.104 282.046C409.102 278.994 411.014 276.528 413.385 276.525L456.47 276.488C458.84 276.486 460.757 278.949 460.76 282.001L460.778 302.874C460.779 304.694 461.929 306.172 463.342 306.171L481.278 306.155C483.648 306.153 485.564 308.616 485.567 311.668L485.635 390.607C485.638 393.659 483.726 396.125 481.356 396.128L463.376 396.143C461.963 396.145 460.815 397.625 460.816 399.444L460.837 423.065C460.84 426.117 458.928 428.584 456.558 428.587L413.473 428.624C411.102 428.626 409.185 426.162 409.183 423.11L409.149 384.664C409.148 382.844 407.997 381.367 406.584 381.368L290.715 381.469C289.301 381.47 288.154 382.949 288.155 384.769L288.189 423.215C288.191 426.267 286.28 428.734 283.909 428.736L242.356 428.772C239.985 428.774 238.068 426.311 238.066 423.259L238.045 399.638C238.043 397.818 236.893 396.34 235.48 396.341L217.177 396.357C214.806 396.359 212.89 393.896 212.887 390.844L212.819 311.904C212.816 308.852 214.728 306.386 217.099 306.384L235.416 306.368C236.83 306.367 237.977 304.887 237.976 303.067L237.958 282.194C237.955 279.142 239.868 276.676 242.238 276.674L283.792 276.638Z"
        />
      </svg>
    </span>
  )
}
