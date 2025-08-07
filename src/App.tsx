import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { LoadingSpinner } from './components/ui'
import AuthPage from './pages/AuthPage'
import GamePage from './pages/GamePage'

function App() {
  const { user, loading } = useAuthStore()
  
  console.log('🎮 App render:', { user: user ? 'SET' : 'NULL', loading })

  if (loading) {
    console.log('⏳ App is loading...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Initializing Quest Forge..." />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route 
            path="/auth" 
            element={!user ? <AuthPage /> : <Navigate to="/game" replace />} 
          />
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