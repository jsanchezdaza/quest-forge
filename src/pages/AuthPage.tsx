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
          {/* Below sm the control shares the card's column: in flow, right-aligned, 8px above it.
              From sm it is absolute in the panel's top-right. Never fixed: a pinned control
              overlaps the card once the page scrolls. Short landscape (under sm, at most 450px
              tall) is absolute too, so the control does not push the sign-in button off screen. */}
          <div className="w-full px-4">
            <div className="z-20 mx-auto mb-2 flex w-full max-w-auth-card justify-end [@media(max-width:767px)_and_(max-height:450px)]:absolute [@media(max-width:767px)_and_(max-height:450px)]:top-4 [@media(max-width:767px)_and_(max-height:450px)]:right-4 [@media(max-width:767px)_and_(max-height:450px)]:mx-0 [@media(max-width:767px)_and_(max-height:450px)]:mb-0 [@media(max-width:767px)_and_(max-height:450px)]:w-auto [@media(max-width:767px)_and_(max-height:450px)]:max-w-none sm:absolute sm:top-6 sm:right-6 sm:mx-0 sm:mb-0 sm:w-auto sm:max-w-none">
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
