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

const RANGES: ExportRange[] = [
  { label: 'היום',             sinceDate: getTodayStr(), untilDate: getTodayStr() },
  { label: 'אתמול',            sinceDate: daysAgo(1),   untilDate: daysAgo(1) },
  { label: 'שבוע אחרון',       sinceDate: daysAgo(7) },
  { label: 'חודש אחרון',       sinceDate: daysAgo(30) },
  { label: '3 חודשים אחרונים', sinceDate: daysAgo(90) },
  { label: '6 חודשים אחרונים', sinceDate: daysAgo(180) },
  { label: 'שנה אחרונה',       sinceDate: daysAgo(365) },
  { label: 'משחר ההיסטוריה',   sinceDate: null },
]

const btnBase: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: '#1a1a1a',
  border: '1px solid #222',
  borderRadius: '10px',
  color: '#f0f0f0',
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
        e.currentTarget.style.borderColor = 'rgba(215,255,0,0.4)'
        e.currentTarget.style.background = 'rgba(215,255,0,0.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#222'
        e.currentTarget.style.background = '#1a1a1a'
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
          <div style={{ height: '1px', background: '#222', margin: '4px 0' }} />

          {/* בחר תאריך */}
          <button
            onClick={() => setShowDatePicker(true)}
            style={{
              ...btnBase,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              color: '#D7FF00',
              borderColor: 'rgba(215,255,0,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(215,255,0,0.5)'
              e.currentTarget.style.background = 'rgba(215,255,0,0.07)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(215,255,0,0.2)'
              e.currentTarget.style.background = '#1a1a1a'
            }}
          >
            <Calendar size={15} strokeWidth={2} color="#D7FF00" />
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
              color: '#666',
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
              color: '#666',
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
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '10px',
                color: '#f0f0f0',
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
              background: pickedDate ? '#D7FF00' : '#222',
              border: 'none',
              borderRadius: '10px',
              color: pickedDate ? '#0a0a0a' : '#444',
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
