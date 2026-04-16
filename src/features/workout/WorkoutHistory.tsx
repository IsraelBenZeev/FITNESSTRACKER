import { ChevronDown, ChevronUp, Dumbbell, Copy, FileDown, Check } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../shared/components/Card'
import { useWorkoutHistory } from './useWorkoutLog'
import { useToast } from '../../shared/context/ToastContext'
import { copyWorkoutLogsAsJson, downloadWorkoutLogsPdf } from './exportWorkoutLogs'
import type { WorkoutLog } from '../../types/workout'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
    weekday: 'short',
  })
}

function groupLogsByDate(logs: WorkoutLog[]): [string, WorkoutLog[]][] {
  const map = new Map<string, WorkoutLog[]>()
  for (const log of logs) {
    const arr = map.get(log.date) ?? []
    arr.push(log)
    map.set(log.date, arr)
  }
  return [...map.entries()]
}

function groupByExercise(log: WorkoutLog) {
  const map = new Map<string, typeof log.set_logs>()
  for (const s of log.set_logs ?? []) {
    if (!map.has(s.exercise_name)) map.set(s.exercise_name, [])
    map.get(s.exercise_name)!.push(s)
  }
  return map
}

// Single workout log block (used inside the day card)
function LogBlock({ log }: { log: WorkoutLog }) {
  const grouped = groupByExercise(log)
  const totalSets = log.set_logs?.length ?? 0
  const exercises = [...grouped.keys()]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Workout summary row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>
          {exercises.length} תרגילים · {totalSets} סטים
        </span>
        {log.workout_plan_id && (
          <span style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '14px', fontWeight: 600, color: '#888',
          }}>
            {/* plan name shown by parent */}
          </span>
        )}
      </div>

      {/* Exercises */}
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
        </div>
      ))}

      {log.notes && (
        <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', textAlign: 'right', margin: 0 }}>
          {log.notes}
        </p>
      )}
    </div>
  )
}

// Day card — groups all workouts of one date
function DayCard({ date, logs }: { date: string; logs: WorkoutLog[] }) {
  const [expanded, setExpanded] = useState(false)
  const totalSets = logs.reduce((acc, l) => acc + (l.set_logs?.length ?? 0), 0)
  const allExercises = new Set(logs.flatMap((l) => (l.set_logs ?? []).map((s) => s.exercise_name)))

  return (
    <Card style={{ padding: '14px 16px' }}>
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          width: '100%',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {expanded
            ? <ChevronUp size={16} color="#555" />
            : <ChevronDown size={16} color="#555" />}
          {logs.length > 1 && (
            <span style={{
              fontFamily: '"Rubik", sans-serif', fontSize: '10px',
              color: '#D7FF00', background: 'rgba(215,255,0,0.1)',
              border: '1px solid rgba(215,255,0,0.2)',
              borderRadius: '20px', padding: '1px 7px',
            }}>
              ×{logs.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '17px', fontWeight: 600, color: '#D7FF00' }}>
            {formatDate(date)}
          </span>
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#555' }}>
            {allExercises.size} תרגילים · {totalSets} סטים
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {logs.map((log, i) => (
            <div key={log.id}>
              {logs.length > 1 && (
                <div style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: '13px', color: '#555',
                  textAlign: 'right', marginBottom: '6px',
                  letterSpacing: '0.04em',
                }}>
                  אימון {i + 1}
                </div>
              )}
              <LogBlock log={log} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function WorkoutHistory() {
  const { data: logs = [], isLoading } = useWorkoutHistory()
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
      {/* Export buttons */}
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

      {groupLogsByDate(logs).map(([date, dateLogs]) => (
        <DayCard key={date} date={date} logs={dateLogs} />
      ))}
    </div>
  )
}
