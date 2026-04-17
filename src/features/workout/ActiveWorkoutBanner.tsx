import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timer, AlertTriangle, Clock } from 'lucide-react'
import {
  getSession,
  clearSession,
  isSessionExpired,
  getSessionAgeMinutes,
  formatSessionAge,
  formatElapsedFromSession,
} from './workoutSession'

export function ActiveWorkoutBanner() {
  const navigate = useNavigate()
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const session = getSession()
  if (!session) return null

  const expired = isSessionExpired()
  const ageMinutes = getSessionAgeMinutes()
  const stale = !expired && ageMinutes >= 240 // 4 שעות

  function handleDiscard() {
    clearSession()
    tick((n) => n + 1)
  }

  function handleResume() {
    navigate('/workout/session')
  }

  // ─── EXPIRED (> 24h או יום אחר) ───────────────────────────────────────────
  if (expired) {
    return (
      <div
        style={{
          margin: '0 0 2px',
          padding: '12px 14px',
          background: 'rgba(102,102,102,0.08)',
          border: '1px solid rgba(102,102,102,0.2)',
          borderRadius: '12px',
          animation: 'bannerEnter 0.25s ease forwards',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '10px',
        }}>
          <Clock size={15} color="#555" strokeWidth={1.5} />
          <div style={{ flex: 1, textAlign: 'right' }}>
            <span style={{
              fontFamily: '"Rubik", sans-serif',
              fontSize: '12px',
              color: '#555',
              display: 'block',
            }}>
              אימון ישן נמצא · {formatSessionAge()}
            </span>
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              color: '#888',
              letterSpacing: '0.02em',
            }}>
              {session.planName}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDiscard}
            style={{
              flex: 1,
              padding: '9px',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: '9px',
              color: '#555',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '13px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            מחק
          </button>
          <button
            onClick={handleResume}
            style={{
              flex: 2,
              padding: '9px',
              background: 'rgba(102,102,102,0.12)',
              border: '1px solid rgba(102,102,102,0.25)',
              borderRadius: '9px',
              color: '#aaa',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            שחזר בכל זאת
          </button>
        </div>
      </div>
    )
  }

  // ─── STALE (4–24 שעות) ───────────────────────────────────────────────────
  if (stale) {
    return (
      <div
        style={{
          margin: '0 0 2px',
          padding: '12px 14px',
          background: 'rgba(251,146,60,0.06)',
          border: '1px solid rgba(251,146,60,0.2)',
          borderRadius: '12px',
          animation: 'bannerEnter 0.25s ease forwards',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '10px',
        }}>
          <AlertTriangle size={15} color="#fb923c" strokeWidth={1.5} />
          <div style={{ flex: 1, textAlign: 'right' }}>
            <span style={{
              fontFamily: '"Rubik", sans-serif',
              fontSize: '12px',
              color: '#fb923c',
              display: 'block',
            }}>
              אימון לא הושלם · {formatSessionAge()}
            </span>
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              color: '#f0d0a0',
              letterSpacing: '0.02em',
            }}>
              {session.planName}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDiscard}
            style={{
              flex: 1,
              padding: '9px',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: '9px',
              color: '#555',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '13px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            מחק
          </button>
          <button
            onClick={handleResume}
            style={{
              flex: 2,
              padding: '9px',
              background: 'rgba(251,146,60,0.1)',
              border: '1px solid rgba(251,146,60,0.3)',
              borderRadius: '9px',
              color: '#fb923c',
              fontFamily: '"Rubik", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            המשך אימון
          </button>
        </div>
      </div>
    )
  }

  // ─── FRESH (< 4 שעות) ────────────────────────────────────────────────────
  return (
    <button
      onClick={handleResume}
      style={{
        width: '100%',
        padding: '12px 14px',
        background: 'rgba(215,255,0,0.07)',
        border: '1px solid rgba(215,255,0,0.2)',
        borderRadius: '12px',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        margin: '0 0 2px',
        animation: 'bannerEnter 0.25s ease forwards',
        textAlign: 'right',
      }}
    >
      {/* Elapsed */}
      <span style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: '18px',
        color: '#D7FF00',
        letterSpacing: '0.06em',
        flexShrink: 0,
      }}>
        {formatElapsedFromSession()}
      </span>

      {/* Plan name */}
      <span style={{
        flex: 1,
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: '15px',
        fontWeight: 600,
        color: '#e0f060',
        letterSpacing: '0.02em',
        textAlign: 'right',
      }}>
        {session.planName}
      </span>

      {/* Pulse dot + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <span style={{
          fontFamily: '"Rubik", sans-serif',
          fontSize: '12px',
          color: '#D7FF00',
          opacity: 0.8,
        }}>
          פעיל
        </span>
        <Timer size={14} color="#D7FF00" strokeWidth={1.5} />
      </div>
    </button>
  )
}
