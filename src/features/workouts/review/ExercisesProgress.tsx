import { useMemo, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import type { ExerciseProgress, InputField, ProgressSession } from '../types'
import { useExercisesByIds, usePlanProgress } from '../hooks'
import { Loading } from '../ui/primitives'
import { formatFieldValue } from '../format'

/** review/ExercisesProgress.tsx — exercise chips, then the chosen exercise's graph and records */
export function ExercisesProgress({ planId }: { planId: string }) {
  const { data: progress, isPending } = usePlanProgress(planId)
  const list = useMemo(
    () =>
      Object.entries(progress ?? {})
        .map(([id, p]) => ({ id, ...p }))
        .sort((a, b) => (a.sessions[0]?.date ?? '').localeCompare(b.sessions[0]?.date ?? '')),
    [progress],
  )
  const ids = useMemo(() => list.map((e) => e.id), [list])
  const { data: details, isPending: loadingDetails } = useExercisesByIds(ids)
  const [selected, setSelected] = useState<string | null>(null)
  const activeId = selected ?? list.find((e) => e.sessions.length > 0)?.id ?? list[0]?.id ?? null

  if (isPending || (loadingDetails && ids.length > 0)) return <Loading />
  if (!ids.length) return <p className="typo-h3 px-4 py-12 text-center text-heading">לא בוצעו תרגילים עדיין</p>

  const current = list.find((e) => e.id === activeId)
  const info = details?.find((d) => d.exerciseId === activeId)

  return (
    <div className="pb-20">
      <div className="-mx-6 overflow-x-auto [scrollbar-width:none]">
        <div className="flex w-max gap-2 px-4 py-3">
          {list.map((ex) => {
            const d = details?.find((x) => x.exerciseId === ex.id)
            const name = d?.name_he ?? ''
            const label = name.length > 10 ? `${name.slice(0, 10)}…` : name
            const active = ex.id === activeId
            const hasData = ex.sessions.length > 0
            return (
              <button
                key={ex.id}
                type="button"
                aria-pressed={active}
                aria-label={name}
                onClick={() => setSelected(ex.id)}
                className={`flex min-h-[80px] w-[72px] flex-col items-center rounded-2xl border px-1 py-2 ${
                  active ? 'border-lime-500/60 bg-lime-500/15' : hasData ? 'border-zinc-700/50 bg-zinc-800/80' : 'border-zinc-800/40 bg-zinc-900/50'
                }`}
              >
                <span className="mb-1.5 h-9 w-9 overflow-hidden rounded-2xl bg-zinc-700/60">
                  {d?.imageUrls?.[0] ? <img src={d.imageUrls[0]} alt="" className="h-9 w-9 object-cover" loading="lazy" /> : <span className="flex h-9 w-9 items-center justify-center text-lime-500"><Dumbbell size={18} /></span>}
                </span>
                <span className={`typo-caption line-clamp-2 min-h-[28px] text-center ${active ? 'font-semibold text-lime-400' : hasData ? 'text-zinc-200' : 'text-zinc-600'}`}>{label}</span>
                <span className={`mt-1 h-1.5 w-1.5 rounded-full ${active ? 'bg-lime-500' : 'bg-transparent'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {current && (
        <div className="mt-2">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-12 w-12 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
              {info?.imageUrls?.[0] ? <img src={info.imageUrls[0]} alt="" className="h-12 w-12 object-cover" /> : <span className="flex h-12 w-12 items-center justify-center text-lime-500"><Dumbbell size={24} /></span>}
            </span>
            <h3 className="typo-h4 min-w-0 flex-1 truncate text-heading">{info?.name_he}</h3>
          </div>
          {current.sessions.length ? (
            <CardExerciseProgress key={activeId} exercise={current} fields={info?.input_fields ?? []} />
          ) : (
            <p className="typo-label rounded-xl border border-zinc-600/40 bg-zinc-700/30 px-4 py-6 text-center text-zinc-400">על תרגיל זה טרם בוצעו חזרות — אין נתונים להצגה</p>
          )}
        </div>
      )}
    </div>
  )
}

function CardExerciseProgress({ exercise, fields }: { exercise: ExerciseProgress; fields: InputField[] }) {
  return (
    <div className="py-4">
      <GraphData sessions={exercise.sessions} fields={fields} />
      <dl className="mt-6 flex flex-wrap justify-between gap-y-3 rounded-2xl border border-zinc-700/30 bg-zinc-800/50 p-4">
        {fields.map((f) => <StatItem key={f.key} label={`${f.label} שיא`} value={formatFieldValue(f, exercise.maxima[f.key] ?? 0)} />)}
        <StatItem label="שיא סטים לאימון" value={String(exercise.max_sets)} />
        <StatItem label="סהכ עבודה" value={`${exercise.total_sets} סטים בוצעו`} />
      </dl>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-1/2 flex-col items-start">
      <dt className="typo-caption mb-1 text-zinc-500">{label}</dt>
      <dd dir="ltr" className="typo-body-primary font-semibold text-heading">{value}</dd>
    </div>
  )
}

const SETS: InputField = { key: 'sets', type: 'number', label: 'סטים', unit: null }
const H = 220
const PAD = { top: 38, bottom: 28, left: 16, right: 16 }
const MIN_SPACING = 60

const curve = (pts: { x: number; y: number }[]) => {
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = (pts[i + 1].x - pts[i].x) / 2.5
    d += ` C ${pts[i].x + dx} ${pts[i].y}, ${pts[i + 1].x - dx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`
  }
  return d
}

/** review/GraphData.tsx — a smooth line per metric, one point per workout, scrolls sideways */
function GraphData({ sessions, fields }: { sessions: ProgressSession[]; fields: InputField[] }) {
  const tabs = useMemo(() => [...fields, SETS], [fields])
  const [key, setKey] = useState(tabs[0]?.key ?? 'sets')
  const field = tabs.find((f) => f.key === key) ?? tabs[0]
  const data = useMemo(
    () =>
      sessions
        .map((s) => ({ value: key === 'sets' ? s.sets : s.maxima[key], date: new Date(s.date) }))
        .filter((p): p is { value: number; date: Date } => p.value !== undefined),
    [sessions, key],
  )
  const multiYear = new Set(data.map((d) => d.date.getFullYear())).size > 1
  const label = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}${multiYear ? `/${String(d.getFullYear()).slice(-2)}` : ''}`

  const inner = Math.max(300, data.length * MIN_SPACING)
  const W = inner + PAD.left + PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const max = Math.max(1, ...data.map((d) => d.value))
  const x = (i: number) => PAD.left + (data.length === 1 ? inner / 2 : (i / (data.length - 1)) * inner)
  const y = (v: number) => PAD.top + chartH - (v / max) * chartH
  const pts = data.map((d, i) => ({ x: x(i), y: y(d.value) }))
  const line = pts.length ? curve(pts) : ''
  const area = pts.length ? `${line} L ${pts[pts.length - 1].x} ${PAD.top + chartH} L ${pts[0].x} ${PAD.top + chartH} Z` : ''

  return (
    <div className="mb-4 w-full">
      <div className="mb-4 flex gap-2">
        {tabs.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={key === f.key}
            onClick={() => setKey(f.key)}
            className={`typo-label flex-1 rounded-xl border px-3 py-2 text-center font-semibold ${key === f.key ? 'border-lime-500/50 bg-lime-500/20 text-lime-500' : 'border-zinc-700/50 bg-zinc-800/50 text-zinc-400'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="h-[220px] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {data.length ? (
          <div dir="ltr" className="h-full overflow-x-auto [scrollbar-width:none]">
            <svg width={W} height={H} role="img" aria-label={`גרף ${field.label}: ${data.map((d) => `${label(d.date)} ${d.value}`).join(', ')}`}>
              <defs>
                <linearGradient id="bb-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className="[stop-color:theme(colors.lime.500)] [stop-opacity:0.4]" />
                  <stop offset="100%" className="[stop-color:theme(colors.lime.500)] [stop-opacity:0.01]" />
                </linearGradient>
              </defs>
              {pts.map((p, i) => <line key={`g${i}`} x1={p.x} y1={PAD.top} x2={p.x} y2={PAD.top + chartH} strokeWidth={1} className="stroke-background-700" />)}
              <path d={area} fill="url(#bb-area)" />
              <path d={line} fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="stroke-lime-500" />
              {pts.map((p, i) => (
                <g key={`p${i}`}>
                  <circle cx={p.x} cy={p.y} r={5} className="fill-lime-500" />
                  <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize={11} className="fill-background-300">{formatFieldValue(field, data[i].value)}</text>
                </g>
              ))}
              {data.map((d, i) => <text key={`x${i}`} x={x(i)} y={H - 6} textAnchor="middle" fontSize={12} className="fill-background-400">{label(d.date)}</text>)}
            </svg>
          </div>
        ) : (
          <p className="typo-body flex h-full items-center justify-center px-6 text-center text-zinc-500">אין נתונים להצגה עבור {field?.label ?? 'המדד הזה'}</p>
        )}
      </div>
    </div>
  )
}
