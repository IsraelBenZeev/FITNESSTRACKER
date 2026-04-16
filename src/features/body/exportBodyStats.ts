import { jsPDF } from 'jspdf'
import type { BodyStat } from '../../types/body'
import { START_WEIGHT, START_WAIST } from '../../lib/constants'
import {
  PDF_C, PDF_MARGIN,
  setFill, setDraw, setTextColor,
  loadHebrewFont,
  drawBackground, drawHeaderBar, drawSummaryCards, drawFooter,
  todayLabel, fmtDate,
} from '../../lib/pdf'

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

// ─── PDF export ───────────────────────────────────────────────────────────────

export async function downloadStatsPdf(stats: BodyStat[]): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  await loadHebrewFont(doc)

  const W = 210
  const M = PDF_MARGIN
  const RIGHT = W - M
  const PAGE_BOTTOM = 280

  const weightStats = stats.filter((s) => s.weight_kg != null)
  const waistStats  = stats.filter((s) => s.waist_cm  != null)
  const latestWeight = weightStats.length > 0 ? weightStats[weightStats.length - 1]!.weight_kg! : null
  const latestWaist  = waistStats.length  > 0 ? waistStats[waistStats.length - 1]!.waist_cm!   : null
  const weightDelta  = latestWeight != null ? latestWeight - START_WEIGHT : null
  const waistDelta   = latestWaist  != null ? latestWaist  - START_WAIST  : null

  // ── First page ─────────────────────────────────────────────────
  drawBackground(doc)
  drawHeaderBar(doc, {
    title: 'BODY STATS — FITNESS TRACKER',
    subtitle: `Generated: ${todayLabel()}`,
  })
  drawSummaryCards(doc, [
    {
      label: 'CURRENT WEIGHT',
      value: latestWeight != null ? `${latestWeight.toFixed(1)} kg` : '—',
      sub: weightDelta != null
        ? `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} kg from start`
        : undefined,
      subColor: weightDelta != null ? (weightDelta < 0 ? PDF_C.good : PDF_C.danger) : undefined,
    },
    {
      label: 'CURRENT WAIST',
      value: latestWaist != null ? `${latestWaist.toFixed(1)} cm` : '—',
      sub: waistDelta != null
        ? `${waistDelta > 0 ? '+' : ''}${waistDelta.toFixed(1)} cm from start`
        : undefined,
      subColor: waistDelta != null ? (waistDelta < 0 ? PDF_C.good : PDF_C.danger) : undefined,
    },
    { label: 'TOTAL ENTRIES', value: String(stats.length) },
  ], 28)

  // ── Table header ────────────────────────────────────────────────
  const cols = [
    { header: 'NOTES',      x: M,       w: W - M * 2 - 108, align: 'left'   as const },
    { header: 'WAIST (cm)', x: M + (W - M * 2 - 108) + 2, w: 32, align: 'center' as const },
    { header: 'WEIGHT (kg)',x: M + (W - M * 2 - 108) + 36, w: 32, align: 'center' as const },
    { header: 'DATE',       x: M + (W - M * 2 - 108) + 70, w: 38, align: 'right'  as const },
  ]

  let y = 66

  function drawTableHeader(atY: number) {
    setFill(doc, PDF_C.surface2)
    doc.rect(M, atY, W - M * 2, 8, 'F')
    setDraw(doc, PDF_C.lime)
    doc.setLineWidth(0.3)
    doc.line(M, atY + 8, RIGHT, atY + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setTextColor(doc, PDF_C.muted)
    cols.forEach(({ header, x, w, align }) => {
      const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w - 2 : x + 2
      doc.text(header, tx, atY + 5.5, { align })
    })
  }

  drawTableHeader(y)
  y += 10

  const ROW_H = 10
  const sorted = [...stats].sort((a, b) => b.date.localeCompare(a.date))

  sorted.forEach((stat, idx) => {
    if (y + ROW_H > PAGE_BOTTOM) {
      doc.addPage()
      drawBackground(doc)
      drawTableHeader(14)
      y = 26
    }

    if (idx % 2 === 0) {
      setFill(doc, '#0f0f0f')
      doc.rect(M, y - 1, W - M * 2, ROW_H, 'F')
    }

    setDraw(doc, PDF_C.border)
    doc.setLineWidth(0.1)
    doc.line(M, y + ROW_H - 1, RIGHT, y + ROW_H - 1)

    // DATE (rightmost)
    setTextColor(doc, PDF_C.lime)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(fmtDate(stat.date), cols[3]!.x + cols[3]!.w - 2, y + 6, { align: 'right' })

    // WEIGHT
    if (stat.weight_kg != null) {
      setTextColor(doc, PDF_C.lime)
      doc.setFont('helvetica', 'bold')
      doc.text(stat.weight_kg.toFixed(1), cols[2]!.x + cols[2]!.w / 2, y + 6, { align: 'center' })
    } else {
      setTextColor(doc, PDF_C.muted)
      doc.setFont('helvetica', 'normal')
      doc.text('—', cols[2]!.x + cols[2]!.w / 2, y + 6, { align: 'center' })
    }

    // WAIST
    if (stat.waist_cm != null) {
      setTextColor(doc, '#aaaaaa')
      doc.setFont('helvetica', 'bold')
      doc.text(stat.waist_cm.toFixed(1), cols[1]!.x + cols[1]!.w / 2, y + 6, { align: 'center' })
    } else {
      setTextColor(doc, PDF_C.muted)
      doc.setFont('helvetica', 'normal')
      doc.text('—', cols[1]!.x + cols[1]!.w / 2, y + 6, { align: 'center' })
    }

    // NOTES (leftmost) — strip non-ASCII
    if (stat.notes) {
      const safe = stat.notes.replace(/[^\x00-\x7F]/g, '?')
      setTextColor(doc, PDF_C.muted)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const maxW = cols[0]!.w - 4
      const truncated = doc.getTextWidth(safe) > maxW
        ? doc.splitTextToSize(safe, maxW)[0] + '…'
        : safe
      doc.text(truncated, cols[0]!.x + 2, y + 6)
    }

    y += ROW_H
  })

  drawFooter(doc, 'FITNESS TRACKER — BODY STATS EXPORT')
  doc.save(`body-stats-${new Date().toISOString().slice(0, 10)}.pdf`)
}
