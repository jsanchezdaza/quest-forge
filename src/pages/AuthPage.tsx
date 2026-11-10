import { useLayoutEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppBackground, Footer, LanguageSelector } from '../components/ui'
import AuthForm from '../components/auth/AuthForm'
import { parseAuthMode } from '../lib/authMode'

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = parseAuthMode(searchParams.get('mode'))

  useLayoutEffect(() => {
    document.documentElement.classList.add('auth-screen')
    return () => document.documentElement.classList.remove('auth-screen')
  }, [])

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
      <AppBackground variant="auth" className="flex-1" compactOnShortDesktop={mode === 'signup'}>
        <div className="flex w-full flex-col">
          {/* Below 640px the control shares the card's column: in flow, right-aligned, 8px above it.
              From 640px it leaves that column and stays pinned to the corner. */}
          <div className="w-full px-4">
            <div className="z-20 mx-auto mb-2 flex w-full max-w-auth-card justify-end min-[640px]:fixed min-[640px]:top-4 min-[640px]:right-4 min-[640px]:mx-0 min-[640px]:mb-0 min-[640px]:w-auto min-[640px]:max-w-none sm:top-6 sm:right-6">
              <LanguageSelector />
            </div>
          </div>
          <AuthForm mode={mode} onToggleMode={toggleMode} />
        </div>
      </AppBackground>
      <Footer compactOnShortDesktop={mode === 'signup'} />
    </div>
  )
}
