import { CheckCircle, Plus } from 'lucide-react'
import { Modal } from '../../shared/components/Modal'
import type { Exercise } from '../../types/workout'

interface Props {
  exercise: Exercise | null
  isSelected: boolean
  onClose: () => void
  onAdd: (ex: Exercise) => void
  zIndexOverride?: number
}

function TagList({ items, color = '#8C9AAB' }: { items: string[]; color?: string }) {
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
          color: '#8C9AAB',
          textAlign: 'right',
        }}
      >
        {title}
      </span>
      {children}
    </div>
  )
}

export function ExerciseDetailModal({ exercise, isSelected, onClose, onAdd, zIndexOverride }: Props) {
  if (!exercise) return null

  const hasSecondary = (exercise.secondaryMuscles_he ?? []).length > 0
  const hasInstructions = (exercise.instructions_he ?? []).length > 0

  return (
    <Modal isOpen={exercise != null} onClose={onClose} title={exercise.name_he} zIndexOverride={zIndexOverride}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* GIF */}
        {exercise.gifUrl && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#1A2030', lineHeight: 0 }}>
            <img
              src={exercise.gifUrl}
              alt={exercise.name_he}
              style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
            />
          </div>
        )}

        {/* Body parts */}
        <Section title="אזור גוף">
          <TagList items={exercise.bodyParts_he} color="#96C828" />
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
            <TagList items={exercise.secondaryMuscles_he} color="#8C9AAB" />
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
                      background: 'rgba(150,200,40,0.12)',
                      border: '1px solid rgba(150,200,40,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontSize: '12px',
                      color: '#96C828',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: '"Rubik", sans-serif',
                      fontSize: '13px',
                      color: '#C8D0DB',
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
            background: isSelected ? '#2C3545' : '#96C828',
            border: isSelected ? '1px solid rgba(255,255,255,0.08)' : 'none',
            borderRadius: '12px',
            color: isSelected ? '#8C9AAB' : '#1A2030',
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
