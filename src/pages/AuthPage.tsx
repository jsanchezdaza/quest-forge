import { useSearchParams } from 'react-router-dom'
import { AppBackground, Footer, LanguageSelector } from '../components/ui'
import AuthForm from '../components/auth/AuthForm'
import { parseAuthMode } from '../lib/authMode'

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = parseAuthMode(searchParams.get('mode'))

  const toggleMode = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (mode === 'signin') {
        next.set('mode', 'signup')
      } else {
        next.delete('mode')
      }
      return next
    })
  }

  return (
    <div className="focus-ring min-h-screen flex flex-col">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <LanguageSelector />
      </div>
      <AppBackground variant="auth" className="flex-1" compactOnShortDesktop={mode === 'signup'}>
        <AuthForm mode={mode} onToggleMode={toggleMode} />
      </AppBackground>
      <Footer compactOnShortDesktop={mode === 'signup'} />
    </div>
  )
}
