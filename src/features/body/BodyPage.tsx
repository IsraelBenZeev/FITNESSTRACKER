import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingDown, TrendingUp, CalendarDays, BarChart2, Copy, FileDown, Pencil, Plus } from 'lucide-react'
import { useToast } from '../../shared/context/ToastContext'
import { useBodyStats } from './useBodyStats'
import type { BodyStat } from '../../types/body'
import { START_WEIGHT, START_WAIST, chartTheme } from '../../lib/constants'
import { Card } from '../../shared/components/Card'
import { AddBodyStatModal } from './AddBodyStatModal'
import { BodyHistoryCalendar } from './BodyHistoryCalendar'
import { copyStatsAsJson, downloadStatsPdf } from './exportBodyStats'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      style={{
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: '18px',
        color: '#888',
        margin: '0 0 14px 0',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </h2>
  )
}

function DeltaBadge({ delta, unit }: { delta: number; unit: string }) {
  const isGood = delta < 0
  const color = isGood ? '#4ade80' : '#ff4757'
  const sign = delta > 0 ? '+' : ''
  const Icon = isGood ? TrendingDown : TrendingUp

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '20px',
        background: isGood ? 'rgba(74,222,128,0.08)' : 'rgba(255,71,87,0.08)',
        border: `1px solid ${isGood ? 'rgba(74,222,128,0.2)' : 'rgba(255,71,87,0.2)'}`,
      }}
    >
      <Icon size={12} color={color} strokeWidth={2} />
      <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color, fontWeight: 600 }}>
        {sign}{delta.toFixed(1)}{unit}
      </span>
    </div>
  )
}

interface BigStatCardProps {
  label: string
  value: number | null
  unit: string
  delta: number | null
  deltaUnit: string
}

function BigStatCard({ label, value, unit, delta, deltaUnit }: BigStatCardProps) {
  return (
    <Card style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span
        style={{
          fontFamily: '"Rubik", sans-serif',
          fontSize: '11px',
          color: '#555',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '36px',
            color: '#D7FF00',
            lineHeight: 1,
          }}
        >
          {value != null ? value.toFixed(1) : '—'}
        </span>
        {value != null && (
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#555' }}>
            {unit}
          </span>
        )}
      </div>
      {delta != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>
            מהתחלה
          </span>
          <DeltaBadge delta={delta} unit={deltaUnit} />
        </div>
      )}
    </Card>
  )
}

export function BodyPage() {
  const { stats, latest, todayStat, loading } = useBodyStats()
  const [addStatOpen, setAddStatOpen] = useState(false)
  const [editStat, setEditStat] = useState<BodyStat | null>(null)
  const [view, setView] = useState<'charts' | 'calendar'>('charts')
  const { showSuccess } = useToast()
  const [copied, setCopied] = useState(false)

  async function handleCopyJson() {
    if (stats.length === 0) return
    await copyStatsAsJson(stats)
    setCopied(true)
    showSuccess('הועתק בהצלחה')
    setTimeout(() => setCopied(false), 2800)
  }

  function handleDownloadPdf() {
    if (stats.length === 0) return
    downloadStatsPdf(stats)
    showSuccess('PDF הורד בהצלחה')
  }

  if (loading) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#555', fontFamily: '"Rubik", sans-serif' }}>
        טוען...
      </div>
    )
  }

  const latestWeight = latest?.weight_kg ?? null
  const latestWaist = latest?.waist_cm ?? null
  const weightDelta = latestWeight != null ? latestWeight - START_WEIGHT : null
  const waistDelta = latestWaist != null ? latestWaist - START_WAIST : null

  const weightData = stats
    .filter((s) => s.weight_kg != null)
    .map((s) => ({ label: formatDate(s.date), value: s.weight_kg }))

  const waistData = stats
    .filter((s) => s.waist_cm != null)
    .map((s) => ({ label: formatDate(s.date), value: s.waist_cm }))

  const weightValues = weightData.map((d) => d.value as number)
  const waistValues = waistData.map((d) => d.value as number)

  const weightDomain = weightValues.length > 0
    ? [Math.floor(Math.min(...weightValues) - 1), Math.ceil(Math.max(...weightValues) + 1)] as [number, number]
    : undefined

  const waistDomain = waistValues.length > 0
    ? [Math.floor(Math.min(...waistValues) - 1), Math.ceil(Math.max(...waistValues) + 1)] as [number, number]
    : undefined

  return (
    <>
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            if (todayStat) {
              setEditStat(todayStat)
            } else {
              setAddStatOpen(true)
            }
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '13px',
            background: 'transparent',
            border: '1px solid rgba(215,255,0,0.3)',
            borderRadius: '12px',
            color: '#D7FF00',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {todayStat ? (
            <>
              <Pencil size={15} strokeWidth={2} />
              ערוך מדידה היום
            </>
          ) : (
            <>
              <Plus size={15} strokeWidth={2.5} />
              הוסף מדידה
            </>
          )}
        </button>

        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            background: '#1a1a1a',
            border: '1px solid #222',
            borderRadius: '12px',
            padding: '4px',
            gap: '4px',
          }}
        >
          {(['charts', 'calendar'] as const).map((v) => {
            const Icon = v === 'charts' ? BarChart2 : CalendarDays
            const active = view === v
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active ? 'rgba(215,255,0,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(215,255,0,0.3)' : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: active ? '#D7FF00' : '#555',
                  transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon size={16} strokeWidth={2} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Export buttons */}
      {stats.length > 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopyJson}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              background: copied ? 'rgba(74,222,128,0.08)' : '#1a1a1a',
              border: copied ? '1px solid rgba(74,222,128,0.3)' : '1px solid #222',
              borderRadius: '10px',
              color: copied ? '#4ade80' : '#666',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
            {copied ? 'הועתק!' : 'העתק JSON'}
          </button>
          <button
            onClick={handleDownloadPdf}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              background: '#1a1a1a',
              border: '1px solid #222',
              borderRadius: '10px',
              color: '#666',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '12px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <FileDown size={14} strokeWidth={2} />
            הורד PDF
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <BigStatCard
          label="משקל נוכחי"
          value={latestWeight}
          unit={'ק"ג'}
          delta={weightDelta}
          deltaUnit={'ק"ג'}
        />
        <BigStatCard
          label="היקף בטן"
          value={latestWaist}
          unit={'ס"מ'}
          delta={waistDelta}
          deltaUnit={'ס"מ'}
        />
      </div>

      {view === 'charts' && (
        <>
          {/* Weight chart */}
          {weightData.length > 1 && (
            <Card style={{ padding: '16px' }}>
              <SectionTitle>ירידת משקל</SectionTitle>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke={chartTheme.gridColor} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chartTheme.tickColor, fontSize: 10, fontFamily: '"Rubik", sans-serif' }}
                    axisLine={{ stroke: chartTheme.axisColor }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={weightDomain}
                    tick={{ fill: chartTheme.tickColor, fontSize: 10, fontFamily: '"Rubik", sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTheme.tooltip.contentStyle}
                    formatter={(value: number) => [`${value} ק"ג`, 'משקל']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chartTheme.lineColor}
                    strokeWidth={2}
                    dot={{ fill: '#D7FF00', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#D7FF00' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Waist chart */}
          {waistData.length > 1 && (
            <Card style={{ padding: '16px' }}>
              <SectionTitle>היקף בטן</SectionTitle>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={waistData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke={chartTheme.gridColor} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chartTheme.tickColor, fontSize: 10, fontFamily: '"Rubik", sans-serif' }}
                    axisLine={{ stroke: chartTheme.axisColor }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={waistDomain}
                    tick={{ fill: chartTheme.tickColor, fontSize: 10, fontFamily: '"Rubik", sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTheme.tooltip.contentStyle}
                    formatter={(value: number) => [`${value} ס"מ`, 'היקף בטן']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chartTheme.lineColor}
                    strokeWidth={2}
                    dot={{ fill: '#D7FF00', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#D7FF00' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}

      {view === 'calendar' && (
        <BodyHistoryCalendar
          stats={stats}
          onEditStat={(stat) => setEditStat(stat)}
        />
      )}

      {stats.length === 0 && (
        <div
          style={{
            fontFamily: '"Rubik", sans-serif',
            fontSize: '14px',
            color: '#444',
            textAlign: 'center',
            padding: '32px',
          }}
        >
          אין נתוני גוף עדיין
        </div>
      )}
    </div>
    <AddBodyStatModal isOpen={addStatOpen} onClose={() => setAddStatOpen(false)} />
    <AddBodyStatModal
      isOpen={editStat != null}
      onClose={() => setEditStat(null)}
      editStat={editStat}
    />
    </>
  )
}
