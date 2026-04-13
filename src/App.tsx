import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Header } from './shared/components/Header'
import { TabBar } from './shared/components/TabBar'
import { TodayPage } from './features/today/TodayPage'
import { HistoryPage } from './features/history/HistoryPage'
import { BodyPage } from './features/body/BodyPage'
import { WorkoutPage } from './features/workout/WorkoutPage'
import { PlanDetailPage } from './features/workout/PlanDetailPage'
import { WorkoutSessionPage } from './features/workout/WorkoutSessionPage'

// Routes that hide the TabBar and Header for a focused experience
const FULLSCREEN_ROUTES = ['/workout/session']

function AnimatedRoutes() {
  const { pathname } = useLocation()
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r))

  return (
    <>
      {!isFullscreen && <Header />}
      <main
        key={pathname}
        style={{
          flex: 1,
          overflowY: isFullscreen ? 'hidden' : 'auto',
          overflowX: 'hidden',
          paddingBottom: isFullscreen ? 0 : '80px',
          animation: 'pageEnter 0.2s ease forwards',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/body" element={<BodyPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/workout/plan/:planId" element={<PlanDetailPage />} />
          <Route path="/workout/session" element={<WorkoutSessionPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      {!isFullscreen && <TabBar />}
    </>
  )
}

export default function App() {
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      <AnimatedRoutes />
    </div>
  )
}
