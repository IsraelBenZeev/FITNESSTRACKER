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
          background: '#252D3A',
          borderRadius: '18px 18px 0 0',
          borderTop: '2px solid #96C828',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
          animation: 'slideUp 0.22s cubic-bezier(0.32,0.72,0,1) forwards',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <div style={{ padding: '12px 20px 20px' }}>
          {/* Title */}
          <p style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '22px',
            fontWeight: 700,
            color: '#C8D0DB',
            margin: '0 0 6px',
            textAlign: 'right',
          }}>
            המשך יצירת תכנית?
          </p>

          {/* Sub-line */}
          <p style={{ fontFamily: '"Rubik", sans-serif', fontSize: '13px', color: '#8C9AAB', margin: '0 0 20px', textAlign: 'right' }}>
            {draftName && (
              <span style={{ color: '#96C828' }}>{draftName}</span>
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
                background: '#2C3545',
                border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: '12px',
                color: '#F87171',
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
                background: '#96C828',
                border: 'none',
                borderRadius: '12px',
                color: '#1A2030',
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
