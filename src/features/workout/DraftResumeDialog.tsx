import ReactDOM from 'react-dom'

interface Props {
  draftName: string
  exerciseCount: number
  onResume: () => void
  onDiscard: () => void
  onDismiss: () => void
}

export function DraftResumeDialog({ draftName, exerciseCount, onResume, onDiscard, onDismiss }: Props) {
  return ReactDOM.createPortal(
    <div
      dir="rtl"
      style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'flex-end' }}
    >
      {/* Overlay */}
      <div
        onClick={onDismiss}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          background: '#111',
          borderRadius: '18px 18px 0 0',
          borderTop: '2px solid #D7FF00',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
          animation: 'slideUp 0.22s cubic-bezier(0.32,0.72,0,1) forwards',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#222' }} />
        </div>

        <div style={{ padding: '12px 20px 20px' }}>
          {/* Title */}
          <p style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '22px',
            fontWeight: 700,
            color: '#f0f0f0',
            margin: '0 0 6px',
            textAlign: 'right',
          }}>
            המשך יצירת תכנית?
          </p>

          {/* Sub-line */}
          <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#555', margin: '0 0 20px', textAlign: 'right' }}>
            {draftName && (
              <span style={{ color: '#D7FF00' }}>{draftName}</span>
            )}
            {draftName && exerciseCount > 0 && <span> · </span>}
            {exerciseCount > 0 && (
              <span>{exerciseCount} תרגילים</span>
            )}
            {!draftName && exerciseCount === 0 && (
              <span>יש לך טיוטה שמורה</span>
            )}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onDiscard}
              style={{
                flex: 1,
                padding: '14px',
                background: '#1a1a1a',
                border: '1px solid rgba(255,71,87,0.25)',
                borderRadius: '12px',
                color: '#ff4757',
                fontFamily: '"Rubik", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              הסר
            </button>
            <button
              onClick={onResume}
              style={{
                flex: 2,
                padding: '14px',
                background: '#D7FF00',
                border: 'none',
                borderRadius: '12px',
                color: '#0a0a0a',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              המשך
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
