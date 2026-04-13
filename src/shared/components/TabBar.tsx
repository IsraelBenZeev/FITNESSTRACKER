import { Zap, BarChart2, Activity } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Tab } from '../../types/common'

const tabs: { id: Tab; label: string; path: string; Icon: React.FC<{ size: number; color: string; strokeWidth: number }> }[] = [
  { id: 'today', label: 'היום', path: '/today', Icon: Zap },
  { id: 'history', label: 'היסטוריה', path: '/history', Icon: BarChart2 },
  { id: 'body', label: 'גוף', path: '/body', Icon: Activity },
]

export function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const active: Tab = pathname.startsWith('/history')
    ? 'history'
    : pathname.startsWith('/body')
      ? 'body'
      : 'today'

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid #222',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(({ id, label, path, Icon }) => {
        const isActive = active === id
        const color = isActive ? '#D7FF00' : '#555'
        return (
          <button
            key={id}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '10px 8px',
              minHeight: '56px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color,
              transition: 'color 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon size={20} color={color} strokeWidth={isActive ? 2 : 1.5} />
            <span
              style={{
                fontFamily: '"Rubik", sans-serif',
                fontSize: '11px',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
