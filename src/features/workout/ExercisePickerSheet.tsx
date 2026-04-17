import { useState, useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { Search, Plus, X, Info, CheckCheck } from 'lucide-react'
import { ExerciseDetailModal } from './ExerciseDetailModal'
import { useExercises } from './useExercises'
import type { Exercise } from '../../types/workout'

interface PlanExerciseRow {
  exercise_id: string
  exercise_name: string
  gif_url?: string
  order_index: number
}

interface Props {
  isOpen: boolean
  selectedExercises: PlanExerciseRow[]
  onAdd: (ex: Exercise) => void
  onRemove: (id: string) => void
  onDone: () => void
}

const BODY_PARTS_FILTER = ['הכל', 'חזה', 'גב', 'כתפיים', 'רגליים', 'ידיים', 'בטן', 'קרדיו']

export function ExercisePickerSheet({ isOpen, selectedExercises, onAdd, onRemove, onDone }: Props) {
  const [search, setSearch] = useState('')
  const [bodyPartFilter, setBodyPartFilter] = useState('הכל')
  const [detailEx, setDetailEx] = useState<Exercise | null>(null)
  const [selectedOpen, setSelectedOpen] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useExercises(search, bodyPartFilter)
  const allExercises = data?.pages.flatMap((p) => p.data) ?? []

  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setBodyPartFilter('הכל')
      setDetailEx(null)
    }
  }, [isOpen])

  useEffect(() => {
    const sentinel = sentinelRef.current
    const list = listRef.current
    if (!sentinel || !list) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: list, threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleAdd = useCallback((ex: Exercise) => {
    onAdd(ex)
  }, [onAdd])

  function handleRemove(id: string) {
    onRemove(id)
    if (selectedExercises.length <= 1) setSelectedOpen(false)
  }

  if (!isOpen) return null

  const count = selectedExercises.length

  return ReactDOM.createPortal(
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        flexDirection: 'column',
        background: '#111',
        animation: 'slideUp 0.22s cubic-bezier(0.32,0.72,0,1) forwards',
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          paddingRight: '20px',
          paddingBottom: '14px',
          paddingLeft: '20px',
          borderBottom: '1px solid #1a1a1a',
          background: '#111',
        }}
      >
        <button
          onClick={onDone}
          style={{
            padding: '8px 18px',
            background: '#D7FF00',
            border: 'none',
            borderRadius: '10px',
            color: '#0a0a0a',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <CheckCheck size={16} strokeWidth={2.5} color="#0a0a0a" />
          סיום
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {count > 0 && (
            <button
              onClick={() => setSelectedOpen((v) => !v)}
              style={{
                padding: '4px 10px',
                background: selectedOpen ? 'rgba(215,255,0,0.18)' : 'rgba(215,255,0,0.1)',
                border: '1px solid rgba(215,255,0,0.35)',
                borderRadius: '20px',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '12px',
                color: '#D7FF00',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {count} נבחרו ▾
            </button>
          )}
          <span
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '22px',
              fontWeight: 600,
              color: '#f0f0f0',
              letterSpacing: '0.03em',
            }}
          >
            בחר תרגילים
          </span>
        </div>
      </div>

      {/* Selected exercises panel */}
      {selectedOpen && count > 0 && (
        <div
          style={{
            flexShrink: 0,
            borderBottom: '1px solid #1a1a1a',
            background: '#0d0d0d',
            maxHeight: '220px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '10px 16px',
          }}
        >
          {selectedExercises.map((ex, i) => (
            <div
              key={ex.exercise_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                background: '#1a1a1a',
                border: '1px solid #222',
                borderRadius: '10px',
              }}
            >
              <span style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '13px',
                color: '#444',
                flexShrink: 0,
                width: '18px',
                textAlign: 'center',
              }}>
                {i + 1}
              </span>
              {ex.gif_url ? (
                <img
                  src={ex.gif_url}
                  alt={ex.exercise_name}
                  loading="lazy"
                  style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#0d0d0d' }}
                />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 6, background: '#0d0d0d', flexShrink: 0 }} />
              )}
              <span style={{
                flex: 1,
                fontFamily: '"Rubik", sans-serif',
                fontSize: '13px',
                color: '#f0f0f0',
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {ex.exercise_name}
              </span>
              <button
                onClick={() => handleRemove(ex.exercise_id)}
                style={{
                  width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px',
                  cursor: 'pointer', color: '#ff4757', flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search + filters */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '12px 16px 8px',
          background: '#111',
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש תרגיל..."
            style={{
              width: '100%',
              padding: '11px 14px',
              paddingLeft: '38px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              color: '#f0f0f0',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              textAlign: 'right',
              direction: 'rtl',
            }}
          />
          <Search
            size={16}
            color="#444"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
        </div>

        <div
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none',
          } as React.CSSProperties}
        >
          {BODY_PARTS_FILTER.map((bp) => {
            const active = bodyPartFilter === bp
            return (
              <button
                key={bp}
                onClick={() => setBodyPartFilter(bp)}
                style={{
                  padding: '7px 14px',
                  flexShrink: 0,
                  background: active ? 'rgba(215,255,0,0.1)' : '#1a1a1a',
                  border: active ? '1px solid rgba(215,255,0,0.3)' : '1px solid #222',
                  borderRadius: '20px',
                  color: active ? '#D7FF00' : '#555',
                  fontFamily: '"Rubik", sans-serif',
                  fontSize: '13px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {bp}
              </button>
            )
          })}
        </div>
      </div>

      {/* Exercise list */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '8px 16px',
          paddingBottom: count > 0 ? '80px' : '16px',
        }}
      >
        {isLoading && (
          <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#444', textAlign: 'center', margin: '20px 0' }}>
            טוען תרגילים...
          </p>
        )}
        {!isLoading && allExercises.length === 0 && (
          <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#444', textAlign: 'center', margin: '20px 0' }}>
            לא נמצאו תרגילים
          </p>
        )}

        {allExercises.map((ex) => {
          const selected = selectedExercises.some((e) => e.exercise_id === ex.exerciseId)
          return (
            <div
              key={ex.exerciseId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: selected ? 'rgba(215,255,0,0.05)' : '#1a1a1a',
                border: selected ? '1px solid rgba(215,255,0,0.2)' : '1px solid #222',
                borderRadius: '12px',
              }}
            >
              {ex.gifUrl ? (
                <img
                  src={ex.gifUrl}
                  alt={ex.name_he}
                  loading="lazy"
                  style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#0d0d0d' }}
                />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 8, background: '#0d0d0d', flexShrink: 0 }} />
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end', minWidth: 0 }}>
                <span style={{
                  fontFamily: '"Rubik", sans-serif',
                  fontSize: '14px',
                  color: selected ? '#D7FF00' : '#f0f0f0',
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}>
                  {ex.name_he}
                </span>
                <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#444' }}>
                  {ex.bodyParts_he.join(' · ')}
                </span>
              </div>

              <button
                onClick={() => setDetailEx(ex)}
                style={{
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '9px',
                  cursor: 'pointer', color: '#555', flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Info size={16} strokeWidth={2} />
              </button>

              <button
                onClick={() => selected ? handleRemove(ex.exerciseId) : handleAdd(ex)}
                style={{
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: selected ? 'rgba(215,255,0,0.12)' : '#D7FF00',
                  border: selected ? '1px solid rgba(215,255,0,0.25)' : 'none',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  color: selected ? '#D7FF00' : '#0a0a0a',
                  flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {selected
                  ? <X size={16} strokeWidth={2.5} />
                  : <Plus size={16} strokeWidth={2.5} />
                }
              </button>
            </div>
          )
        })}

        <div ref={sentinelRef} style={{ height: 8 }} />
        {isFetchingNextPage && (
          <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#444', textAlign: 'center', margin: '8px 0' }}>
            טוען עוד...
          </p>
        )}
      </div>

      {/* Selected tray */}
      {count > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            paddingBottom: 'env(safe-area-inset-bottom, 12px)',
            background: '#161616',
            borderTop: '1px solid #222',
            zIndex: 111,
            animation: 'trayIn 0.2s ease forwards',
          }}
        >
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#555', flexShrink: 0 }}>
            {count} נבחרו
          </span>
          <div
            className="hide-scrollbar"
            style={{
              flex: 1,
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            } as React.CSSProperties}
          >
            {selectedExercises.map((ex) => (
              <div
                key={ex.exercise_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 8px 5px 5px',
                  background: '#1e1e1e',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => handleRemove(ex.exercise_id)}
                  style={{
                    width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 0,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
                <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#ccc', whiteSpace: 'nowrap', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ex.exercise_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise detail modal — above the picker sheet */}
      <ExerciseDetailModal
        exercise={detailEx}
        isSelected={detailEx ? selectedExercises.some((e) => e.exercise_id === detailEx.exerciseId) : false}
        onClose={() => setDetailEx(null)}
        onAdd={(ex) => { handleAdd(ex); setDetailEx(null) }}
        zIndexOverride={120}
      />
    </div>,
    document.body
  )
}
