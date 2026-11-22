import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Check, ChevronLeft, ClipboardCopy, FileDown, Minus, Pencil, Plus } from 'lucide-react'
import { useToast } from '../../shared/context/ToastContext'
import { useBodyStats } from './useBodyStats'
import type { BodyStat } from '../../types/body'
import { chartTheme } from '../../lib/constants'
import { daysAgoLocal, todayLocal } from '../../lib/date'
import { AddBodyStatModal } from './AddBodyStatModal'
import { BodyCalendar } from './BodyCalendar'
import { ExportRangeModal } from '../history/ExportRangeModal'
import type { ExportRange } from '../history/ExportRangeModal'
import { shortDate, daysBetween } from '../history/calendarUtils'
import { copyStatsAsJson, downloadStatsPdf } from './exportBodyStats'

type Metric = 'weight_kg' | 'waist_cm'
type Span = 30 | 90 | 365 | null

const METRIC: Record<Metric, { label: string; unit: string }> = {
  weight_kg: { label: 'משקל', unit: 'ק״ג' },
  waist_cm: { label: 'היקף בטן', unit: 'ס״מ' },
}
const SPANS: { v: Span; label: string }[] = [
  { v: 30, label: 'חודש' },
  { v: 90, label: '3 חודשים' },
  { v: 365, label: 'שנה' },
  { v: null, label: 'הכל' },
]

const one = (n: number) => n.toLocaleString('he-IL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/** Latest value of `metric` on or before `date` */
function valueOn(stats: BodyStat[], metric: Metric, date: string): number | null {
  for (let i = stats.length - 1; i >= 0; i--) {
    const s = stats[i]!
    if (s.date <= date && s[metric] != null) return s[metric]
  }
  return null
}

function lastWeighedLabel(date: string): string {
  const days = daysBetween(date, todayLocal()) - 1
  if (days <= 0) return 'נשקלת היום'
  if (days === 1) return 'נשקלת אתמול'
  return `נשקלת לפני ${days} ימים · ${shortDate(date)}`
}

export function BodyPage() {
  const { stats, latest, todayStat, loading } = useBodyStats()
  const [addOpen, setAddOpen] = useState(false)
  const [editStat, setEditStat] = useState<BodyStat | null>(null)
  const [metric, setMetric] = useState<Metric>('weight_kg')
  const [span, setSpan] = useState<Span>(90)
  const [exportTarget, setExportTarget] = useState<'json' | 'pdf' | null>(null)
  const [copied, setCopied] = useState(false)
  const { showSuccess, showError } = useToast()

  const latestWeight = useMemo(() => valueOn(stats, 'weight_kg', todayLocal()), [stats])
  const latestWaist = useMemo(() => valueOn(stats, 'waist_cm', todayLocal()), [stats])
  const firstWeight = stats.find((s) => s.weight_kg != null)?.weight_kg ?? null

  const changes = useMemo(() => {
    if (latestWeight == null) return []
    const week = valueOn(stats, 'weight_kg', daysAgoLocal(7))
    const month = valueOn(stats, 'weight_kg', daysAgoLocal(30))
    return [
      { label: 'בשבוע', delta: week != null ? latestWeight - week : null },
      { label: 'בחודש', delta: month != null ? latestWeight - month : null },
      { label: 'מההתחלה', delta: firstWeight != null ? latestWeight - firstWeight : null },
    ]
  }, [stats, latestWeight, firstWeight])

  const chartData = useMemo(() => {
    const since = span ? daysAgoLocal(span) : null
    return stats
      .filter((s) => s[metric] != null && (!since || s.date >= since))
      .map((s) => ({ label: shortDate(s.date), value: s[metric] as number }))
  }, [stats, metric, span])

  const domain = useMemo((): [number, number] | undefined => {
    if (chartData.length === 0) return undefined
    const vals = chartData.map((d) => d.value)
    return [Math.floor(Math.min(...vals) - 0.5), Math.ceil(Math.max(...vals) + 0.5)]
  }, [chartData])

  function openTodayStat() {
    if (todayStat) setEditStat(todayStat)
    else setAddOpen(true)
  }

  async function handleExportSelect(range: ExportRange) {
    const picked = stats.filter((s) => (!range.sinceDate || s.date >= range.sinceDate) && (!range.untilDate || s.date <= range.untilDate))
    if (picked.length === 0) { showError('אין שקילות בטווח הזה'); return }
    try {
      if (exportTarget === 'json') {
        await copyStatsAsJson(picked)
        setCopied(true)
        showSuccess('השקילות הועתקו ללוח')
        setTimeout(() => setCopied(false), 2800)
      } else {
        await downloadStatsPdf(picked)
        showSuccess('קובץ ה-PDF ירד למכשיר')
      }
    } catch {
      showError('הייצוא נכשל, נסה שוב')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-7 px-4 pb-28 pt-4">
        {loading ? (
          <BodySkeleton />
        ) : (
          <>
            {/* The answer: current weight, as a sentence */}
            <section aria-label="מצב נוכחי" className="flex flex-col gap-5 rounded-2xl border border-border-col bg-surface px-4 pb-4 pt-3.5">
              <span className="font-body text-sm text-muted">{latest ? lastWeighedLabel(latest.date) : 'עוד אין שקילות'}</span>

              {latestWeight != null ? (
                <p className="font-body text-xl leading-snug text-text-col">
                  אתה שוקל{' '}
                  <span className="font-display text-[44px] font-bold leading-none tabular-nums text-accent">{one(latestWeight)}</span>
                  {' '}ק״ג
                  {latestWaist != null && (
                    <>
                      <br />
                      <span className="text-base text-muted">
                        היקף בטן <span className="font-medium tabular-nums text-text-col">{one(latestWaist)}</span> ס״מ
                      </span>
                    </>
                  )}
                </p>
              ) : (
                <p className="font-body text-xl leading-snug text-text-col">
                  הוסף שקילה ראשונה
                  <br />
                  <span className="text-base text-muted">המגמה תופיע כאן אחרי שתי שקילות</span>
                </p>
              )}

              {changes.some((c) => c.delta != null) && (
                <ul aria-label="שינוי במשקל" className="grid grid-cols-3 gap-2">
                  {changes.map((c) => <ChangeTile key={c.label} label={c.label} delta={c.delta} />)}
                </ul>
              )}

              <button
                type="button"
                onClick={openTodayStat}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-accent font-body text-base font-semibold text-accent transition-colors duration-150 hover:bg-accent-soft active:bg-accent-soft ${focusRing} [-webkit-tap-highlight-color:transparent]`}
              >
                {todayStat ? <Pencil size={18} strokeWidth={2} aria-hidden /> : <Plus size={18} strokeWidth={2.25} aria-hidden />}
                {todayStat ? 'עריכת השקילה של היום' : 'הוספת שקילה להיום'}
              </button>
            </section>

            {/* Trend */}
            {stats.length > 1 && (
              <section aria-labelledby="trend-heading" className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="trend-heading" className="font-body text-base font-medium text-text-col">מגמה</h2>
                  <Segmented
                    label="מדד"
                    value={metric}
                    onChange={setMetric}
                    options={[{ v: 'weight_kg', label: 'משקל' }, { v: 'waist_cm', label: 'היקף בטן' }]}
                  />
                </div>
                <div className="flex flex-col gap-3 rounded-2xl border border-border-col bg-surface p-4">
                  <div role="radiogroup" aria-label="טווח זמן" className="flex gap-1.5">
                    {SPANS.map((s) => (
                      <button key={s.label} type="button" role="radio" aria-checked={span === s.v} onClick={() => setSpan(s.v)}
                        className={`h-8 rounded-full border px-3 font-body text-sm transition-colors duration-150 ${focusRing} ${span === s.v ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-border-col text-muted hover:text-text-col'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {chartData.length > 1 ? (
                    <div className="h-48 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke={chartTheme.gridColor} vertical={false} />
                          <XAxis dataKey="label" tick={{ fill: chartTheme.tickColor, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} reversed />
                          <YAxis domain={domain} orientation="right" tick={{ fill: chartTheme.tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                          <Tooltip
                            contentStyle={chartTheme.tooltip.contentStyle}
                            formatter={(v: number) => [`${one(v)} ${METRIC[metric].unit}`, METRIC[metric].label]}
                          />
                          <Line type="monotone" dataKey="value" stroke={chartTheme.lineColor} strokeWidth={2.25}
                            dot={chartData.length <= 40 ? { r: 3, strokeWidth: 0, fill: chartTheme.lineColor } : false}
                            activeDot={{ r: 5, strokeWidth: 0, fill: chartTheme.lineColor }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-10 text-center font-body text-sm text-muted">אין מספיק מדידות של {METRIC[metric].label} בטווח הזה</p>
                  )}
                </div>
              </section>
            )}

            {/* Log */}
            {stats.length > 0 && (
              <section aria-labelledby="log-heading" className="flex flex-col gap-2">
                <h2 id="log-heading" className="font-body text-base font-medium text-text-col">יומן שקילות</h2>
                <BodyCalendar stats={stats} onSelect={setEditStat} />
              </section>
            )}

            {/* Export */}
            {stats.length > 0 && (
              <section aria-labelledby="body-export-heading" className="flex flex-col gap-2">
                <h2 id="body-export-heading" className="font-body text-base font-medium text-text-col">ייצוא נתונים</h2>
                <div className="overflow-hidden rounded-2xl border border-border-col bg-surface">
                  <ExportRow
                    icon={copied ? <Check size={20} strokeWidth={2.25} /> : <ClipboardCopy size={20} strokeWidth={1.75} />}
                    title={copied ? 'הועתק ללוח' : 'העתקת שקילות'}
                    desc="קובץ JSON להדבקה בצ׳אט או לגיבוי"
                    done={copied}
                    onClick={() => setExportTarget('json')}
                  />
                  <div aria-hidden className="mx-4 h-px bg-border-col" />
                  <ExportRow icon={<FileDown size={20} strokeWidth={1.75} />} title="הורדת דוח PDF" desc="כל השקילות עם משקל והיקף בטן" onClick={() => setExportTarget('pdf')} />
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <AddBodyStatModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
      <AddBodyStatModal isOpen={editStat != null} onClose={() => setEditStat(null)} editStat={editStat} />
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

/** Change in weight over a period. Neutral colors: whether up is good depends on the goal (cut vs bulk). */
function ChangeTile({ label, delta }: { label: string; delta: number | null }) {
  const flat = delta != null && Math.abs(delta) < 0.05
  const Icon = delta == null || flat ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight
  const text = delta == null ? '—' : flat ? '0.0' : `${delta > 0 ? '+' : '−'}${one(Math.abs(delta))}`
  return (
    <li className="flex flex-col gap-1 rounded-xl bg-bg px-3 py-2.5" aria-label={`${label}: ${delta == null ? 'אין נתון' : `${text} ק״ג`}`}>
      <span className="font-body text-xs text-muted">{label}</span>
      <span className="flex items-center gap-1">
        <Icon size={15} strokeWidth={2.25} className="text-muted" aria-hidden />
        <span className="font-display text-xl font-semibold leading-none tabular-nums text-heading" dir="ltr">{text}</span>
      </span>
    </li>
  )
}

function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-full border border-border-col p-0.5">
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
          className={`h-8 rounded-full border px-3 font-body text-sm transition-colors duration-150 ${focusRing} ${value === o.v ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-transparent text-muted hover:text-text-col'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ExportRow({ icon, title, desc, done, onClick }: { icon: React.ReactNode; title: string; desc: string; done?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3 text-right transition-colors duration-150 hover:bg-surface2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [-webkit-tap-highlight-color:transparent]"
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

function BodySkeleton() {
  return (
    <div aria-busy="true" aria-label="טוען" className="flex animate-pulse flex-col gap-7">
      <div className="flex flex-col gap-5 rounded-2xl border border-border-col bg-surface p-4">
        <div className="h-3 w-28 rounded bg-surface2" />
        <div className="h-10 w-56 rounded bg-surface2" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-surface2" />)}
        </div>
        <div className="h-12 rounded-2xl bg-surface2" />
      </div>
      <div className="h-64 rounded-2xl bg-surface2" />
    </div>
  )
}
