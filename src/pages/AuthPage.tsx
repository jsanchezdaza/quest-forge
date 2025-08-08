import { useState } from 'react'
import { AppBackground, Footer } from '../components/ui'
import AuthForm from '../components/auth/AuthForm'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppBackground variant="auth" className="flex-1">
        <AuthForm mode={mode} onToggleMode={toggleMode} />
      </AppBackground>
      <Footer />
    </div>
  )
}