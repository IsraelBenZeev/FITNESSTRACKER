import { jsPDF } from 'jspdf'
import type { WorkoutPlan } from '../../types/workout'
import {
  PDF_C, PDF_MARGIN,
  setFill, setTextColor,
  rtl, loadHebrewFont,
  drawBackground, drawHeaderBar, drawSummaryCards, drawFooter,
  todayLabel,
} from '../../lib/pdf'

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

// ─── JSON copy ────────────────────────────────────────────────────────────────

export async function copyPlanAsJson(plan: WorkoutPlan): Promise<void> {
  const payload = {
    name: plan.name,
    ...(plan.description ? { description: plan.description } : {}),
    ...(plan.difficulty   ? { difficulty:  plan.difficulty  } : {}),
    training_days: plan.training_days,
    exercises: (plan.exercises ?? []).map((e) => e.exercise_name),
  }
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
}

// ─── PDF export ───────────────────────────────────────────────────────────────

export async function downloadPlanPdf(plan: WorkoutPlan): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  await loadHebrewFont(doc)

  const W     = 210
  const M     = PDF_MARGIN
  const RIGHT = W - M

  drawBackground(doc)
  drawHeaderBar(doc, {
    title:    'WORKOUT PLAN — FITNESS TRACKER',
    subtitle: `Generated: ${todayLabel()}`,
  })

  const exercises = plan.exercises ?? []

  const difficultyCards = plan.difficulty
    ? [{ label: 'DIFFICULTY', value: rtl(plan.difficulty) }]
    : []

  drawSummaryCards(doc, [
    { label: 'EXERCISES', value: String(exercises.length) },
    ...difficultyCards,
    { label: 'TRAINING DAYS', value: String(plan.training_days.length) },
  ], 28)

  let y = 66

  // ── Plan name ──────────────────────────────────────────────────────────────
  doc.setFont('NotoSansHebrew', 'normal')
  doc.setFontSize(14)
  setTextColor(doc, PDF_C.white)
  doc.text(rtl(plan.name), RIGHT, y, { align: 'right' })
  y += 8

  // ── Description ────────────────────────────────────────────────────────────
  if (plan.description) {
    doc.setFont('NotoSansHebrew', 'normal')
    doc.setFontSize(8)
    setTextColor(doc, PDF_C.muted)
    doc.text(rtl(plan.description), RIGHT, y, { align: 'right' })
    y += 7
  }

  // ── Training days ──────────────────────────────────────────────────────────
  if (plan.training_days.length > 0) {
    const sorted = [...plan.training_days].sort((a, b) => a - b)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setTextColor(doc, PDF_C.muted)
    doc.text('ימי אימון:', RIGHT, y, { align: 'right' })
    let dx = RIGHT - 22
    for (const d of sorted) {
      setFill(doc, '#1a1a1a')
      doc.roundedRect(dx - 8, y - 4, 14, 6, 1.5, 1.5, 'F')
      setTextColor(doc, PDF_C.lime)
      doc.setFont('NotoSansHebrew', 'normal')
      doc.setFontSize(7)
      doc.text(rtl(DAY_NAMES[d]), dx + 3, y, { align: 'right' })
      dx -= 16
    }
    y += 10
  }

  // ── Divider ────────────────────────────────────────────────────────────────
  setFill(doc, PDF_C.border)
  doc.rect(M, y, W - M * 2, 0.3, 'F')
  y += 6

  // ── Section label ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setTextColor(doc, PDF_C.muted)
  doc.text('EXERCISES', M, y)
  y += 6

  // ── Exercise rows ──────────────────────────────────────────────────────────
  const PAGE_BOTTOM = 280

  exercises.forEach((ex, i) => {
    if (y + 9 > PAGE_BOTTOM) {
      doc.addPage()
      drawBackground(doc)
      y = 20
    }

    if (i % 2 === 0) {
      setFill(doc, '#0f0f0f')
      doc.rect(M, y - 1, W - M * 2, 8, 'F')
    }

    // Index badge
    setFill(doc, 'rgba(215,255,0,0.08)' as string)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setTextColor(doc, PDF_C.lime)
    doc.text(String(i + 1), M + 4, y + 4.5)

    // Exercise name
    doc.setFont('NotoSansHebrew', 'normal')
    doc.setFontSize(8.5)
    setTextColor(doc, PDF_C.white)
    doc.text(rtl(ex.exercise_name), RIGHT - 4, y + 4.5, { align: 'right' })

    y += 9
  })

  drawFooter(doc, `FITNESS TRACKER — ${plan.name.toUpperCase()}`)
  doc.save(`plan-${plan.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
