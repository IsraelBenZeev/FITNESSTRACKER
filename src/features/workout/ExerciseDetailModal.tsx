import { CheckCircle, Plus } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import type { Exercise } from '../../types/workout'

interface Props {
  exercise: Exercise | null
  isSelected: boolean
  onClose: () => void
  onAdd: (ex: Exercise) => void
}

function TagList({ items, color = '#888' }: { items: string[]; color?: string }) {
  if (!items.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-start' }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            padding: '3px 10px',
            background: `${color}12`,
            border: `1px solid ${color}28`,
            borderRadius: '20px',
            fontFamily: '"Rubik", sans-serif',
            fontSize: '12px',
            color,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '13px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#555',
          textAlign: 'right',
        }}
      >
        {title}
      </span>
      {children}
    </div>
  )
}

export function ExerciseDetailModal({ exercise, isSelected, onClose, onAdd }: Props) {
  if (!exercise) return null

  const hasSecondary = (exercise.secondaryMuscles_he ?? []).length > 0
  const hasInstructions = (exercise.instructions_he ?? []).length > 0

  return (
    <Modal isOpen={exercise != null} onClose={onClose} title={exercise.name_he}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* GIF */}
        {exercise.gifUrl && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#0a0a0a', lineHeight: 0 }}>
            <img
              src={exercise.gifUrl}
              alt={exercise.name_he}
              style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
            />
          </div>
        )}

        {/* Body parts */}
        <Section title="אזור גוף">
          <TagList items={exercise.bodyParts_he} color="#D7FF00" />
        </Section>

        {/* Target muscles */}
        {(exercise.targetMuscles_he ?? []).length > 0 && (
          <Section title="שרירים ראשיים">
            <TagList items={exercise.targetMuscles_he} color="#60a5fa" />
          </Section>
        )}

        {/* Secondary muscles */}
        {hasSecondary && (
          <Section title="שרירים משניים">
            <TagList items={exercise.secondaryMuscles_he} color="#888" />
          </Section>
        )}

        {/* Equipment */}
        {(exercise.equipments_he ?? []).length > 0 && (
          <Section title="ציוד">
            <TagList items={exercise.equipments_he} color="#fb923c" />
          </Section>
        )}

        {/* Instructions */}
        {hasInstructions && (
          <Section title="הוראות ביצוע">
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {exercise.instructions_he.map((step, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(215,255,0,0.12)',
                      border: '1px solid rgba(215,255,0,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontSize: '12px',
                      color: '#D7FF00',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: '"Rubik", sans-serif',
                      fontSize: '13px',
                      color: '#ccc',
                      lineHeight: 1.55,
                      textAlign: 'right',
                      flex: 1,
                    }}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Add button */}
        <button
          onClick={() => { onAdd(exercise); onClose() }}
          disabled={isSelected}
          style={{
            width: '100%',
            padding: '14px',
            background: isSelected ? '#1a1a1a' : '#D7FF00',
            border: isSelected ? '1px solid #2a2a2a' : 'none',
            borderRadius: '12px',
            color: isSelected ? '#555' : '#0a0a0a',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '17px',
            fontWeight: 700,
            cursor: isSelected ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s',
          }}
        >
          {isSelected
            ? <><CheckCircle size={18} /> נוסף לתכנית</>
            : <><Plus size={18} strokeWidth={2.5} /> הוסף לתכנית</>
          }
        </button>

      </div>
    </Modal>
  )
}
