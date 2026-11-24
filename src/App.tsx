import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { BodyBuddyLogo, LOGO_INTRO_MS } from './shared/components/BodyBuddyLogo'
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
import { AvatarSelectorPage } from './features/exercises/AvatarSelectorPage'
import { ExercisesListPage } from './features/exercises/ExercisesListPage'
import { ExercisePage } from './features/exercises/ExercisePage'
import { AuthRoute } from './features/auth/AuthShell'
import { ConfirmSignupPage, ForgotPasswordPage, ResetPasswordPage } from './features/auth/RecoveryPages'
import { LegalPage } from './features/legal/LegalPage'
import { BodyBuddyAuthProvider, useBodyBuddyAuth } from './lib/BodyBuddyAuthContext'
import { ToastProvider } from './shared/context/ToastContext'
import { ErrorBoundary } from './shared/components/ErrorBoundary'

// Routes that hide the TabBar for a focused experience
// (the plan / active-workout screen, like the app's stack screen over the tabs)
const FULLSCREEN_ROUTES = ['/workout/plan/', '/workout/form/', '/exercise/']

function AnimatedRoutes() {
  const { pathname } = useLocation()
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r))

  return (
    <>
      <main
        key={pathname}
        className={`flex flex-1 animate-[pageEnter_0.2s_ease_forwards] flex-col overflow-x-hidden ${isFullscreen ? 'overflow-y-hidden pb-0' : 'overflow-y-auto pb-20'}`}
      >
        <ErrorBoundary resetKey={pathname}>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/history" element={<Navigate to="/profile/nutrition-history" replace />} />
          <Route path="/body" element={<BodyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/nutrition-history" element={<HistoryPage />} />
          <Route path="/exercises" element={<AvatarSelectorPage />} />
          <Route path="/exercises/list" element={<ExercisesListPage />} />
          <Route path="/exercise/:exerciseId" element={<ExercisePage />} />
          <Route path="/workout" element={<WorkoutsPage />} />
          <Route path="/workout/archive" element={<ArchivePage />} />
          <Route path="/workout/plan/:planId" element={<PlanScreen />} />
          <Route path="/workout/form/:mode/:planId?" element={<PlanForm />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
        </ErrorBoundary>
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

  const signedOutOnly = (el: React.ReactElement) => (user ? <Navigate to="/today" replace /> : el)

  return (
    <Routes>
      {/* Email links land here signed in or not — verifying the token signs the user in */}
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/confirm-signup" element={<ConfirmSignupPage />} />
      <Route path="/privacy-policy" element={<LegalPage />} />
      <Route path="/terms-of-service" element={<LegalPage />} />

      <Route path="/auth/login" element={signedOutOnly(<AuthRoute tab="login" />)} />
      <Route path="/auth/signup" element={signedOutOnly(<AuthRoute tab="register" />)} />
      <Route path="/auth/forgot-password" element={signedOutOnly(<ForgotPasswordPage />)} />

      <Route path="*" element={user ? <AnimatedRoutes /> : <Navigate to="/auth/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BodyBuddyAuthProvider>
      <div className="flex min-h-dvh flex-col bg-bg">
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </div>
    </BodyBuddyAuthProvider>
  )
}
