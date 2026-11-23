import { useMemo, useState } from 'react'
import { CalendarCheck, Flame, LogIn, LogOut, Pencil, RefreshCw, Scale } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import { useStreak } from '../today/useStreak'
import { useEntryDates } from '../nutrition/hooks'
import { useBodyStats } from '../body/useBodyStats'
import { useGoalHistory } from '../history/useGoalHistory'
import { shortDate } from '../history/calendarUtils'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { GoalEditSheet } from './GoalEditSheet'
import { UserAvatar } from './UserAvatar'

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')
const one = (n: number) => n.toLocaleString('he-IL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/** The user's screen: who, goals (view + edit + history), the BodyBuddy account, sign out. */
export function ProfilePage() {
  const { bbUser, connect, disconnect, configured } = useBodyBuddyAuth()
  const streak = useStreak()
  const { data: entryDates } = useEntryDates()
  const { stats } = useBodyStats()
  const { history, current, loading: goalsLoading } = useGoalHistory()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const person = bbUser
  const name = (person?.user_metadata?.full_name as string | undefined) ?? person?.email ?? 'משתמש'
  const loggedDays = useMemo(() => new Set(entryDates ?? []).size, [entryDates])
  const latestWeight = useMemo(() => [...stats].reverse().find((s) => s.weight_kg != null)?.weight_kg ?? null, [stats])
  const changes = useMemo(() => [...history].reverse(), [history])

  async function handleSignOut() {
    setConfirmSignOut(false)
    await disconnect()
  }

  return (
    <>
      <div className="flex flex-col gap-7 px-4 pb-28 pt-4">
        {/* Who */}
        <section aria-label="פרטי המשתמש" className="flex items-center gap-4 rounded-2xl border border-border-col bg-surface p-4">
          <UserAvatar user={person} size="lg" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate font-body text-xl font-semibold text-heading">{name}</h1>
            {person?.email && <p className="truncate font-body text-sm text-muted" dir="ltr">{person.email}</p>}
          </div>
        </section>

        <ul aria-label="נתונים" className="grid grid-cols-3 gap-2.5">
          <StatTile icon={<Flame size={18} strokeWidth={2} />} value={fmt(streak)} label={streak === 1 ? 'יום ברצף' : 'ימים ברצף'} />
          <StatTile icon={<CalendarCheck size={18} strokeWidth={2} />} value={fmt(loggedDays)} label="ימים מתועדים" />
          <StatTile icon={<Scale size={18} strokeWidth={2} />} value={latestWeight != null ? one(latestWeight) : '—'} label="ק״ג, שקילה אחרונה" />
        </ul>

        {/* Goal */}
        <section aria-labelledby="goal-heading" className="flex flex-col gap-2">
          <h2 id="goal-heading" className="font-body text-base font-medium text-text-col">היעד היומי שלי</h2>
          <div className="flex flex-col gap-4 rounded-2xl border border-border-col bg-surface px-4 pb-4 pt-3.5">
            {goalsLoading ? (
              <div aria-hidden className="flex animate-pulse flex-col gap-3">
                <div className="h-10 w-48 rounded bg-surface2" />
                <div className="h-4 w-56 rounded bg-surface2" />
              </div>
            ) : current ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {current.isManual && <span className="rounded-full border border-accent-line px-2.5 py-0.5 font-body text-xs font-medium text-accent">ידני</span>}
                  <span className="font-body text-sm text-muted">בתוקף מ-{shortDate(current.from)}</span>
                </div>
                <p className="font-body text-xl leading-snug text-text-col">
                  <span className="font-display text-[44px] font-bold leading-none tabular-nums text-accent">{fmt(current.calories)}</span>
                  {' '}קלוריות ביום
                </p>
                <ul aria-label="מאקרו" className="grid grid-cols-3 gap-2">
                  <MacroTile label="חלבון" value={current.protein} className="text-macro-protein" />
                  <MacroTile label="פחמימה" value={current.carbs} className="text-macro-carbs" />
                  <MacroTile label="שומן" value={current.fat} className="text-macro-fat" />
                </ul>
              </>
            ) : (
              <p className="font-body text-base text-text-col">עוד לא הוגדר יעד</p>
            )}
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              disabled={!bbUser}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-accent font-body text-base font-semibold text-accent transition-colors duration-150 hover:bg-accent-soft active:bg-accent-soft disabled:opacity-40 ${focusRing}`}
            >
              <Pencil size={17} strokeWidth={2} aria-hidden />
              {current ? 'עריכת היעד' : 'הגדרת יעד'}
            </button>
          </div>
        </section>

        {/* Goal history */}
        {changes.length > 0 && (
          <section aria-labelledby="goal-history-heading" className="flex flex-col gap-2">
            <h2 id="goal-history-heading" className="font-body text-base font-medium text-text-col">היסטוריית יעדים</h2>
            <ol className="overflow-hidden rounded-2xl border border-border-col bg-surface">
              {changes.map((g, i) => (
                <li key={g.from} className={`flex min-h-[52px] items-center justify-between gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-border-col' : ''}`}>
                  <span className="flex flex-col">
                    <span className="font-body text-[15px] tabular-nums text-text-col">מ-{shortDate(g.from)}</span>
                    {i === 0 && <span className="font-body text-xs text-accent">היעד הנוכחי</span>}
                  </span>
                  <span className="flex items-baseline gap-3 font-body text-sm tabular-nums">
                    <span className="text-heading"><span className="font-display text-lg font-semibold">{fmt(g.calories)}</span> קל'</span>
                    <span className="text-macro-protein">{fmt(g.protein)}g חלבון</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Accounts */}
        <section aria-labelledby="accounts-heading" className="flex flex-col gap-2">
          <h2 id="accounts-heading" className="font-body text-base font-medium text-text-col">חשבון מחובר</h2>
          <div className="overflow-hidden rounded-2xl border border-border-col bg-surface">
            <AccountRow name="BodyBuddy" purpose="תזונה, אימונים, שקילות ויעדים — כמו באפליקציה" account={bbUser}>
              {!configured ? (
                <span className="font-body text-xs text-danger">חסרות הגדרות</span>
              ) : bbUser ? (
                <SmallButton onClick={() => void disconnect().then(connect)} icon={<RefreshCw size={15} strokeWidth={2} />}>החלף</SmallButton>
              ) : (
                <SmallButton onClick={() => void connect()} icon={<LogIn size={15} strokeWidth={2} />}>התחבר</SmallButton>
              )}
            </AccountRow>
          </div>
        </section>

        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-danger/50 font-body text-base font-semibold text-danger transition-colors duration-150 hover:bg-danger/10 active:bg-danger/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
        >
          <LogOut size={18} strokeWidth={2} aria-hidden />
          התנתקות
        </button>
      </div>

      <GoalEditSheet isOpen={editOpen} onClose={() => setEditOpen(false)} current={current} weight={latestWeight} />
      <ConfirmDialog
        visible={confirmSignOut}
        title="להתנתק?"
        message="תתנתק מחשבון BodyBuddy במכשיר הזה. הנתונים שלך נשארים שמורים."
        icon={LogOut}
        confirmLabel="התנתק"
        onConfirm={() => void handleSignOut()}
        onCancel={() => setConfirmSignOut(false)}
      />
    </>
  )
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border-col bg-surface px-3 py-3">
      <span aria-hidden className="text-accent">{icon}</span>
      <span className="font-display text-2xl font-semibold leading-none tabular-nums text-heading">{value}</span>
      <span className="font-body text-xs leading-tight text-muted">{label}</span>
    </li>
  )
}

function MacroTile({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <li className="flex flex-col gap-1 rounded-xl bg-bg px-3 py-2.5">
      <span className="font-body text-xs text-muted">{label}</span>
      <span className={`font-display text-xl font-semibold leading-none tabular-nums ${className}`}>{fmt(value)}g</span>
    </li>
  )
}

function AccountRow({ name, purpose, account, children }: { name: string; purpose: string; account: User | null; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[64px] items-center gap-3 px-4 py-3">
      <span aria-hidden className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${account ? 'bg-accent' : 'bg-danger'}`} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-body text-[15px] font-medium text-heading">
          {name} <span className={`font-normal ${account ? 'text-muted' : 'text-danger'}`}>· {account ? 'מחובר' : 'לא מחובר'}</span>
        </span>
        <span className="truncate font-body text-xs text-muted">{purpose}</span>
      </span>
      {children}
    </div>
  )
}

function SmallButton({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 flex-shrink-0 items-center gap-1.5 rounded-xl border border-border-col px-3 font-body text-sm text-text-col transition-colors duration-150 hover:border-subtle ${focusRing}`}
    >
      {icon}
      {children}
    </button>
  )
}
