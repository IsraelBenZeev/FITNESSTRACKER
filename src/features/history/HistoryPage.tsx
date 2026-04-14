import { useState } from 'react'
import { Copy, FileDown, Check } from 'lucide-react'
import { useCalendarMonth } from './useHistory'
import { fetchNutritionForExport } from './useHistory'
import { useGoals } from '../../lib/useGoals'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'
import { DayDetailSheet } from './DayDetailSheet'
import { ExportRangeModal } from './ExportRangeModal'
import type { ExportRange } from './ExportRangeModal'
import { copyNutritionAsJsonFromPromise, downloadNutritionPdf } from './exportNutrition'
import type { DayTotals } from '../../types/nutrition'

export function HistoryPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTotals, setSelectedTotals] = useState<DayTotals | null>(null)

  const [exportTarget, setExportTarget] = useState<'json' | 'pdf' | null>(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { dayMap, loading } = useCalendarMonth(year, month)
  const { goalsConfig } = useGoals()

  const disableNext =
    year === today.getFullYear() && month === today.getMonth() + 1

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  function handlePrev() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function handleNext() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  function handleDayPress(dateStr: string, totals: DayTotals) {
    setSelectedDate(dateStr)
    setSelectedTotals(totals)
  }

  function handleClose() {
    setSelectedDate(null)
    setSelectedTotals(null)
  }

  async function handleExportSelect(range: ExportRange) {
    try {
      if (exportTarget === 'json') {
        // Start clipboard write synchronously (within the gesture) and pass the
        // fetch as a Promise — iOS Safari keeps gesture trust alive this way.
        await copyNutritionAsJsonFromPromise(fetchNutritionForExport(range.sinceDate))
        setCopied(true)
        showToast('הועתק בהצלחה')
        setTimeout(() => setCopied(false), 2800)
      } else if (exportTarget === 'pdf') {
        const logs = await fetchNutritionForExport(range.sinceDate)
        if (logs.length === 0) { showToast('אין נתונים בטווח זה'); return }
        await downloadNutritionPdf(logs, range.label)
        showToast('PDF הורד בהצלחה')
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'empty') {
        showToast('אין נתונים בטווח זה')
      } else {
        showToast('שגיאה בייצוא הנתונים')
      }
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: '#555',
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        טוען...
      </div>
    )
  }

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            background: '#1a1a1a',
            border: '1px solid rgba(215,255,0,0.35)',
            borderRadius: '12px',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            animation: 'slideUp 0.2s cubic-bezier(0.32,0.72,0,1) forwards',
            whiteSpace: 'nowrap',
          }}
        >
          <Check size={14} color="#D7FF00" strokeWidth={2.5} />
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: '#D7FF00' }}>
            {toast}
          </span>
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {/* Export buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setExportTarget('json')}
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
              fontFamily: '"DM Sans", sans-serif',
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
            onClick={() => setExportTarget('pdf')}
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
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '12px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <FileDown size={14} strokeWidth={2} />
            הורד PDF
          </button>
        </div>

        <CalendarHeader
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          disableNext={disableNext}
        />
        <CalendarGrid
          year={year}
          month={month}
          dayMap={dayMap}
          onDayPress={handleDayPress}
          goalsConfig={goalsConfig}
        />

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <LegendItem color="#4ade80" label="עמידה ביעד" />
          <LegendItem color="#fb923c" label="קרוב ליעד" />
          <LegendItem color="#ff4757" label="חריגה" />
          <LegendItem color="#333" label="אין דיווח" />
        </div>

        <DayDetailSheet
          dateStr={selectedDate}
          totals={selectedTotals}
          onClose={handleClose}
        />
      </div>

      <ExportRangeModal
        isOpen={exportTarget !== null}
        onClose={() => setExportTarget(null)}
        title={exportTarget === 'json' ? 'העתק JSON — בחר טווח' : 'הורד PDF — בחר טווח'}
        onSelect={handleExportSelect}
      />
    </>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', direction: 'rtl' }}>
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          background: color,
          opacity: color === '#333' ? 1 : 0.7,
        }}
      />
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '11px',
          color: '#555',
        }}
      >
        {label}
      </span>
    </div>
  )
}
