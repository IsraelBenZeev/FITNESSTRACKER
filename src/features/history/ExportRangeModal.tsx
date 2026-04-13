import { Modal } from '../../shared/components/Modal'

export type ExportRange = {
  label: string
  sinceDate: string | null  // null = all time
}

const RANGES: ExportRange[] = [
  { label: 'היום', sinceDate: getTodayStr() },
  { label: 'שבוע אחרון', sinceDate: daysAgo(7) },
  { label: 'חודש אחרון', sinceDate: daysAgo(30) },
  { label: '3 חודשים אחרונים', sinceDate: daysAgo(90) },
  { label: '6 חודשים אחרונים', sinceDate: daysAgo(180) },
  { label: 'שנה אחרונה', sinceDate: daysAgo(365) },
  { label: 'משחר ההיסטוריה', sinceDate: null },
]

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

interface ExportRangeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  onSelect: (range: ExportRange) => void
}

export function ExportRangeModal({ isOpen, onClose, title, onSelect }: ExportRangeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {RANGES.map((range) => (
          <button
            key={range.label}
            onClick={() => {
              onClose()
              onSelect(range)
            }}
            style={{
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
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(215,255,0,0.4)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(215,255,0,0.05)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#222'
              ;(e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a'
            }}
          >
            {range.label}
          </button>
        ))}
      </div>
    </Modal>
  )
}
