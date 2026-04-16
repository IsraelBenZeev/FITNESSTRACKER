/**
 * Shared PDF utilities — used by all export functions.
 * Font: Heebo (modern Hebrew sans-serif).
 */
import { jsPDF } from 'jspdf'

// ─── Design tokens ────────────────────────────────────────────────────────────

export const PDF_C = {
  bg:       '#0a0a0a',
  surface:  '#111111',
  surface2: '#1a1a1a',
  border:   '#2a2a2a',
  lime:     '#D7FF00',
  white:    '#f0f0f0',
  muted:    '#888888',
  danger:   '#ff4757',
  good:     '#4ade80',
} as const

export const PDF_MARGIN = 14

// ─── Color helpers ────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

export function setFill(doc: jsPDF, hex: string) {
  doc.setFillColor(...hexToRgb(hex))
}
export function setDraw(doc: jsPDF, hex: string) {
  doc.setDrawColor(...hexToRgb(hex))
}
export function setTextColor(doc: jsPDF, hex: string) {
  doc.setTextColor(...hexToRgb(hex))
}

// ─── Hebrew RTL ───────────────────────────────────────────────────────────────

/**
 * jsPDF renders text LTR only.
 * Reversing the characters makes Hebrew display correctly.
 */
export function rtl(text: string): string {
  return text.split('').reverse().join('')
}

// ─── Font loading ─────────────────────────────────────────────────────────────

let _heeboBase64: string | null = null

export async function loadHebrewFont(doc: jsPDF): Promise<void> {
  if (!_heeboBase64) {
    const response = await fetch('/fonts/NotoSansHebrew-Regular.ttf')
    const blob = await response.blob()
    _heeboBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1]!)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  doc.addFileToVFS('NotoSansHebrew.ttf', _heeboBase64)
  doc.addFont('NotoSansHebrew.ttf', 'NotoSansHebrew', 'normal', 'Identity-H')
}

// ─── Page building blocks ─────────────────────────────────────────────────────

/** Fill the entire page with the dark background. */
export function drawBackground(doc: jsPDF) {
  setFill(doc, PDF_C.bg)
  doc.rect(0, 0, 210, 297, 'F')
}

interface HeaderOptions {
  /** Title text shown on the RIGHT side (RTL). */
  title: string
  /** Optional subtitle shown on the LEFT side (date / range). */
  subtitle?: string
}

/**
 * Draw the lime top header bar (22mm tall).
 * Title is right-aligned (RTL). Returns Y position after the bar.
 */
export function drawHeaderBar(doc: jsPDF, { title, subtitle }: HeaderOptions): number {
  const W = 210
  const M = PDF_MARGIN

  setFill(doc, PDF_C.lime)
  doc.rect(0, 0, W, 22, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  setTextColor(doc, PDF_C.bg)
  doc.text(title, W - M, 14, { align: 'right' })

  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(subtitle, M, 14)
  }

  return 22
}

interface SummaryCard {
  label: string
  value: string
  sub?: string
  subColor?: string
}

/**
 * Draw a row of summary cards below the header bar.
 * Returns Y position after the cards.
 */
export function drawSummaryCards(doc: jsPDF, cards: SummaryCard[], startY: number): number {
  const W = 210
  const M = PDF_MARGIN
  const cardW = (W - M * 2 - (cards.length - 1) * 4) / cards.length

  cards.forEach((card, i) => {
    const cx = M + i * (cardW + 4)
    setFill(doc, PDF_C.surface)
    setDraw(doc, PDF_C.border)
    doc.roundedRect(cx, startY, cardW, 26, 2, 2, 'FD')
    // Lime top border
    setFill(doc, PDF_C.lime)
    doc.rect(cx, startY, cardW, 1.5, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, PDF_C.muted)
    doc.text(card.label, cx + cardW / 2, startY + 7, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    setTextColor(doc, PDF_C.lime)
    doc.text(card.value, cx + cardW / 2, startY + 16, { align: 'center' })

    if (card.sub) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      setTextColor(doc, card.subColor ?? PDF_C.muted)
      doc.text(card.sub, cx + cardW / 2, startY + 22, { align: 'center' })
    }
  })

  return startY + 32
}

/**
 * Draw the footer line + page number on the current page.
 * Call once per page in a loop after all pages are built.
 */
export function drawFooter(doc: jsPDF, label: string) {
  const W = 210
  const M = PDF_MARGIN
  const totalPages = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages()

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    setDraw(doc, PDF_C.border)
    doc.setLineWidth(0.3)
    doc.line(M, 288, W - M, 288)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, '#333333')
    doc.text(label, W - M, 293, { align: 'right' })
    doc.text(`${p} / ${totalPages}`, M, 293)
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function fmtDateWeekday(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', weekday: 'short',
  })
}
