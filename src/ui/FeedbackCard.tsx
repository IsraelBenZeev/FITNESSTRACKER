import type { FeedbackType } from '../store/uiStore'

const SIZE = 52
const STROKE = 2
const RADIUS = (SIZE - STROKE) / 2

// Check / cross inside the 52×52 ring
const MARK_PATH: Record<FeedbackType, string> = {
  success: 'M16 27 L23 34 L37 19',
  failed: 'M19 19 L33 33 M33 19 L19 33',
}

const TONE: Record<FeedbackType, { border: string; glow: string; stroke: string; text: string }> = {
  success: { border: 'border-accent/35', glow: 'bg-accent/10', stroke: 'stroke-accent', text: 'text-accent' },
  failed: { border: 'border-danger/35', glow: 'bg-danger/10', stroke: 'stroke-danger', text: 'text-danger' },
}

/**
 * Success / failure card, like the app's FeedbackCard: a thin outline ring draws itself,
 * then the check (or cross), with the message underneath.
 */
export function FeedbackCard({ type, message }: { type: FeedbackType; message?: string }) {
  const t = TONE[type]
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label={message || (type === 'success' ? 'הפעולה הצליחה' : 'הפעולה נכשלה')}
      className={`mx-8 flex min-w-[200px] max-w-[340px] animate-[feedbackIn_0.38s_cubic-bezier(0.33,1,0.68,1)_both] flex-col items-center gap-3 rounded-3xl border bg-surface/95 px-6 py-5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] motion-reduce:animate-none ${t.border}`}
    >
      <span aria-hidden className={`flex h-[72px] w-[72px] items-center justify-center rounded-full ${t.glow}`}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} fill="none">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            className={`${t.stroke} [stroke-dasharray:158] [stroke-dashoffset:158] animate-[drawStroke_0.8s_cubic-bezier(0.33,1,0.68,1)_forwards] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]`}
          />
          <path
            d={MARK_PATH[type]}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${t.stroke} [stroke-dasharray:40] [stroke-dashoffset:40] animate-[drawStroke_0.55s_cubic-bezier(0.33,1,0.68,1)_0.65s_forwards] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]`}
          />
        </svg>
      </span>
      {message && <p className={`text-center font-body text-base font-medium ${t.text}`}>{message}</p>}
    </div>
  )
}
