import { useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Layout from '@/components/ui/Layout'
import LoginPage from '@/components/auth/LoginPage'
import RegisterPage from '@/components/auth/RegisterPage'
import OnboardingPage from '@/components/auth/OnboardingPage'
import HomePage from '@/components/home/HomePage'
import WardrobePage from '@/components/wardrobe/WardrobePage'
import OutfitsPage from '@/components/outfits/OutfitsPage'

const LOAD_TIMEOUT_MS = 15_000

function AuthGuard() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <LoadingState />

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

function AppInit({ children }: { children: React.ReactNode }) {
  const { initAuth, isLoading } = useAuthStore()
  const [timedOut, setTimedOut] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsub = initAuth()
    timerRef.current = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS)
    return () => {
      unsub()
      clearTimeout(timerRef.current ?? undefined)
    }
  }, [initAuth])

  useEffect(() => {
    if (!isLoading && timerRef.current) {
      clearTimeout(timerRef.current ?? undefined)
    }
  }, [isLoading])

  if (isLoading) {
    if (timedOut) {
      return (
        <ErrorState
          message="网络连接超时，请检查网络后刷新重试"
          onRetry={() => window.location.reload()}
        />
      )
    }
    return <LoadingState />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppInit>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AuthGuard />}>
              <Route element={<Layout />}>
                <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                <Route path="wardrobe" element={<ErrorBoundary><WardrobePage /></ErrorBoundary>} />
                <Route path="outfits" element={<ErrorBoundary><OutfitsPage /></ErrorBoundary>} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppInit>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
