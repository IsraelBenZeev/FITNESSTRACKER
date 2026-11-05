import { useState } from 'react'
import { Calendar, ArrowRight } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'

export type ExportRange = {
  label: string
  sinceDate: string | null   // null = all time
  untilDate?: string | null  // if set, also lte('date', untilDate) — for exact days
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function thisWeekSunday(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay()) // d.getDay(): 0=ראשון … 6=שבת
  return d.toISOString().slice(0, 10)
}

const RANGES: ExportRange[] = [
  { label: 'היום',             sinceDate: getTodayStr(), untilDate: getTodayStr() },
  { label: 'אתמול',            sinceDate: daysAgo(1),   untilDate: daysAgo(1) },
  { label: 'שבוע הנוכחי',      sinceDate: thisWeekSunday() },
  { label: 'חודש אחרון',       sinceDate: daysAgo(30) },
  { label: '3 חודשים אחרונים', sinceDate: daysAgo(90) },
  { label: '6 חודשים אחרונים', sinceDate: daysAgo(180) },
  { label: 'שנה אחרונה',       sinceDate: daysAgo(365) },
  { label: 'משחר ההיסטוריה',   sinceDate: null },
]

const btnBase: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: '#2C3545',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#C8D0DB',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '15px',
  textAlign: 'right',
  cursor: 'pointer',
  direction: 'rtl',
  transition: 'border-color 0.15s, background 0.15s',
  WebkitTapHighlightColor: 'transparent',
}

function RangeButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={btnBase}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(150,200,40,0.4)'
        e.currentTarget.style.background = 'rgba(150,200,40,0.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.background = '#2C3545'
      }}
    >
      {label}
    </button>
  )
}

interface ExportRangeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  onSelect: (range: ExportRange) => void
}

export function ExportRangeModal({ isOpen, onClose, title, onSelect }: ExportRangeModalProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickedDate, setPickedDate] = useState(getTodayStr())

  function handleClose() {
    setShowDatePicker(false)
    setPickedDate(getTodayStr())
    onClose()
  }

  function handleConfirmDate() {
    if (!pickedDate) return
    onSelect({ label: pickedDate, sinceDate: pickedDate, untilDate: pickedDate })
    handleClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={showDatePicker ? 'בחר תאריך' : title}>
      {!showDatePicker ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {RANGES.map((range) => (
            <RangeButton
              key={range.label}
              label={range.label}
              onClick={() => { handleClose(); onSelect(range) }}
            />
          ))}

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

          {/* בחר תאריך */}
          <button
            onClick={() => setShowDatePicker(true)}
            style={{
              ...btnBase,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              color: '#96C828',
              borderColor: 'rgba(150,200,40,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(150,200,40,0.5)'
              e.currentTarget.style.background = 'rgba(150,200,40,0.07)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(150,200,40,0.2)'
              e.currentTarget.style.background = '#2C3545'
            }}
          >
            <Calendar size={15} strokeWidth={2} color="#96C828" />
            <span>בחר תאריך</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Back button */}
          <button
            onClick={() => setShowDatePicker(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8C9AAB',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '13px',
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
              alignSelf: 'flex-start',
            }}
          >
            <ArrowRight size={14} strokeWidth={2} />
            חזרה
          </button>

          {/* Date input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '12px',
              color: '#8C9AAB',
              textAlign: 'right',
              direction: 'rtl',
            }}>
              תאריך לייצוא
            </label>
            <input
              type="date"
              value={pickedDate}
              max={getTodayStr()}
              onChange={(e) => setPickedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#2C3545',
                border: '1px solid #516070',
                borderRadius: '10px',
                color: '#C8D0DB',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '16px',
                colorScheme: 'dark',
                boxSizing: 'border-box',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              } as React.CSSProperties}
            />
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirmDate}
            disabled={!pickedDate}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: pickedDate ? '#96C828' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '10px',
              color: pickedDate ? '#1A2030' : '#8C9AAB',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              cursor: pickedDate ? 'pointer' : 'default',
              transition: 'background 0.15s, color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            אישור
          </button>
        </div>
      )}
    </Modal>
  )
}
