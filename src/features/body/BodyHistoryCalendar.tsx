import { useState } from 'react'
import { ChevronRight, ChevronLeft, Pencil } from 'lucide-react'
import type { BodyStat } from '../../types/body'
import { Modal } from '../../shared/components/Modal'

const DAY_HEADERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1)
  return d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

interface StatDetailModalProps {
  stat: BodyStat | null
  onClose: () => void
  onEdit: (stat: BodyStat) => void
}

function StatDetailModal({ stat, onClose, onEdit }: StatDetailModalProps) {
  if (!stat) return null

  const dateLabel = new Date(stat.date + 'T12:00:00').toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Modal isOpen={true} onClose={onClose} title={dateLabel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {stat.weight_kg != null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #222',
            }}
          >
            <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#888' }}>
              משקל
            </span>
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '28px',
                color: '#D7FF00',
                lineHeight: 1,
              }}
            >
              {stat.weight_kg.toFixed(1)}{' '}
              <span style={{ fontSize: '14px', color: '#555' }}>ק"ג</span>
            </span>
          </div>
        )}

        {stat.waist_cm != null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #222',
            }}
          >
            <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#888' }}>
              היקף בטן
            </span>
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '28px',
                color: '#D7FF00',
                lineHeight: 1,
              }}
            >
              {stat.waist_cm.toFixed(1)}{' '}
              <span style={{ fontSize: '14px', color: '#555' }}>ס"מ</span>
            </span>
          </div>
        )}

        {stat.notes && (
          <div
            style={{
              padding: '14px 16px',
              background: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #222',
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '11px',
                color: '#555',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              הערות
            </span>
            <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '14px', color: '#ccc', lineHeight: 1.5 }}>
              {stat.notes}
            </span>
          </div>
        )}

        <button
          onClick={() => onEdit(stat)}
          style={{
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
          <Pencil size={14} strokeWidth={2} />
          ערוך מדידה
        </button>
      </div>
    </Modal>
  )
}

interface BodyHistoryCalendarProps {
  stats: BodyStat[]
  onEditStat: (stat: BodyStat) => void
}

export function BodyHistoryCalendar({ stats, onEditStat }: BodyHistoryCalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedStat, setSelectedStat] = useState<BodyStat | null>(null)

  // Build a map: dateKey → BodyStat
  const statsByDate = new Map<string, BodyStat>()
  for (const s of stats) {
    statsByDate.set(s.date, s)
  }

  // Calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Fill grid: leading empty cells + day cells
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <>
      <div
        style={{
          background: '#111',
          borderRadius: '14px',
          border: '1px solid #222',
          borderTop: '2px solid #D7FF00',
          overflow: 'hidden',
        }}
      >
        {/* Month navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid #1a1a1a',
          }}
        >
          <button
            onClick={nextMonth}
            style={{
              width: '32px', height: '32px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: '#1a1a1a', border: '1px solid #222',
              borderRadius: '8px', cursor: 'pointer', color: '#888',
            }}
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>

          <span
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '18px',
              color: '#e0e0e0',
              letterSpacing: '0.04em',
            }}
          >
            {formatMonthYear(year, month)}
          </span>

          <button
            onClick={prevMonth}
            disabled={false}
            style={{
              width: '32px', height: '32px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: '#1a1a1a', border: '1px solid #222',
              borderRadius: '8px', cursor: 'pointer', color: '#888',
            }}
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Day headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            padding: '8px 8px 4px',
            gap: '2px',
          }}
        >
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '10px',
                color: '#444',
                fontWeight: 500,
                padding: '2px 0',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            padding: '0 8px 10px',
          }}
        >
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} style={{ aspectRatio: '1', minHeight: '44px' }} />
            }

            const dateKey = toDateKey(year, month, day)
            const stat = statsByDate.get(dateKey)
            const isToday = isCurrentMonth && day === today.getDate()
            const hasStat = stat != null

            return (
              <button
                key={dateKey}
                onClick={() => hasStat && setSelectedStat(stat)}
                style={{
                  aspectRatio: '1',
                  minHeight: '44px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  borderRadius: '8px',
                  border: hasStat
                    ? '1px solid rgba(215,255,0,0.35)'
                    : isToday
                    ? '1px solid #333'
                    : '1px solid transparent',
                  background: hasStat ? 'rgba(215,255,0,0.06)' : 'transparent',
                  cursor: hasStat ? 'pointer' : 'default',
                  padding: '2px',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span
                  style={{
                    fontFamily: '"Rubik", sans-serif',
                    fontSize: '11px',
                    color: isToday ? '#D7FF00' : hasStat ? '#ccc' : '#444',
                    fontWeight: isToday ? 700 : 400,
                    lineHeight: 1,
                  }}
                >
                  {day}
                </span>
                {hasStat && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                    {stat.weight_kg != null && (
                      <span
                        style={{
                          fontFamily: '"Barlow Condensed", sans-serif',
                          fontSize: '10px',
                          color: '#D7FF00',
                          lineHeight: 1,
                        }}
                      >
                        {stat.weight_kg.toFixed(1)}
                      </span>
                    )}
                    {stat.waist_cm != null && (
                      <span
                        style={{
                          fontFamily: '"Barlow Condensed", sans-serif',
                          fontSize: '9px',
                          color: '#888',
                          lineHeight: 1,
                        }}
                      >
                        {stat.waist_cm.toFixed(0)}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            padding: '8px 16px 12px',
            borderTop: '1px solid #1a1a1a',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '11px', color: '#D7FF00' }}>
              00.0
            </span>
            <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '10px', color: '#444' }}>
              = משקל (ק"ג)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '11px', color: '#888' }}>
              00
            </span>
            <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '10px', color: '#444' }}>
              = היקף (ס"מ)
            </span>
          </div>
        </div>
      </div>

      <StatDetailModal
        stat={selectedStat}
        onClose={() => setSelectedStat(null)}
        onEdit={(stat) => {
          setSelectedStat(null)
          onEditStat(stat)
        }}
      />
    </>
  )
}
