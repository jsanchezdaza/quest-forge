import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { LoadingSpinner } from './components/ui'
import { useTranslation } from './i18n'
import { parseAuthMode } from './lib/authMode'
import { isUpdatePasswordSearch, shouldRedirectSignedInToGame } from './lib/updatePassword'
import AuthPage from './pages/AuthPage'
import GamePage from './pages/GamePage'

function AuthEntry() {
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const passwordRecovery = useAuthStore((state) => state.passwordRecovery)
  const mode = parseAuthMode(searchParams.get('mode'))

  if (shouldRedirectSignedInToGame({ signedIn: user !== null, mode, passwordRecovery })) {
    return <Navigate to="/game" replace />
  }
  return <AuthPage />
}

function App() {
  const { user, initializing } = useAuthStore()
  const { t } = useTranslation()

  // The recovery card shows its own checking state. The full-screen spinner
  // would replace that card, so this arrival skips it.
  if (initializing && !isUpdatePasswordSearch(window.location.search)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('app.initializing')} />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/auth" element={<AuthEntry />} />
          <Route 
            path="/game" 
            element={user ? <GamePage /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/game" : "/auth"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
