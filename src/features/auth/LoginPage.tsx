import { LogIn } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'

export function LoginPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '40px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '64px',
            color: '#D7FF00',
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}
        >
          FITNESS
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
            color: '#666',
            marginTop: '10px',
          }}
        >
          מעקב תזונה ואימונים
        </div>
      </div>

      <button
        onClick={signInWithGoogle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#D7FF00',
          color: '#0a0a0a',
          border: 'none',
          borderRadius: '14px',
          padding: '15px 32px',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '16px',
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
          maxWidth: '320px',
          justifyContent: 'center',
          letterSpacing: '0.01em',
        }}
      >
        <LogIn size={18} strokeWidth={2.5} />
        המשך עם Google
      </button>
    </div>
  )
}
