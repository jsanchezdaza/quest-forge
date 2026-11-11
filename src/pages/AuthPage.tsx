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

  const openReset = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('mode', 'reset')
      return next
    })
  }

  return (
    <div className="focus-ring min-h-screen flex flex-col">
      <AppBackground variant="auth" className="flex-1" compactOnShortDesktop={mode === 'signup'}>
        <div className="flex w-full flex-col">
          {/* Below sm the control shares the card's column: in flow, right-aligned, 8px above it.
              From sm it is absolute in the panel's top-right. Never fixed: a pinned control
              overlaps the card once the page scrolls. Short landscape is absolute only from
              660px: the 420px card meets the 102px control (16px from the right) at 656px, so
              a narrower phone keeps the control in flow instead of covering the card's corner.
              740×360 stays absolute, so the sign-in button is not pushed off screen. */}
          <div className="w-full px-4">
            <div className="z-20 mx-auto mb-2 flex w-full max-w-auth-card justify-end [@media(min-width:660px)_and_(max-width:767px)_and_(max-height:450px)]:absolute [@media(min-width:660px)_and_(max-width:767px)_and_(max-height:450px)]:top-4 [@media(min-width:660px)_and_(max-width:767px)_and_(max-height:450px)]:right-4 [@media(min-width:660px)_and_(max-width:767px)_and_(max-height:450px)]:mx-0 [@media(min-width:660px)_and_(max-width:767px)_and_(max-height:450px)]:mb-0 [@media(min-width:660px)_and_(max-width:767px)_and_(max-height:450px)]:w-auto [@media(min-width:660px)_and_(max-width:767px)_and_(max-height:450px)]:max-w-none sm:absolute sm:top-6 sm:right-6 sm:mx-0 sm:mb-0 sm:w-auto sm:max-w-none">
              <LanguageSelector />
            </div>
          </div>
          <AuthForm mode={mode} onToggleMode={toggleMode} onForgotPassword={openReset} />
        </div>
      </AppBackground>
      <Footer compactOnShortDesktop={mode === 'signup'} />
    </div>
  )
}
