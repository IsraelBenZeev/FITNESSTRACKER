import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { BodyBuddyLogo, LOGO_INTRO_MS } from './shared/components/BodyBuddyLogo'
import { Header } from './shared/components/Header'
import { TabBar } from './shared/components/TabBar'
import { TodayPage } from './features/today/TodayPage'
import { HistoryPage } from './features/history/HistoryPage'
import { BodyPage } from './features/body/BodyPage'
import { WorkoutsPage } from './features/workouts/WorkoutsPage'
import { PlanScreen } from './features/workouts/PlanScreen'
import { ArchivePage } from './features/workouts/ArchivePage'
import { PlanForm } from './features/workouts/form/PlanForm'
import { ActiveWorkoutBubble } from './features/workouts/ActiveWorkoutBubble'
import { ProfilePage } from './features/profile/ProfilePage'
import { LoginPage } from './features/auth/LoginPage'
import { BodyBuddyAuthProvider, useBodyBuddyAuth } from './lib/BodyBuddyAuthContext'
import { ToastProvider } from './shared/context/ToastContext'

// Routes that hide the TabBar and Header for a focused experience
// (the plan / active-workout screen, like the app's stack screen over the tabs)
const FULLSCREEN_ROUTES = ['/workout/plan/', '/workout/form/']
const CONTAINED_ROUTES: string[] = []

function AnimatedRoutes() {
  const { pathname } = useLocation()
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r))
  const isContained = CONTAINED_ROUTES.some((r) => pathname.startsWith(r))

  return (
    <>
      {!isFullscreen && <Header />}
      <main
        key={pathname}
        style={{
          flex: 1,
          overflowY: isFullscreen || isContained ? 'hidden' : 'auto',
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/workout" element={<WorkoutsPage />} />
          <Route path="/workout/archive" element={<ArchivePage />} />
          <Route path="/workout/plan/:planId" element={<PlanScreen />} />
          <Route path="/workout/form/:mode/:planId?" element={<PlanForm />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      {!isFullscreen && <TabBar />}
      <ActiveWorkoutBubble />
    </>
  )
}

function AppContent() {
  const { bbUser: user, bbLoading: loading } = useBodyBuddyAuth()
  const [introDone, setIntroDone] = useState(false)

  // Like the app's intro screen: the logo animation plays once on entry, then the app (or sign-in) opens
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = setTimeout(() => setIntroDone(true), reduced ? 400 : LOGO_INTRO_MS)
    return () => clearTimeout(id)
  }, [])

  if (!introDone || loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <BodyBuddyLogo animated className="h-[255px] w-[220px]" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return <AnimatedRoutes />
}

export default function App() {
  return (
    <BodyBuddyAuthProvider>
      <div style={{ minHeight: '100dvh', background: '#1A2030', display: 'flex', flexDirection: 'column' }}>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </div>
    </BodyBuddyAuthProvider>
  )
}
