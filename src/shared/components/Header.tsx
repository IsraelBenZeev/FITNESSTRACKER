import { Flame } from 'lucide-react'
import { useStreak } from '../../features/today/useStreak'

export function Header() {
  const streak = useStreak()

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #222',
        paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
        paddingBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '24px',
          color: '#D7FF00',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        FITNESS
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {streak > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 100, 30, 0.1)',
              border: '1px solid rgba(255, 100, 30, 0.2)',
              borderRadius: '20px',
              padding: '3px 9px 3px 7px',
            }}
          >
            <Flame size={13} color="#ff641e" strokeWidth={2} />
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: '15px',
                color: '#ff641e',
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}
            >
              {streak}
            </span>
          </div>
        )}

        <span
          style={{
            fontFamily: '"Rubik", sans-serif',
            fontSize: '13px',
            color: '#666',
            fontWeight: 400,
          }}
        >
          {new Date().toLocaleDateString('he-IL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </span>
      </div>
    </header>
  )
}
