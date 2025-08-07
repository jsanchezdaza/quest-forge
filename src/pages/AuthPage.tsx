import { useState } from 'react'
import AuthForm from '../components/auth/AuthForm'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('/images/backgrounds/descktop-background.png'), radial-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3))`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-medieval-gold rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-medieval-copper rounded-full blur-2xl" />
      </div>
      
      <div className="relative z-10">
        <AuthForm mode={mode} onToggleMode={toggleMode} />
      </div>
    </div>
  )
}