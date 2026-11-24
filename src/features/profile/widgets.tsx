/**
 * Profile cards, ported from BodyBuddy-Client: the weekly workouts card (inside ProfileScreen),
 * WeeklyNutritionCard, and CreditsMeter (variant "card").
 */
import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, ChevronLeft, List, Sparkles } from 'lucide-react'
import { ActionButton, ProgressRing } from '../workouts/ui/primitives'
import { formatMinutesHebrew } from '../workouts/format'
import { AnimatedNumber, DoubleRing, InfoBubble, useIsCarouselPageActive } from '../../ui/motion'
import { useGoalHistory, goalOn } from '../history/useGoalHistory'
import { toLocalDateStr } from '../../lib/date'
import { addDaysLocal, aiCreditsCaption, aiCreditsInfo, useNutritionTotals, weekStartOf, type AICredits, type useWeeklyProgress } from './useProfileData'

const card = 'rounded-[32px] border border-white/5 bg-background-800 p-5'
const eyebrow = 'typo-caption-bold mb-3 uppercase tracking-widest text-white/40'

// ---------- Weekly workouts ----------

export function WeeklyWorkoutsCard({ progress, onDetails }: { progress: ReturnType<typeof useWeeklyProgress>; onDetails: () => void }) {
  const active = useIsCarouselPageActive()
  const { completedThisWeek: done, plannedThisWeek: planned, weeklyMinutes, streak, totalCount, adherencePercent, totalPlannedCount, overPlanned, archivedThisWeek } = progress

  const overMessage = useMemo(() => {
    const details = overPlanned.map((p) => `${p.name} ${p.done} פעמים במקום ${p.planned}`).join(', ')
    const archived = archivedThisWeek.map((p) => `${p.name} ${p.done} ${p.done === 1 ? 'פעם' : 'פעמים'}`).join(', ')
    const archivedNote = archived
      ? ` בנוסף נספרו אימונים שבוצעו בתוכניות שנמצאות כעת בארכיון: ${archived}. הם נספרים במונה, אבל תוכניות בארכיון לא נכללות באימונים המתוכננים.`
      : ''
    return `השבוע התאמנת יותר ממה שתכננת${details ? `: ${details}` : ''}. כל אימון שביצעת נספר, גם אם בוצע ביום שלא תוכנן.${archivedNote} לצפייה בכל האימונים לחץ על "פרטים נוספים".`
  }, [overPlanned, archivedThisWeek])

  return (
    <div className={card}>
      <h3 className={eyebrow}>אימונים השבוע</h3>
      <div className="flex items-center gap-4">
        <div role="img" aria-label={`${done} מתוך ${planned} אימונים מתוכננים השבוע`}>
          <ProgressRing key={String(active)} progress={active && planned > 0 ? done / planned : 0} size={112} strokeWidth={10}>
            <span className="flex flex-col items-center" aria-hidden>
              <span dir="ltr" className="flex items-baseline">
                <AnimatedNumber value={active ? done : 0} className="min-w-[38px] text-right text-[34px] font-black leading-none text-heading" />
                <span className="typo-h3 text-background-400">/{planned}</span>
              </span>
              <span className="typo-caption text-background-400">אימונים</span>
            </span>
          </ProgressRing>
        </div>

        <div className="flex flex-1 flex-col items-start gap-2">
          <div aria-label={`${formatMinutesHebrew(weeklyMinutes)} פעילות השבוע`} role="group">
            {/* Hours and minutes ("4 שעות 50 דקות"); hours only from 60 minutes */}
            <div className="flex items-baseline gap-1" aria-hidden>
              {weeklyMinutes >= 60 && (
                <>
                  <AnimatedNumber value={active ? Math.floor(weeklyMinutes / 60) : 0} className="text-[26px] font-extrabold leading-none text-heading" />
                  <span className="typo-label me-1 text-background-400">שעות</span>
                </>
              )}
              <AnimatedNumber value={active ? weeklyMinutes % 60 : 0} className="text-[26px] font-extrabold leading-none text-heading" />
              <span className="typo-label text-background-400">דקות</span>
            </div>
            <p className="typo-caption text-background-400" aria-hidden>זמן פעילות</p>
          </div>
          <span className="h-px self-stretch bg-white/5" aria-hidden />
          <div role="group" aria-label={`${streak} שבועות ברצף`}>
            <AnimatedNumber value={active ? streak : 0} duration={900} className="block min-w-[32px] text-[26px] font-extrabold leading-none text-lime-300" />
            <p className="typo-caption text-background-400" aria-hidden>שבועות ברצף</p>
          </div>
        </div>
      </div>

      {done > planned && (
        <div className="mt-3 flex items-center gap-2">
          <p className="typo-label text-lime-300">התאמנת יותר ממה שתכננת</p>
          <InfoBubble message={overMessage} label="הסבר על אימונים מעבר למתוכנן" />
        </div>
      )}

      <span className="mt-4 block h-px bg-white/5" aria-hidden />
      <p className="flex items-center gap-1 pt-3" aria-label={`${totalCount} אימונים מאז שהתחלת`}>
        <AnimatedNumber value={active ? totalCount : 0} duration={1000} className="min-w-[30px] text-lg font-extrabold text-lime-300" />
        <span className="typo-label text-background-400" aria-hidden>אימונים מאז שהתחלת</span>
      </p>

      {adherencePercent != null && (
        <div className="flex items-center gap-2 pt-1">
          <p className="flex items-center gap-2" aria-label={`עמידה ביעד: ${adherencePercent} אחוז, ${totalCount} מתוך ${totalPlannedCount} אימונים מתוכננים`}>
            <span dir="ltr" className="flex items-baseline" aria-hidden>
              <AnimatedNumber value={active ? adherencePercent : 0} duration={1100} className="min-w-[30px] text-right text-lg font-extrabold text-lime-300" />
              <span className="typo-label text-lime-300">%</span>
            </span>
            <span className="typo-label text-background-400" aria-hidden>עמידה ביעד</span>
          </p>
          <InfoBubble
            message="אחוז העמידה ביעד מחושב לפי מספר האימונים שהושלמו מתוך סך האימונים שתוכננו עבורך מתחילת השימוש באפליקציה."
            label="הסבר על חישוב העמידה ביעד"
          />
        </div>
      )}

      <div className="mt-3">
        <ActionButton onPress={onDetails} label="פרטים נוספים" icon={List} variant="secondary" size="sm" fullWidth ariaLabel="פרטים נוספים על האימונים השבוע" />
      </div>
    </div>
  )
}

// ---------- Weekly nutrition ----------

const DAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DAY_NAMES = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']
/** A ring closes from 90% of the goal; over 110% the calorie ring turns red */
const CLOSE_RATIO = 0.9
const OVER_TOLERANCE = 0.1

type DayStatus = 'hit' | 'miss' | 'today' | 'empty' | 'future'
const STATUS_LABEL: Record<DayStatus, string> = {
  hit: 'סגרת את הטבעות',
  miss: 'לא סגרת את הטבעות',
  today: 'היום · בתהליך',
  empty: 'לא תועד',
  future: 'עוד לא הגיע',
}
const STATUS_CHIP: Record<DayStatus, string> = {
  hit: 'bg-lime-500/[0.18] text-lime-300',
  miss: 'bg-danger/15 text-danger',
  today: 'bg-white/[0.08] text-background-400',
  empty: 'bg-white/[0.08] text-background-400',
  future: 'bg-white/[0.08] text-background-400',
}

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

/**
 * Double ring per day (outer calories, inner protein) and the share of logged days each ring closed.
 * Goals are the goal of record for each day (nutrition_goals), like the rest of this site.
 */
export function WeeklyNutritionCard({ onHistory, onOpenDay }: { onHistory: () => void; onOpenDay: (date: string) => void }) {
  const historyButton = (
    <div className="mt-3">
      <ActionButton onPress={onHistory} label="לכל ההיסטוריה" icon={CalendarDays} variant="secondary" size="sm" fullWidth ariaLabel="להיסטוריית התזונה המלאה" />
    </div>
  )
  const active = useIsCarouselPageActive()
  const today = new Date()
  const todayIndex = today.getDay()
  const weekStart = weekStartOf(today)
  const from = toLocalDateStr(weekStart)
  const to = addDaysLocal(weekStart, 6)
  const { data: totals } = useNutritionTotals(from, to)
  const { history, loading: goalsLoading } = useGoalHistory()
  const [selected, setSelected] = useState(todayIndex)

  const days = useMemo(
    () =>
      DAY_LETTERS.map((_, index) => {
        const date = addDaysLocal(weekStart, index)
        const entry = totals?.get(date)
        const goal = goalOn(history, date <= toLocalDateStr(today) ? date : toLocalDateStr(today))
        const calories = entry?.calories ?? 0
        const protein = entry?.protein ?? 0
        const closedCal = !!goal && calories / goal.calories >= CLOSE_RATIO
        const closedProt = !!goal && protein / goal.protein >= CLOSE_RATIO
        let status: DayStatus
        if (index > todayIndex) status = 'future'
        else if (index === todayIndex) status = 'today'
        else if (!entry) status = 'empty'
        else status = closedCal && closedProt ? 'hit' : 'miss'
        return { index, date, calories, protein, goal, status, closedCal, closedProt }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totals, history, from, todayIndex],
  )

  // Only past, logged days count — an unlogged day says nothing about the goal
  const tracked = days.filter((d) => d.status === 'hit' || d.status === 'miss')
  const calClosed = tracked.filter((d) => d.closedCal).length
  const protClosed = tracked.filter((d) => d.closedProt).length

  if (!goalsLoading && history.length === 0) {
    return (
      <div className={card}>
        <h3 className={eyebrow}>תזונה השבוע</h3>
        <p className="typo-label text-background-400">כדי לראות את העמידה ביעדי התזונה צריך להגדיר יעד תזונה באפליקציה</p>
        {historyButton}
      </div>
    )
  }

  const day = days[selected]!
  const goal = day.goal
  const over = !!goal && goal.calories > 0 && day.calories / goal.calories > 1 + OVER_TOLERANCE

  return (
    <div className={card}>
      <h3 className={eyebrow}>תזונה השבוע</h3>
      <p className="typo-label text-background-400">סגרת את הטבעות?</p>
      <div className="mt-2 flex gap-3">
        <ClosedPercent label="קלוריות" closed={calClosed} tracked={tracked.length} active={active} colorClass="text-lime-300" />
        <ClosedPercent label="חלבון" closed={protClosed} tracked={tracked.length} active={active} colorClass="text-macro-protein" />
      </div>

      <div className="mt-4 flex gap-1" role="group" aria-label="ימי השבוע">
        {days.map((d) => {
          const g = d.goal
          const isSel = d.index === selected
          return (
            <button
              key={d.index}
              type="button"
              onClick={() => setSelected(d.index)}
              aria-pressed={isSel}
              aria-label={g ? `${DAY_NAMES[d.index]}: ${fmt(d.calories)} מתוך ${fmt(g.calories)} קלוריות, ${fmt(d.protein)} מתוך ${fmt(g.protein)} גרם חלבון` : DAY_NAMES[d.index]}
              className={`flex min-h-[72px] flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${isSel ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
            >
              <DoubleRing
                delay={d.index * 90}
                outer={{ progress: active && g ? d.calories / g.calories : 0, colorClass: g && d.calories / g.calories > 1 + OVER_TOLERANCE ? 'stroke-danger' : 'stroke-lime-300' }}
                inner={{ progress: active && g ? d.protein / g.protein : 0, colorClass: 'stroke-macro-protein' }}
              />
              <span className={`typo-caption ${d.index === todayIndex ? 'text-lime-300' : 'text-background-400'}`}>{DAY_LETTERS[d.index]}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-hidden>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-lime-300" /><span className="typo-caption text-background-400">קלוריות</span></span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-macro-protein" /><span className="typo-caption text-background-400">חלבון</span></span>
      </div>

      {/* Tap the day → that day's nutrition (today → the nutrition tab) */}
      <button
        type="button"
        onClick={() => onOpenDay(day.date)}
        disabled={day.status === 'future'}
        aria-label={`${DAY_NAMES[selected]}: ${STATUS_LABEL[day.status]}. לצפייה ביום התזונה`}
        className="mt-4 block w-full rounded-3xl border border-white/[0.07] bg-white/[0.035] p-4 text-start transition-colors duration-200 hover:border-lime-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 disabled:cursor-default disabled:hover:border-white/[0.07]"
      >
        <span aria-live="polite" className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="typo-body-primary text-heading">{DAY_NAMES[selected]}</span>
            {day.status !== 'future' && <ChevronLeft size={16} className="text-background-400" aria-hidden />}
          </span>
          <span className={`typo-caption-bold rounded-full px-3 py-0.5 ${STATUS_CHIP[day.status]}`}>{STATUS_LABEL[day.status]}</span>
        </span>
        {day.status !== 'future' && goal && (
          <>
            <MetricRow label="קלוריות" consumed={day.calories} goal={goal.calories} unit="קלוריות" barClass={over ? 'bg-danger' : 'bg-lime-300'} />
            <MetricRow label="חלבון" consumed={day.protein} goal={goal.protein} unit="גרם" barClass="bg-macro-protein" />
            {over && (
              <p className="typo-caption mt-3 flex items-center gap-1.5 text-danger">
                <AlertTriangle size={14} aria-hidden />
                {`חריגה של ${fmt(day.calories - goal.calories)} קלוריות מהיעד`}
              </p>
            )}
          </>
        )}
      </button>

      {historyButton}
    </div>
  )
}

function ClosedPercent({ label, closed, tracked, active, colorClass }: { label: string; closed: number; tracked: number; active: boolean; colorClass: string }) {
  const percent = tracked > 0 ? Math.round((closed / tracked) * 100) : null
  return (
    <div
      role="group"
      aria-label={percent == null ? `${label}: עוד אין ימים שתועדו` : `טבעת ${label} נסגרה ב-${closed} מתוך ${tracked} ימים, ${percent} אחוז`}
      className="flex flex-1 flex-col items-start rounded-3xl border border-white/[0.07] bg-white/[0.035] p-3"
    >
      <span className={`typo-caption-bold ${colorClass}`} aria-hidden>{label}</span>
      {percent != null ? (
        <span dir="ltr" className={`flex items-baseline ${colorClass}`} aria-hidden>
          <AnimatedNumber value={active ? percent : 0} duration={1000} className="min-w-[48px] text-right text-4xl font-black" />
          <span className="typo-h3">%</span>
        </span>
      ) : (
        <span className="text-4xl font-black text-background-400" aria-hidden>--</span>
      )}
      <span className="typo-caption text-background-400" aria-hidden>{tracked > 0 ? `${closed} מתוך ${tracked} ימים` : 'עוד אין ימים שתועדו'}</span>
    </div>
  )
}

function MetricRow({ label, consumed, goal, unit, barClass }: { label: string; consumed: number; goal: number; unit: string; barClass: string }) {
  const ratio = goal > 0 ? consumed / goal : 0
  return (
    <div className="mt-2 flex items-center gap-3" role="group" aria-label={`${label}: ${fmt(consumed)} מתוך ${fmt(goal)} ${unit}`}>
      <span className="typo-label w-14 text-background-400" aria-hidden>{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden>
        <span className={`block h-full rounded-full ${barClass} transition-[width] duration-500`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </span>
      <span dir="ltr" className="typo-label text-heading" aria-hidden>
        {fmt(consumed)}
        <span className="typo-caption text-background-400"> / {fmt(goal)}</span>
      </span>
    </div>
  )
}

// ---------- AI credits ----------

/**
 * CreditsMeter (variant "card"): count, segmented bar (one segment per analysis) and an info bubble.
 * AI analysis runs only in the app, so on the web the card is shown disabled.
 */
export function CreditsCard({ credits }: { credits: AICredits | undefined }) {
  const value = credits?.balance ?? 0
  const max = credits?.dailyAllowance ?? 25
  const step = credits?.costPerAnalysis ?? 5
  const segments = Math.max(1, Math.round(max / step))
  const filled = Math.floor(value / step)

  return (
    <div aria-disabled="true" className="relative rounded-3xl border border-white/5 bg-background-800 p-5">
      <div className="flex items-center gap-2">
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-background-400">
          <Sparkles size={15} />
        </span>
        <h3 className="typo-h4 min-w-0 flex-1 text-background-400">קרדיטים לניתוח AI</h3>
        <span className="typo-caption-bold flex-shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-background-400">באפליקציה בלבד</span>
        <InfoBubble message={`${aiCreditsInfo(credits)} ניתוח AI זמין כרגע רק באפליקציית BodyBuddy.`} label="מידע על קרדיטים לניתוח AI" />
      </div>

      <p dir="ltr" className="mt-3 flex items-baseline gap-1 self-start" aria-label={`${value} מתוך ${max} קרדיטים`}>
        <AnimatedNumber value={value} duration={700} className="min-w-[44px] text-4xl font-black text-background-400" />
        <span className="typo-h4 text-background-500" aria-hidden>/{max}</span>
      </p>

      <div className="mt-3 flex gap-1.5" aria-hidden>
        {Array.from({ length: segments }, (_, i) => (
          <span key={i} className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
            <span className={`block h-full rounded-full bg-background-500 transition-opacity duration-500 ${i < filled ? 'opacity-100' : 'opacity-0'}`} />
          </span>
        ))}
      </div>

      <p className="typo-caption mt-3 text-background-400">{credits ? aiCreditsCaption(credits) : 'ניתוח ארוחה מתמונה או טקסט'}</p>
    </div>
  )
}
