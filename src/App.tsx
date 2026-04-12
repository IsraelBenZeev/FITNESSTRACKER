import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Header } from './shared/components/Header'
import { TabBar } from './shared/components/TabBar'
import { TodayPage } from './features/today/TodayPage'
import { HistoryPage } from './features/history/HistoryPage'
import { BodyPage } from './features/body/BodyPage'

function AnimatedRoutes() {
  const { pathname } = useLocation()
  return (
    <main
      key={pathname}
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: '80px',
        animation: 'pageEnter 0.2s ease forwards',
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/body" element={<BodyPage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </main>
  )
}

export default function App() {
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <AnimatedRoutes />
      <TabBar />
    </div>
  )
}
