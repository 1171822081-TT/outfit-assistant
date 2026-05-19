import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LoadingState from '@/components/ui/LoadingState'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Layout from '@/components/ui/Layout'
import LoginPage from '@/components/auth/LoginPage'
import RegisterPage from '@/components/auth/RegisterPage'
import OnboardingPage from '@/components/auth/OnboardingPage'
import HomePage from '@/components/home/HomePage'
import WardrobePage from '@/components/wardrobe/WardrobePage'
import OutfitsPage from '@/components/outfits/OutfitsPage'

function AuthGuard() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <LoadingState />

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

function AppInit({ children }: { children: React.ReactNode }) {
  const { initAuth, isLoading } = useAuthStore()

  useEffect(() => {
    const unsub = initAuth()
    return unsub
  }, [initAuth])

  if (isLoading) return <LoadingState />

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
