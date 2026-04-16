import { jsPDF } from 'jspdf'
import type { NutritionLog } from '../../types/nutrition'
import { GOAL_CALORIES, GOAL_PROTEIN } from '../../lib/constants'
import {
  PDF_C, PDF_MARGIN,
  setFill, setDraw, setTextColor,
  rtl, loadHebrewFont,
  drawBackground, drawHeaderBar, drawSummaryCards, drawFooter,
  todayLabel, fmtDate,
} from '../../lib/pdf'

// ─── JSON copy ────────────────────────────────────────────────────────────────

export function buildNutritionJsonText(logs: NutritionLog[]): string {
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
  return JSON.stringify(payload, null, 2)
}

export async function copyNutritionAsJson(logs: NutritionLog[]): Promise<void> {
  await writeToClipboard(buildNutritionJsonText(logs))
}

// iOS Safari loses gesture trust after any network await, so we must start
// the clipboard write synchronously. Pass a Promise<Blob> to ClipboardItem —
// iOS waits for the data while keeping the gesture alive.
export async function copyNutritionAsJsonFromPromise(
  logsPromise: Promise<NutritionLog[]>,
): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    const blobPromise = logsPromise.then((logs) => {
      if (logs.length === 0) throw new Error('empty')
      return new Blob([buildNutritionJsonText(logs)], { type: 'text/plain' })
    })
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blobPromise })])
  } else {
    const logs = await logsPromise
    if (logs.length === 0) throw new Error('empty')
    await writeToClipboard(buildNutritionJsonText(logs))
  }
}

async function writeToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  if (!ok) throw new Error('copy failed')
}

// ─── PDF export ───────────────────────────────────────────────────────────────

// RTL columns: F | C | P | KCAL | ארוחה →
const COLS = [
  { header: 'F (g)', x: PDF_MARGIN,      w: 20, align: 'center' as const },
  { header: 'C (g)', x: PDF_MARGIN + 22, w: 20, align: 'center' as const },
  { header: 'P (g)', x: PDF_MARGIN + 44, w: 20, align: 'center' as const },
  { header: 'KCAL',  x: PDF_MARGIN + 66, w: 24, align: 'center' as const },
  { header: 'MEAL',  x: PDF_MARGIN + 92, w: 90, align: 'right'  as const },
]

export async function downloadNutritionPdf(logs: NutritionLog[], rangeLabel: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  await loadHebrewFont(doc)

  const W = 210
  const M = PDF_MARGIN
  const RIGHT = W - M
  const PAGE_BOTTOM = 280

  // ── Stats for summary cards ────────────────────────────────────
  const dayMap = new Map<string, { calories: number; protein: number }>()
  for (const log of logs) {
    const ex = dayMap.get(log.date) ?? { calories: 0, protein: 0 }
    dayMap.set(log.date, {
      calories: ex.calories + log.calories,
      protein: ex.protein + (log.protein_g ?? 0),
    })
  }
  const totalDays = dayMap.size
  const avgCalories = totalDays > 0 ? logs.reduce((s, l) => s + l.calories, 0) / totalDays : 0
  const avgProtein  = totalDays > 0 ? logs.reduce((s, l) => s + (l.protein_g ?? 0), 0) / totalDays : 0

  const calDelta  = avgCalories > 0 ? Math.round(avgCalories - GOAL_CALORIES) : null
  const protDelta = avgProtein  > 0 ? Math.round(avgProtein  - GOAL_PROTEIN)  : null

  // ── First page ─────────────────────────────────────────────────
  drawBackground(doc)
  drawHeaderBar(doc, {
    title: 'NUTRITION — FITNESS TRACKER',
    subtitle: `Generated: ${todayLabel()}`,
  })
  let y = drawSummaryCards(doc, [
    { label: 'TOTAL DAYS',     value: String(totalDays),             sub: `${logs.length} meals` },
    { label: 'AVG KCAL / DAY', value: String(Math.round(avgCalories)), sub: calDelta  != null ? `${calDelta  > 0 ? '+' : ''}${calDelta} vs goal`  : `goal: ${GOAL_CALORIES}`, subColor: calDelta  != null ? (calDelta  <= 0 ? PDF_C.good : PDF_C.danger) : undefined },
    { label: 'AVG PROTEIN / DAY', value: `${Math.round(avgProtein)}g`, sub: protDelta != null ? `${protDelta > 0 ? '+' : ''}${protDelta}g vs goal` : `goal: ${GOAL_PROTEIN}g`, subColor: protDelta != null ? (protDelta <= 0 ? PDF_C.good : PDF_C.danger) : undefined },
  ], 28)

  // Range label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTextColor(doc, PDF_C.muted)
  doc.text(`Range: ${rangeLabel}`, M, y)
  y += 8

  // ── Table header ────────────────────────────────────────────────
  function drawTableHeader(atY: number) {
    setFill(doc, PDF_C.surface2)
    doc.rect(M, atY, W - M * 2, 8, 'F')
    setDraw(doc, PDF_C.lime)
    doc.setLineWidth(0.3)
    doc.line(M, atY + 8, RIGHT, atY + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setTextColor(doc, PDF_C.muted)
    COLS.forEach(({ header, x, w, align }) => {
      const tx = align === 'center' ? x + w / 2 : x + w - 2
      doc.text(header, tx, atY + 5.5, { align })
    })
  }

  drawTableHeader(y)
  y += 10

  // ── Group logs by date ─────────────────────────────────────────
  const sorted = [...logs].sort((a, b) => {
    const d = b.date.localeCompare(a.date)
    return d !== 0 ? d : (b.time ?? '').localeCompare(a.time ?? '')
  })

  const groups: { date: string; rows: NutritionLog[] }[] = []
  for (const log of sorted) {
    const last = groups[groups.length - 1]
    if (last && last.date === log.date) last.rows.push(log)
    else groups.push({ date: log.date, rows: [log] })
  }

  const ROW_H = 9
  const DATE_H = 10

  function newPage() {
    doc.addPage()
    drawBackground(doc)
    drawTableHeader(14)
    y = 26
  }

  groups.forEach((group, gi) => {
    if (gi > 0) y += 4
    if (y + DATE_H > PAGE_BOTTOM) newPage()

    // ── Date header (RTL) ──────────────────────────────────────
    setFill(doc, '#161616')
    doc.rect(M, y - 1, W - M * 2, DATE_H, 'F')
    setFill(doc, PDF_C.lime)
    doc.rect(RIGHT - 3, y - 1, 3, DATE_H, 'F')   // lime strip RIGHT

    const dayCalories = group.rows.reduce((s, l) => s + l.calories, 0)
    const dayProtein  = group.rows.reduce((s, l) => s + (l.protein_g ?? 0), 0)
    const dayCarbs    = group.rows.reduce((s, l) => s + (l.carbs_g   ?? 0), 0)
    const dayFat      = group.rows.reduce((s, l) => s + (l.fat_g     ?? 0), 0)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    setTextColor(doc, PDF_C.lime)
    doc.text(fmtDate(group.date), RIGHT - 6, y + 6, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setTextColor(doc, '#aaaaaa')
    doc.text(
      `F: ${Math.round(dayFat)}g  C: ${Math.round(dayCarbs)}g  P: ${Math.round(dayProtein)}g  |  ${dayCalories} kcal`,
      M, y + 6,
    )

    setDraw(doc, PDF_C.border)
    doc.setLineWidth(0.2)
    doc.line(M, y + DATE_H - 1, RIGHT, y + DATE_H - 1)
    y += DATE_H + 1

    // ── Meal rows (RTL) ───────────────────────────────────────
    group.rows.forEach((log, ri) => {
      if (y + ROW_H > PAGE_BOTTOM) newPage()

      if (ri % 2 === 0) {
        setFill(doc, '#0d0d0d')
        doc.rect(M, y - 1, W - M * 2, ROW_H, 'F')
      }
      setDraw(doc, '#1e1e1e')
      doc.setLineWidth(0.1)
      doc.line(M, y + ROW_H - 1, RIGHT, y + ROW_H - 1)

      // MEAL — NotoSansHebrew, right-aligned
      const mealCol = COLS[4]!
      doc.setFont('NotoSansHebrew', 'normal')
      doc.setFontSize(8)
      setTextColor(doc, '#cccccc')
      const mealText = doc.splitTextToSize(rtl(log.meal_name), mealCol.w - 4)[0] as string
      doc.text(mealText, mealCol.x + mealCol.w - 2, y + 6, { align: 'right' })

      // KCAL
      doc.setFont('helvetica', 'bold')
      setTextColor(doc, PDF_C.lime)
      doc.text(String(log.calories), COLS[3]!.x + COLS[3]!.w / 2, y + 6, { align: 'center' })

      // P / C / F
      doc.setFont('helvetica', 'normal')
      setTextColor(doc, '#aaaaaa')
      doc.text(log.protein_g != null ? String(Math.round(log.protein_g)) : '-', COLS[2]!.x + COLS[2]!.w / 2, y + 6, { align: 'center' })
      doc.text(log.carbs_g   != null ? String(Math.round(log.carbs_g))   : '-', COLS[1]!.x + COLS[1]!.w / 2, y + 6, { align: 'center' })
      doc.text(log.fat_g     != null ? String(Math.round(log.fat_g))     : '-', COLS[0]!.x + COLS[0]!.w / 2, y + 6, { align: 'center' })

      y += ROW_H
    })
  })

  drawFooter(doc, 'FITNESS TRACKER — NUTRITION EXPORT')
  const rangeSlug = rangeLabel.replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  doc.save(`nutrition-${rangeSlug}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
