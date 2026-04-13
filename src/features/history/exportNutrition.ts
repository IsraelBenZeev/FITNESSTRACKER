import { jsPDF } from 'jspdf'
import type { NutritionLog } from '../../types/nutrition'
import { GOAL_CALORIES, GOAL_PROTEIN } from '../../lib/constants'

// ─── JSON copy ────────────────────────────────────────────────────────────────

export async function copyNutritionAsJson(logs: NutritionLog[]): Promise<void> {
  const payload = logs.map((l) => ({
    date: l.date,
    time: l.time ?? undefined,
    meal_name: l.meal_name,
    food_items: l.food_items ?? undefined,
    calories: l.calories,
    protein_g: l.protein_g ?? undefined,
    carbs_g: l.carbs_g ?? undefined,
    fat_g: l.fat_g ?? undefined,
    notes: l.notes ?? undefined,
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
  white: '#f0f0f0',
  muted: '#888888',
  danger: '#ff4757',
  good: '#4ade80',
} as const

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function setFill(doc: jsPDF, hex: string) { doc.setFillColor(...hexToRgb(hex)) }
function setDraw(doc: jsPDF, hex: string) { doc.setDrawColor(...hexToRgb(hex)) }
function setTextColor(doc: jsPDF, hex: string) { doc.setTextColor(...hexToRgb(hex)) }

// jsPDF renders LTR only — reverse Hebrew strings so they display correctly
function rtl(text: string): string {
  return text.split('').reverse().join('')
}

// Load David Hebrew TTF font via FileReader (reliable binary → base64)
async function loadHebrewFont(doc: jsPDF): Promise<void> {
  const response = await fetch('/fonts/David-Regular.ttf')
  const blob = await response.blob()
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.split(',')[1]!)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  doc.addFileToVFS('David-Regular.ttf', base64)
  doc.addFont('David-Regular.ttf', 'David', 'normal')
}

// Format a date string to "13 Apr 2025"
function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Main PDF export ──────────────────────────────────────────────────────────

export async function downloadNutritionPdf(logs: NutritionLog[], rangeLabel: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  await loadHebrewFont(doc)

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

  const dayMap = new Map<string, { calories: number; protein: number }>()
  for (const log of logs) {
    const ex = dayMap.get(log.date) ?? { calories: 0, protein: 0 }
    dayMap.set(log.date, {
      calories: ex.calories + log.calories,
      protein: ex.protein + (log.protein_g ?? 0),
    })
  }
  const totalDays = dayMap.size
  const avgCalories = totalDays > 0
    ? logs.reduce((s, l) => s + l.calories, 0) / totalDays
    : 0
  const avgProtein = totalDays > 0
    ? logs.reduce((s, l) => s + (l.protein_g ?? 0), 0) / totalDays
    : 0

  const cards = [
    { label: 'Total Days', value: String(totalDays), delta: null as number | null, sub: `${logs.length} meals` },
    { label: 'Avg Calories/Day', value: Math.round(avgCalories).toString(), delta: avgCalories > 0 ? avgCalories - GOAL_CALORIES : null, sub: `goal: ${GOAL_CALORIES}` },
    { label: 'Avg Protein/Day', value: `${Math.round(avgProtein)}g`, delta: avgProtein > 0 ? avgProtein - GOAL_PROTEIN : null, sub: `goal: ${GOAL_PROTEIN}g` },
  ]

  const cardW = (W - MARGIN * 2 - 8) / 3
  cards.forEach((card, i) => {
    const cx = MARGIN + i * (cardW + 4)
    setFill(doc, C.surface)
    setDraw(doc, C.border)
    doc.roundedRect(cx, y, cardW, 28, 2, 2, 'FD')
    setFill(doc, C.lime)
    doc.rect(cx, y, cardW, 1.5, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, C.muted)
    doc.text(card.label.toUpperCase(), cx + cardW / 2, y + 7, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    setTextColor(doc, C.lime)
    doc.text(card.value, cx + cardW / 2, y + 16, { align: 'center' })

    if (card.delta != null) {
      const isGood = card.delta <= 0
      const sign = card.delta > 0 ? '+' : ''
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      setTextColor(doc, isGood ? C.good : C.danger)
      doc.text(`${sign}${Math.round(card.delta)} vs goal`, cx + cardW / 2, y + 23, { align: 'center' })
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      setTextColor(doc, C.muted)
      doc.text(card.sub, cx + cardW / 2, y + 23, { align: 'center' })
    }
  })

  y += 36

  // ── Range label ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTextColor(doc, C.muted)
  doc.text(`Range: ${rangeLabel}`, MARGIN, y)
  y += 8

  // ── Column definitions ────────────────────────────────────────────
  const cols = [
    { header: 'MEAL',    x: MARGIN,       w: 80, align: 'left'   as const },
    { header: 'KCAL',   x: MARGIN + 82,  w: 24, align: 'center' as const },
    { header: 'P (g)',  x: MARGIN + 108, w: 20, align: 'center' as const },
    { header: 'C (g)',  x: MARGIN + 130, w: 20, align: 'center' as const },
    { header: 'F (g)',  x: MARGIN + 152, w: 20, align: 'center' as const },
  ]

  function drawTableHeader(atY: number) {
    setFill(doc, C.surface2)
    doc.rect(MARGIN, atY, W - MARGIN * 2, 8, 'F')
    setDraw(doc, C.lime)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, atY + 8, W - MARGIN, atY + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setTextColor(doc, C.muted)
    cols.forEach((col) => {
      const tx = col.align === 'center' ? col.x + col.w / 2 : col.x + 2
      doc.text(col.header, tx, atY + 5.5, { align: col.align })
    })
  }

  drawTableHeader(y)
  y += 10

  // ── Group logs by date ────────────────────────────────────────────
  const sorted = [...logs].sort((a, b) => {
    const d = b.date.localeCompare(a.date)
    return d !== 0 ? d : (b.time ?? '').localeCompare(a.time ?? '')
  })

  // Build groups: [ { date, rows: NutritionLog[] } ]
  const groups: { date: string; rows: NutritionLog[] }[] = []
  for (const log of sorted) {
    const last = groups[groups.length - 1]
    if (last && last.date === log.date) {
      last.rows.push(log)
    } else {
      groups.push({ date: log.date, rows: [log] })
    }
  }

  const ROW_H = 9
  const DATE_HEADER_H = 10
  const PAGE_BOTTOM = 280

  function newPage() {
    doc.addPage()
    setFill(doc, C.bg)
    doc.rect(0, 0, 210, 297, 'F')
    drawTableHeader(14)
    y = 26
  }

  groups.forEach((group, groupIdx) => {
    // Add spacing between day groups (except first)
    if (groupIdx > 0) {
      y += 4
    }

    // Check if date header fits, otherwise new page
    if (y + DATE_HEADER_H > PAGE_BOTTOM) newPage()

    // ── Date header row ──────────────────────────────────────────
    setFill(doc, '#161616')
    doc.rect(MARGIN, y - 1, W - MARGIN * 2, DATE_HEADER_H, 'F')

    // Left lime accent strip
    setFill(doc, C.lime)
    doc.rect(MARGIN, y - 1, 3, DATE_HEADER_H, 'F')

    // Date totals for this day
    const dayCalories = group.rows.reduce((s, l) => s + l.calories, 0)
    const dayProtein  = group.rows.reduce((s, l) => s + (l.protein_g ?? 0), 0)
    const dayCarbs    = group.rows.reduce((s, l) => s + (l.carbs_g   ?? 0), 0)
    const dayFat      = group.rows.reduce((s, l) => s + (l.fat_g     ?? 0), 0)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    setTextColor(doc, C.lime)
    doc.text(fmtDate(group.date), MARGIN + 6, y + 6)

    // Day totals inline (right side)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setTextColor(doc, '#aaaaaa')
    const totalsStr = `${dayCalories} kcal  |  P: ${Math.round(dayProtein)}g  C: ${Math.round(dayCarbs)}g  F: ${Math.round(dayFat)}g`
    doc.text(totalsStr, W - MARGIN, y + 6, { align: 'right' })

    // Bottom border under date header
    setDraw(doc, '#2a2a2a')
    doc.setLineWidth(0.2)
    doc.line(MARGIN, y + DATE_HEADER_H - 1, W - MARGIN, y + DATE_HEADER_H - 1)

    y += DATE_HEADER_H + 1

    // ── Meal rows ────────────────────────────────────────────────
    group.rows.forEach((log, rowIdx) => {
      if (y + ROW_H > PAGE_BOTTOM) newPage()

      // Alternating row bg
      if (rowIdx % 2 === 0) {
        setFill(doc, '#0d0d0d')
        doc.rect(MARGIN, y - 1, W - MARGIN * 2, ROW_H, 'F')
      }

      setDraw(doc, '#1e1e1e')
      doc.setLineWidth(0.1)
      doc.line(MARGIN, y + ROW_H - 1, W - MARGIN, y + ROW_H - 1)

      // Meal name — David font supports Hebrew
      doc.setFont('David', 'normal')
      doc.setFontSize(8)
      setTextColor(doc, '#cccccc')
      const mealMaxW = cols[0]!.w - 4
      const mealText = doc.splitTextToSize(rtl(log.meal_name), mealMaxW)[0] as string
      doc.text(mealText, cols[0]!.x + 2, y + 6)

      // Calories
      doc.setFont('helvetica', 'bold')
      setTextColor(doc, C.lime)
      doc.text(String(log.calories), cols[1]!.x + cols[1]!.w / 2, y + 6, { align: 'center' })

      // Protein / Carbs / Fat
      doc.setFont('helvetica', 'normal')
      setTextColor(doc, '#aaaaaa')
      doc.text(log.protein_g != null ? String(Math.round(log.protein_g)) : '—', cols[2]!.x + cols[2]!.w / 2, y + 6, { align: 'center' })
      doc.text(log.carbs_g   != null ? String(Math.round(log.carbs_g))   : '—', cols[3]!.x + cols[3]!.w / 2, y + 6, { align: 'center' })
      doc.text(log.fat_g     != null ? String(Math.round(log.fat_g))     : '—', cols[4]!.x + cols[4]!.w / 2, y + 6, { align: 'center' })

      y += ROW_H
    })
  })

  // ── Footer on every page ─────────────────────────────────────────
  const totalPages = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    setDraw(doc, C.border)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, 288, W - MARGIN, 288)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, '#333333')
    doc.text('FITNESS TRACKER — NUTRITION EXPORT', MARGIN, 293)
    doc.text(`${p} / ${totalPages}`, W - MARGIN, 293, { align: 'right' })
  }

  const rangeSlug = rangeLabel.replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  doc.save(`nutrition-${rangeSlug}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
