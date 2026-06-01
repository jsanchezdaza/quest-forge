import { useState } from 'react'
import { AppBackground, Footer, LanguageSelector } from '../components/ui'
import AuthForm from '../components/auth/AuthForm'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <LanguageSelector />
      </div>
      <AppBackground variant="auth" className="flex-1">
        <AuthForm mode={mode} onToggleMode={toggleMode} />
      </AppBackground>
      <Footer />
    </div>
  )
}
