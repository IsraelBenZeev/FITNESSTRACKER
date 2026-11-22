import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ClipboardCopy, FileDown } from 'lucide-react'
import { useCalendarMonth, fetchNutritionForExport } from './useHistory'
import { useGoals } from '../../lib/useGoals'
import { useToast } from '../../shared/context/ToastContext'
import { todayLocal } from '../../lib/date'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'
import { DayDetailSheet } from './DayDetailSheet'
import { ExportRangeModal } from './ExportRangeModal'
import type { ExportRange } from './ExportRangeModal'
import { copyNutritionAsJsonFromPromise, downloadNutritionPdf } from './exportNutrition'
import { DAY_COLOR_LABEL, HEBREW_MONTHS, daysLabel, getDayColor, shortDate } from './calendarUtils'
import type { DayColor } from './calendarUtils'
import type { DayTotals } from '../../types/nutrition'

const fmt = (n: number) => Math.round(n).toLocaleString('he-IL')

const DOT: Record<Exclude<DayColor, 'gray'>, string> = {
  green: 'bg-accent',
  orange: 'bg-macro-fat',
  red: 'bg-danger',
}

export function HistoryPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const [selected, setSelected] = useState<{ date: string; totals: DayTotals } | null>(null)
  const [exportTarget, setExportTarget] = useState<'json' | 'pdf' | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const { showSuccess, showError } = useToast()

  const { dayMap, weekDayMap, monthGoals, loading } = useCalendarMonth(year, month)
  const { goalsConfig } = useGoals()

  const stats = useMemo(() => {
    const today = todayLocal()
    const counts = { green: 0, orange: 0, red: 0 }
    let calories = 0
    let protein = 0
    for (const [date, totals] of dayMap) {
      if (date > today) continue
      const c = getDayColor(totals, date, goalsConfig)
      if (c !== 'gray') counts[c]++
      calories += totals.calories
      protein += totals.protein
    }
    const logged = counts.green + counts.orange + counts.red
    return { counts, logged, avgCalories: logged ? calories / logged : 0, avgProtein: logged ? protein / logged : 0 }
  }, [dayMap, goalsConfig])

  function handlePrev() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) } else setMonth((m) => m - 1)
  }
  function handleNext() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) } else setMonth((m) => m + 1)
  }
  function handleToday() {
    setYear(now.getFullYear()); setMonth(now.getMonth() + 1)
  }

  async function handleExportSelect(range: ExportRange) {
    const target = exportTarget
    setBusy(true)
    try {
      if (target === 'json') {
        // Start the clipboard write synchronously (within the tap) and hand it the fetch
        // as a Promise — iOS Safari keeps the gesture trust alive this way.
        await copyNutritionAsJsonFromPromise(fetchNutritionForExport(range.sinceDate, range.untilDate))
        setCopied(true)
        showSuccess('הנתונים הועתקו ללוח')
        setTimeout(() => setCopied(false), 2800)
      } else if (target === 'pdf') {
        const logs = await fetchNutritionForExport(range.sinceDate, range.untilDate)
        if (logs.length === 0) { showError('אין ארוחות בטווח הזה'); return }
        await downloadNutritionPdf(logs, range.label)
        showSuccess('קובץ ה-PDF ירד למכשיר')
      }
    } catch (e) {
      showError(e instanceof Error && e.message === 'empty' ? 'אין ארוחות בטווח הזה' : 'הייצוא נכשל, נסה שוב')
    } finally {
      setBusy(false)
    }
  }

  const { counts, logged } = stats

  return (
    <>
      <div className="flex flex-col gap-7 px-4 pb-28 pt-4">
        <section aria-label="לוח חודשי" className="flex flex-col gap-5 rounded-2xl border border-border-col bg-surface px-4 pb-4 pt-2">
          <CalendarHeader
            year={year}
            month={month}
            onPrev={handlePrev}
            onNext={handleNext}
            disableNext={isCurrentMonth}
            onToday={isCurrentMonth ? undefined : handleToday}
          />

          {/* The month's answer, as a sentence — like the Today summary */}
          {loading ? (
            <div aria-hidden className="flex animate-pulse flex-col gap-2.5">
              <div className="h-10 w-56 rounded bg-surface2" />
              <div className="h-4 w-44 rounded bg-surface2" />
            </div>
          ) : logged === 0 ? (
            <p className="font-body text-xl leading-snug text-text-col">
              {isCurrentMonth ? 'עוד לא תיעדת ארוחות החודש' : `לא תועדו ארוחות ב${HEBREW_MONTHS[month]}`}
              <br />
              <span className="text-base text-muted">ימים עם תיעוד יופיעו כאן בצבע</span>
            </p>
          ) : (
            <p className="font-body text-xl leading-snug text-text-col [text-wrap:balance]">
              עמדת ביעד ב-
              <span className="font-display text-[44px] font-bold leading-none tabular-nums text-accent">{counts.green}</span>
              {' '}מתוך {daysLabel(logged)} שתיעדת
            </p>
          )}

          <CalendarGrid
            year={year}
            month={month}
            dayMap={dayMap}
            weekDayMap={weekDayMap}
            onDayPress={(date, totals) => setSelected({ date, totals })}
            goalsConfig={goalsConfig}
            loading={loading}
          />

          {/* Monthly average next to the month's goal(s) */}
          <div className="flex flex-col rounded-2xl bg-bg px-4">
            <div className="flex min-h-[52px] items-center justify-between gap-3 py-3">
              <span className="font-body text-sm font-medium text-text-col">ממוצע חודשי</span>
              {loading ? (
                <span aria-hidden className="h-6 w-36 animate-pulse rounded bg-surface2" />
              ) : logged === 0 ? (
                <span className="font-body text-sm text-muted">אין תיעוד</span>
              ) : (
                <CalProtein calories={stats.avgCalories} protein={stats.avgProtein} label="ממוצע חודשי" strong />
              )}
            </div>

            {!loading && monthGoals.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border-col py-3">
                <span className="flex items-center gap-2 font-body text-sm font-medium text-text-col">
                  {monthGoals.length === 1 ? 'היעד החודש' : 'היעדים החודש'}
                  {monthGoals.length > 1 && (
                    <span className="rounded-full bg-macro-fat/15 px-2 py-0.5 font-body text-xs font-medium text-macro-fat">
                      התחלף ב-{shortDate(monthGoals[1]!.from)}
                    </span>
                  )}
                </span>
                <ul className="flex flex-col gap-1.5">
                  {monthGoals.map((g) => (
                    <li key={g.from} className="flex items-center justify-between gap-3">
                      <span className="font-body text-sm tabular-nums text-muted">
                        {monthGoals.length === 1 ? 'כל החודש' : `${shortDate(g.from)}–${shortDate(g.to)}`}
                      </span>
                      <CalProtein calories={g.calories} protein={g.protein} label={`יעד ${shortDate(g.from)}–${shortDate(g.to)}`} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Legend that also counts the month */}
          <ul aria-label="מקרא" className="flex flex-wrap gap-2">
            {(['green', 'orange', 'red'] as const).map((c) => (
              <li key={c} className="flex items-center gap-2 rounded-full bg-surface2 px-3 py-1.5 font-body text-sm text-text-col">
                <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${DOT[c]}`} />
                {DAY_COLOR_LABEL[c]}
                {!loading && <span className="tabular-nums text-muted">{counts[c]}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="export-heading" className="flex flex-col gap-2">
          <h2 id="export-heading" className="font-body text-base font-medium text-text-col">ייצוא נתונים</h2>
          <div className="overflow-hidden rounded-2xl border border-border-col bg-surface">
            <ExportRow
              icon={copied ? <Check size={20} strokeWidth={2.25} /> : <ClipboardCopy size={20} strokeWidth={1.75} />}
              title={copied ? 'הועתק ללוח' : 'העתקת נתונים'}
              desc="קובץ JSON להדבקה בצ׳אט או לגיבוי"
              done={copied}
              disabled={busy}
              onClick={() => setExportTarget('json')}
            />
            <div aria-hidden className="mx-4 h-px bg-border-col" />
            <ExportRow
              icon={<FileDown size={20} strokeWidth={1.75} />}
              title="הורדת דוח PDF"
              desc="כל הארוחות וסיכום לכל יום"
              disabled={busy}
              onClick={() => setExportTarget('pdf')}
            />
          </div>
        </section>
      </div>

      <DayDetailSheet dateStr={selected?.date ?? null} totals={selected?.totals ?? null} onClose={() => setSelected(null)} />

      <ExportRangeModal
        isOpen={exportTarget !== null}
        onClose={() => setExportTarget(null)}
        title={exportTarget === 'json' ? 'איזה טווח להעתיק?' : 'איזה טווח לייצא ל-PDF?'}
        confirmLabel={exportTarget === 'json' ? 'העתק' : 'הורד PDF'}
        onSelect={handleExportSelect}
      />
    </>
  )
}

function CalProtein({ calories, protein, label, strong }: { calories: number; protein: number; label: string; strong?: boolean }) {
  const size = strong ? 'text-2xl' : 'text-xl'
  return (
    <span className="flex items-baseline gap-4" aria-label={`${label}: ${fmt(calories)} קלוריות ו-${fmt(protein)} גרם חלבון ביום`}>
      <span className="flex items-baseline gap-1">
        <span className={`font-display ${size} font-semibold leading-none tabular-nums ${strong ? 'text-heading' : 'text-text-col'}`}>{fmt(calories)}</span>
        <span className="font-body text-xs text-muted">קל'</span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className={`font-display ${size} font-semibold leading-none tabular-nums text-macro-protein`}>{fmt(protein)}g</span>
        <span className="font-body text-xs text-muted">חלבון</span>
      </span>
    </span>
  )
}

function ExportRow({ icon, title, desc, done, disabled, onClick }: {
  icon: React.ReactNode; title: string; desc: string; done?: boolean; disabled?: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3 text-right transition-colors duration-150 hover:bg-surface2 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]"
    >
      <span aria-hidden className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${done ? 'bg-accent text-bg' : 'bg-accent-soft text-accent'}`}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span aria-live="polite" className="font-body text-[15px] font-medium text-heading">{title}</span>
        <span className="truncate font-body text-sm text-muted">{desc}</span>
      </span>
      <ChevronLeft size={18} strokeWidth={2} aria-hidden className="flex-shrink-0 text-subtle" />
    </button>
  )
}
