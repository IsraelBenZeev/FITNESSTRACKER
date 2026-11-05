import { ChevronDown, ChevronUp, Dumbbell, Copy, FileDown, Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../shared/components/Card'
import { useWorkoutHistory, useDeleteWorkoutLog, fetchWorkoutLogsForExport } from './useWorkoutLog'
import { useToast } from '../../shared/context/ToastContext'
import { copyWorkoutLogsAsJsonFromPromise, downloadWorkoutLogsPdf } from './exportWorkoutLogs'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { ExportRangeModal } from '../history/ExportRangeModal'
import type { ExportRange } from '../history/ExportRangeModal'
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
            color: '#C8D0DB',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {expanded
              ? <ChevronUp size={16} color="#8C9AAB" />
              : <ChevronDown size={16} color="#8C9AAB" />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
            {log.plan?.name && (
              <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '15px', fontWeight: 600, color: '#C8D0DB' }}>
                {log.plan.name}
              </span>
            )}
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '17px', fontWeight: 600, color: '#96C828' }}>
              {formatDate(log.date)}
            </span>
            <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#8C9AAB' }}>
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
            color: '#8C9AAB',
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
              <div style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#8C9AAB', marginBottom: '4px', textAlign: 'right' }}>
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
                      background: '#2C3545',
                      borderRadius: '6px',
                    }}
                  >
                    <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#8C9AAB' }}>
                      סט {s.set_number}
                    </span>
                    <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '15px', color: '#C8D0DB' }}>
                      {s.reps ?? '—'} ×{' '}
                      {s.is_bodyweight
                        ? <span className="text-xs font-body px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                            משקל גוף{s.added_weight_kg != null && s.added_weight_kg > 0 ? ` + ${s.added_weight_kg} ק"ג` : ''}
                          </span>
                        : s.weight_kg != null ? `${s.weight_kg}ק"ג` : '—'}
                    </span>
                  </div>
                ))}
              </div>
              {sets![0]?.notes && (
                <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#8C9AAB', textAlign: 'right', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {sets![0].notes}
                </p>
              )}
            </div>
          ))}
          {log.notes && (
            <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#8C9AAB', textAlign: 'right', margin: 0 }}>
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
  const [exportTarget, setExportTarget] = useState<'json' | 'pdf' | null>(null)

  async function handleExportSelect(range: ExportRange) {
    try {
      if (exportTarget === 'json') {
        await copyWorkoutLogsAsJsonFromPromise(
          fetchWorkoutLogsForExport(range.sinceDate, range.untilDate)
        )
        setCopied(true)
        showSuccess('הועתק בהצלחה')
        setTimeout(() => setCopied(false), 2800)
      } else if (exportTarget === 'pdf') {
        const filtered = await fetchWorkoutLogsForExport(range.sinceDate, range.untilDate)
        if (filtered.length === 0) { showSuccess('אין נתונים בטווח זה'); return }
        await downloadWorkoutLogsPdf(filtered)
        showSuccess('PDF הורד בהצלחה')
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'empty') showSuccess('אין נתונים בטווח זה')
      else showSuccess('שגיאה בייצוא הנתונים')
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#8C9AAB', fontFamily: '"Rubik", sans-serif' }}>
        טוען...
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Dumbbell size={40} color="rgba(255,255,255,0.08)" strokeWidth={1.5} />
        <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '14px', color: '#8C9AAB', margin: 0 }}>
          עדיין לא תועד אימון
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setExportTarget('json')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              background: copied ? 'rgba(74,222,128,0.08)' : '#2C3545',
              border: copied ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: copied ? '#4ade80' : '#8C9AAB',
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
            onClick={() => setExportTarget('pdf')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              background: '#2C3545',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: '#8C9AAB',
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

      <ExportRangeModal
        isOpen={exportTarget !== null}
        onClose={() => setExportTarget(null)}
        title={exportTarget === 'json' ? 'העתק JSON — בחר טווח' : 'הורד PDF — בחר טווח'}
        onSelect={handleExportSelect}
      />
    </>
  )
}
