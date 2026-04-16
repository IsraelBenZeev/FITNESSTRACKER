import { jsPDF } from 'jspdf'
import type { WorkoutLog } from '../../types/workout'
import {
  PDF_C, PDF_MARGIN,
  setFill, setDraw, setTextColor,
  rtl, loadHebrewFont,
  drawBackground, drawHeaderBar, drawSummaryCards, drawFooter,
  todayLabel, fmtDateWeekday,
} from '../../lib/pdf'

// ─── JSON copy ────────────────────────────────────────────────────────────────

export async function copyWorkoutLogsAsJson(logs: WorkoutLog[]): Promise<void> {
  const payload = logs.map((log) => {
    const exerciseMap = new Map<string, { set_number: number; reps: number | null; weight_kg: number | null }[]>()
    for (const s of log.set_logs ?? []) {
      if (!exerciseMap.has(s.exercise_name)) exerciseMap.set(s.exercise_name, [])
      exerciseMap.get(s.exercise_name)!.push({
        set_number: s.set_number,
        reps: s.reps,
        weight_kg: s.weight_kg,
      })
    }
    return {
      date: log.date,
      notes: log.notes ?? undefined,
      exercises: [...exerciseMap.entries()].map(([name, sets]) => ({ name, sets })),
    }
  })
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
}

// ─── PDF export ───────────────────────────────────────────────────────────────

function groupByExercise(log: WorkoutLog) {
  const map = new Map<string, typeof log.set_logs>()
  for (const s of log.set_logs ?? []) {
    if (!map.has(s.exercise_name)) map.set(s.exercise_name, [])
    map.get(s.exercise_name)!.push(s)
  }
  return map
}

export async function downloadWorkoutLogsPdf(logs: WorkoutLog[]): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  await loadHebrewFont(doc)

  const W = 210
  const M = PDF_MARGIN
  const RIGHT = W - M
  const PAGE_BOTTOM = 280

  const totalSets = logs.reduce((acc, l) => acc + (l.set_logs?.length ?? 0), 0)
  const totalExercises = logs.reduce((acc, l) => {
    const names = new Set((l.set_logs ?? []).map((s) => s.exercise_name))
    return acc + names.size
  }, 0)

  function drawPage(isFirst: boolean) {
    drawBackground(doc)
    drawHeaderBar(doc, {
      title: 'WORKOUTS — FITNESS TRACKER',
      subtitle: `Generated: ${todayLabel()}`,
    })
    if (isFirst) {
      drawSummaryCards(doc, [
        { label: 'EXERCISES', value: String(totalExercises) },
        { label: 'TOTAL SETS', value: String(totalSets) },
        { label: 'WORKOUTS',  value: String(logs.length) },
      ], 28)
    }
  }

  drawPage(true)
  let y = 66

  for (const log of logs) {
    const grouped = groupByExercise(log)
    const exerciseNames = [...grouped.keys()]

    if (y + 20 > PAGE_BOTTOM) {
      doc.addPage()
      drawPage(false)
      y = 30
    }

    // ── Date header (RTL) ────────────────────────────────────────
    setFill(doc, PDF_C.surface2)
    doc.rect(M, y, W - M * 2, 9, 'F')
    setFill(doc, PDF_C.lime)
    doc.rect(RIGHT - 2, y, 2, 9, 'F')   // lime strip RIGHT

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setTextColor(doc, PDF_C.lime)
    doc.text(fmtDateWeekday(log.date), RIGHT - 6, y + 6, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, PDF_C.muted)
    doc.text(`${exerciseNames.length} exercises · ${log.set_logs?.length ?? 0} sets`, M, y + 6)

    y += 11

    // ── Exercises ─────────────────────────────────────────────────
    for (const [exName, sets] of grouped.entries()) {
      if (y + 7 > PAGE_BOTTOM) {
        doc.addPage()
        drawPage(false)
        y = 30
      }

      doc.setFont('NotoSansHebrew', 'normal')
      doc.setFontSize(8.5)
      setTextColor(doc, PDF_C.muted)
      doc.text(rtl(exName), RIGHT - 4, y + 5, { align: 'right' })
      y += 7

      for (const s of sets ?? []) {
        if (y + 6 > PAGE_BOTTOM) {
          doc.addPage()
          drawPage(false)
          y = 30
        }

        if ((s.set_number ?? 0) % 2 === 0) {
          setFill(doc, '#0f0f0f')
          doc.rect(M, y - 1, W - M * 2, 7, 'F')
        }

        // Set number RIGHT
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        setTextColor(doc, '#555555')
        doc.text(`Set ${s.set_number}`, RIGHT - 8, y + 4.5, { align: 'right' })

        // Weight × reps LEFT
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        setTextColor(doc, PDF_C.white)
        const reps   = s.reps      != null ? String(s.reps)      : '-'
        const weight = s.weight_kg != null ? `${s.weight_kg} kg` : '-'
        doc.text(`${reps}  x  ${weight}`, M + 4, y + 4.5)

        setDraw(doc, PDF_C.border)
        doc.setLineWidth(0.1)
        doc.line(M, y + 6, RIGHT, y + 6)
        y += 7
      }
    }

    if (log.notes) {
      if (y + 6 > PAGE_BOTTOM) {
        doc.addPage()
        drawPage(false)
        y = 30
      }
      doc.setFont('NotoSansHebrew', 'normal')
      doc.setFontSize(7)
      setTextColor(doc, PDF_C.muted)
      doc.text(rtl(log.notes), RIGHT - 4, y + 4, { align: 'right' })
      y += 7
    }

    y += 6
  }

  drawFooter(doc, 'FITNESS TRACKER — WORKOUT HISTORY')
  doc.save(`workout-history-${new Date().toISOString().slice(0, 10)}.pdf`)
}
