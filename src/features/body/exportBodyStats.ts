import { jsPDF } from 'jspdf'
import type { BodyStat } from '../../types/body'
import { START_WEIGHT, START_WAIST } from '../../lib/constants'

// ─── JSON copy ────────────────────────────────────────────────────────────────

export async function copyStatsAsJson(stats: BodyStat[]): Promise<void> {
  const payload = stats.map((s) => ({
    date: s.date,
    weight_kg: s.weight_kg,
    waist_cm: s.waist_cm,
    notes: s.notes ?? undefined,
  }))
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

const C = {
  bg: '#0a0a0a',
  surface: '#111111',
  surface2: '#1a1a1a',
  border: '#2a2a2a',
  lime: '#D7FF00',
  limeR: 215, limeG: 255, limeB: 0,
  white: '#f0f0f0',
  muted: '#888888',
  mutedR: 136, mutedG: 136, mutedB: 136,
  danger: '#ff4757',
  dangerR: 255, dangerG: 71, dangerB: 87,
  good: '#4ade80',
  goodR: 74, goodG: 222, goodB: 128,
} as const

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function setFill(doc: jsPDF, hex: string) {
  doc.setFillColor(...hexToRgb(hex))
}
function setDraw(doc: jsPDF, hex: string) {
  doc.setDrawColor(...hexToRgb(hex))
}
function setTextColor(doc: jsPDF, hex: string) {
  doc.setTextColor(...hexToRgb(hex))
}

// ─── Main PDF export ──────────────────────────────────────────────────────────

export function downloadStatsPdf(stats: BodyStat[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const MARGIN = 14

  // ── Background ──────────────────────────────────────────────────
  setFill(doc, C.bg)
  doc.rect(0, 0, 210, 297, 'F')

  // ── Header bar ──────────────────────────────────────────────────
  setFill(doc, C.lime)
  doc.rect(0, 0, W, 22, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setTextColor(doc, '#0a0a0a')
  doc.text('FITNESS TRACKER', MARGIN, 14)

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${today}`, W - MARGIN, 14, { align: 'right' })

  // ── Summary cards ────────────────────────────────────────────────
  let y = 32

  const weightStats = stats.filter((s) => s.weight_kg != null)
  const waistStats = stats.filter((s) => s.waist_cm != null)
  const latestWeight = weightStats.length > 0 ? weightStats[weightStats.length - 1]!.weight_kg! : null
  const latestWaist = waistStats.length > 0 ? waistStats[waistStats.length - 1]!.waist_cm! : null
  const weightDelta = latestWeight != null ? latestWeight - START_WEIGHT : null
  const waistDelta = latestWaist != null ? latestWaist - START_WAIST : null

  const cards = [
    { label: 'Current Weight', value: latestWeight != null ? `${latestWeight.toFixed(1)} kg` : '—', delta: weightDelta, unit: 'kg' },
    { label: 'Current Waist', value: latestWaist != null ? `${latestWaist.toFixed(1)} cm` : '—', delta: waistDelta, unit: 'cm' },
    { label: 'Total Entries', value: String(stats.length), delta: null, unit: '' },
  ]

  const cardW = (W - MARGIN * 2 - 8) / 3
  cards.forEach((card, i) => {
    const cx = MARGIN + i * (cardW + 4)
    // Card bg
    setFill(doc, C.surface)
    setDraw(doc, C.border)
    doc.roundedRect(cx, y, cardW, 28, 2, 2, 'FD')
    // Top lime border
    setFill(doc, C.lime)
    doc.rect(cx, y, cardW, 1.5, 'F')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, C.muted)
    doc.text(card.label.toUpperCase(), cx + cardW / 2, y + 7, { align: 'center' })

    // Value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    setTextColor(doc, C.lime)
    doc.text(card.value, cx + cardW / 2, y + 16, { align: 'center' })

    // Delta
    if (card.delta != null) {
      const isGood = card.delta < 0
      const sign = card.delta > 0 ? '+' : ''
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      setTextColor(doc, isGood ? C.good : C.danger)
      doc.text(`${sign}${card.delta.toFixed(1)} ${card.unit} from start`, cx + cardW / 2, y + 23, { align: 'center' })
    }
  })

  y += 36

  // ── Table header ─────────────────────────────────────────────────
  const cols = [
    { header: 'DATE', x: MARGIN, w: 38, align: 'left' as const },
    { header: 'WEIGHT (kg)', x: MARGIN + 40, w: 32, align: 'center' as const },
    { header: 'WAIST (cm)', x: MARGIN + 74, w: 32, align: 'center' as const },
    { header: 'NOTES', x: MARGIN + 108, w: W - MARGIN * 2 - 108, align: 'left' as const },
  ]

  setFill(doc, C.surface2)
  doc.rect(MARGIN, y, W - MARGIN * 2, 8, 'F')
  // Bottom border
  setDraw(doc, C.lime)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y + 8, W - MARGIN, y + 8)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setTextColor(doc, C.muted)
  cols.forEach((col) => {
    const tx = col.align === 'center' ? col.x + col.w / 2 : col.x + 2
    doc.text(col.header, tx, y + 5.5, { align: col.align })
  })

  y += 10

  // ── Table rows ───────────────────────────────────────────────────
  const ROW_H = 10
  const PAGE_BOTTOM = 280

  const sorted = [...stats].sort((a, b) => b.date.localeCompare(a.date))

  sorted.forEach((stat, idx) => {
    // New page if needed
    if (y + ROW_H > PAGE_BOTTOM) {
      doc.addPage()
      setFill(doc, C.bg)
      doc.rect(0, 0, 210, 297, 'F')

      // Continuation header
      setFill(doc, C.surface2)
      doc.rect(MARGIN, 14, W - MARGIN * 2, 8, 'F')
      setDraw(doc, C.lime)
      doc.line(MARGIN, 22, W - MARGIN, 22)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      setTextColor(doc, C.muted)
      cols.forEach((col) => {
        const tx = col.align === 'center' ? col.x + col.w / 2 : col.x + 2
        doc.text(col.header, tx, 19.5, { align: col.align })
      })
      y = 26
    }

    // Row bg
    if (idx % 2 === 0) {
      setFill(doc, '#0f0f0f')
      doc.rect(MARGIN, y - 1, W - MARGIN * 2, ROW_H, 'F')
    }

    // Subtle separator
    setDraw(doc, C.border)
    doc.setLineWidth(0.1)
    doc.line(MARGIN, y + ROW_H - 1, W - MARGIN, y + ROW_H - 1)

    const d = new Date(stat.date + 'T12:00:00')
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    // Date
    setTextColor(doc, C.white)
    doc.text(dateStr, cols[0]!.x + 2, y + 6)

    // Weight
    if (stat.weight_kg != null) {
      setTextColor(doc, C.lime)
      doc.setFont('helvetica', 'bold')
      doc.text(stat.weight_kg.toFixed(1), cols[1]!.x + cols[1]!.w / 2, y + 6, { align: 'center' })
    } else {
      setTextColor(doc, C.muted)
      doc.setFont('helvetica', 'normal')
      doc.text('—', cols[1]!.x + cols[1]!.w / 2, y + 6, { align: 'center' })
    }

    // Waist
    if (stat.waist_cm != null) {
      setTextColor(doc, '#aaaaaa')
      doc.setFont('helvetica', 'bold')
      doc.text(stat.waist_cm.toFixed(1), cols[2]!.x + cols[2]!.w / 2, y + 6, { align: 'center' })
    } else {
      setTextColor(doc, C.muted)
      doc.setFont('helvetica', 'normal')
      doc.text('—', cols[2]!.x + cols[2]!.w / 2, y + 6, { align: 'center' })
    }

    // Notes — strip non-ASCII (Hebrew chars won't render in default font)
    if (stat.notes) {
      const safeNotes = stat.notes.replace(/[^\x00-\x7F]/g, '?')
      setTextColor(doc, C.muted)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const maxW = cols[3]!.w - 4
      const truncated = doc.getTextWidth(safeNotes) > maxW
        ? doc.splitTextToSize(safeNotes, maxW)[0] + '…'
        : safeNotes
      doc.text(truncated, cols[3]!.x + 2, y + 6)
    }

    y += ROW_H
  })

  // ── Footer ───────────────────────────────────────────────────────
  const totalPages = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    setDraw(doc, C.border)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, 288, W - MARGIN, 288)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, '#333333')
    doc.text('FITNESS TRACKER — BODY STATS EXPORT', MARGIN, 293)
    doc.text(`${p} / ${totalPages}`, W - MARGIN, 293, { align: 'right' })
  }

  doc.save(`body-stats-${new Date().toISOString().slice(0, 10)}.pdf`)
}
