import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../shared/components/Card'
import { useWorkoutHistory } from './useWorkoutLog'
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

function LogCard({ log }: { log: WorkoutLog }) {
  const [expanded, setExpanded] = useState(false)
  const grouped = groupByExercise(log)
  const totalSets = log.set_logs?.length ?? 0
  const exercises = [...grouped.keys()]

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', textAlign: 'right' }}>
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '17px', fontWeight: 600, color: '#D7FF00' }}>
            {formatDate(log.date)}
          </span>
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555' }}>
            {exercises.length} תרגילים · {totalSets} סטים
          </span>
        </div>
        {expanded
          ? <ChevronUp size={16} color="#555" />
          : <ChevronDown size={16} color="#555" />}
      </button>

      {expanded && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...grouped.entries()].map(([name, sets]) => (
            <div key={name}>
              <div style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#888', marginBottom: '6px', textAlign: 'right' }}>
                {name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sets!.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      background: '#1a1a1a',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555' }}>
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
      )}
    </Card>
  )
}

export function WorkoutHistory() {
  const { data: logs = [], isLoading } = useWorkoutHistory()

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
      {logs.map((log) => (
        <LogCard key={log.id} log={log} />
      ))}
    </div>
  )
}
