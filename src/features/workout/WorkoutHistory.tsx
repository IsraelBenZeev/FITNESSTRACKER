import { ChevronDown, ChevronUp, Dumbbell, Copy, FileDown, Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../shared/components/Card'
import { useWorkoutHistory, useDeleteWorkoutLog } from './useWorkoutLog'
import { useToast } from '../../shared/context/ToastContext'
import { copyWorkoutLogsAsJson, downloadWorkoutLogsPdf } from './exportWorkoutLogs'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import type { WorkoutLog } from '../../types/workout'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
    weekday: 'short',
  })
}

function groupByExercise(log: WorkoutLog) {
  const map = new Map<string, typeof log.set_logs>()
  for (const s of log.set_logs ?? []) {
    if (!map.has(s.exercise_name)) map.set(s.exercise_name, [])
    map.get(s.exercise_name)!.push(s)
  }
  return map
}

function LogCard({ log, onDelete }: { log: WorkoutLog; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const grouped = groupByExercise(log)
  const totalSets = log.set_logs?.length ?? 0
  const exercises = [...grouped.keys()]

  return (
    <Card style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setExpanded((p) => !p)}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 0,
            color: '#f0f0f0',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {expanded
              ? <ChevronUp size={16} color="#555" />
              : <ChevronDown size={16} color="#555" />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '17px', fontWeight: 600, color: '#D7FF00' }}>
              {formatDate(log.date)}
            </span>
            <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#555' }}>
              {exercises.length} תרגילים · {totalSets} סטים
            </span>
          </div>
        </button>

        <button
          onClick={() => setConfirmOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: '#444',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...grouped.entries()].map(([name, sets]) => (
            <div key={name}>
              <div style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#666', marginBottom: '4px', textAlign: 'right' }}>
                {name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {sets!.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 10px',
                      background: '#1a1a1a',
                      borderRadius: '6px',
                    }}
                  >
                    <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>
                      סט {s.set_number}
                    </span>
                    <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '15px', color: '#f0f0f0' }}>
                      {s.reps ?? '—'} × {s.weight_kg != null ? `${s.weight_kg}ק"ג` : '—'}
                    </span>
                  </div>
                ))}
              </div>
              {sets![0]?.notes && (
                <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#555', textAlign: 'right', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {sets![0].notes}
                </p>
              )}
            </div>
          ))}
          {log.notes && (
            <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', textAlign: 'right', margin: 0 }}>
              {log.notes}
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        message="למחוק את האימון?"
        onConfirm={() => { onDelete(log.id); setConfirmOpen(false) }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  )
}

export function WorkoutHistory() {
  const { data: logs = [], isLoading } = useWorkoutHistory()
  const { mutate: deleteLog } = useDeleteWorkoutLog()
  const { showSuccess } = useToast()
  const [copied, setCopied] = useState(false)

  async function handleCopyJson() {
    if (logs.length === 0) return
    await copyWorkoutLogsAsJson(logs)
    setCopied(true)
    showSuccess('הועתק בהצלחה')
    setTimeout(() => setCopied(false), 2800)
  }

  async function handleDownloadPdf() {
    if (logs.length === 0) return
    try {
      await downloadWorkoutLogsPdf(logs)
      showSuccess('PDF הורד בהצלחה')
    } catch (err) {
      console.error('[PDF export]', err)
      alert(`שגיאה בייצוא PDF:\n${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#555', fontFamily: '"Rubik", sans-serif' }}>
        טוען...
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Dumbbell size={40} color="#222" strokeWidth={1.5} />
        <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '14px', color: '#444', margin: 0 }}>
          עדיין לא תועד אימון
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleCopyJson}
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
            fontFamily: '"Rubik", sans-serif',
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
          onClick={handleDownloadPdf}
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
            fontFamily: '"Rubik", sans-serif',
            fontSize: '12px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <FileDown size={14} strokeWidth={2} />
          הורד PDF
        </button>
      </div>

      {logs.map((log) => (
        <LogCard key={log.id} log={log} onDelete={deleteLog} />
      ))}
    </div>
  )
}
