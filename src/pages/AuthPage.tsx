import { useState } from 'react'
import { AppBackground } from '../components/ui'
import AuthForm from '../components/auth/AuthForm'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  return (
    <AppBackground variant="auth">
      <AuthForm mode={mode} onToggleMode={toggleMode} />
    </AppBackground>
  )
}