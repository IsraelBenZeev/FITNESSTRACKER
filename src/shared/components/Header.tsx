import { useState } from 'react'
import { Flame } from 'lucide-react'
import { useStreak } from '../../features/today/useStreak'
import { useAuth } from '../../lib/AuthContext'

function getInitials(name: string | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

export function Header() {
  const streak = useStreak()
  const { user, signOut } = useAuth()
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const fullName = user?.user_metadata?.full_name as string | undefined
  const initials = getInitials(fullName)
  const [showConfirm, setShowConfirm] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <>
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

          <button
            onClick={() => setShowConfirm(true)}
            title="פרופיל"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              borderRadius: '50%',
            }}
          >
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt="avatar"
                onError={() => setImgError(true)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#D7FF00',
                  letterSpacing: '0.02em',
                  userSelect: 'none',
                }}
              >
                {initials}
              </div>
            )}
          </button>
        </div>
      </header>

      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111',
              border: '1px solid #222',
              borderTop: '2px solid #D7FF00',
              borderRadius: '16px',
              padding: '28px 24px 20px',
              width: '280px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '15px',
                color: '#ccc',
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              האם ברצונך לצאת מהחשבון?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #333',
                  background: 'transparent',
                  color: '#888',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                ביטול
              </button>
              <button
                onClick={() => { setShowConfirm(false); void signOut() }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ff4757',
                  color: '#fff',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                יציאה
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
