import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { FormField, Button, ErrorMessage } from '../ui'
import { VALIDATION_RULES } from '../../constants/validation'
import { useTranslation } from '../../i18n'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const { signIn, signUp, loading } = useAuthStore()
  const { t } = useTranslation()

  const handleToggleMode = () => {
    setError('')
    onToggleMode()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && !username.trim()) {
      setError(t('auth.usernameRequired'))
      return
    }

    try {
      if (mode === 'signup') {
        await signUp(email, password, username)
      } else {
        await signIn(email, password)
      }
    } catch (cause) {
      const fallback = mode === 'signup' ? t('auth.signUpFailed') : t('auth.signInFailed')
      setError((cause as Error).message || fallback)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="relative border-2 border-medieval-gold/40 rounded-xl bg-white/10 backdrop-blur-sm shadow-2xl shadow-black/50 p-4 sm:p-6">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="dnd-title text-3xl sm:text-4xl md:text-5xl mb-6 sm:mb-8 leading-tight">
            {t('app.title')}
          </h1>
          <p className="font-pixel-body text-xs sm:text-sm text-gray-400 uppercase tracking-wide">
            {mode === 'signin' ? t('auth.welcomeReturning') : t('auth.welcomeNew')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <FormField
            id="email"
            type="email"
            value={email}
            onChange={setEmail}
            label={t('form.emailLabel')}
            placeholder={t('form.emailPlaceholder')}
            required={VALIDATION_RULES.EMAIL_REQUIRED}
          />

          {mode === 'signup' && (
            <FormField
              id="username"
              type="text"
              value={username}
              onChange={setUsername}
              label={t('form.usernameLabel')}
              placeholder={t('form.usernamePlaceholder')}
              required={VALIDATION_RULES.USERNAME_REQUIRED}
              minLength={VALIDATION_RULES.USERNAME_MIN_LENGTH}
            />
          )}

          <FormField
            id="password"
            type="password"
            value={password}
            onChange={setPassword}
            label={t('form.passwordLabel')}
            placeholder={t('form.passwordPlaceholder')}
            required={true}
            minLength={VALIDATION_RULES.PASSWORD_MIN_LENGTH}
          />

          <ErrorMessage message={error} />

          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full"
          >
            {mode === 'signin' ? t('auth.signInButton') : t('auth.signUpButton')}
          </Button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            disabled={loading}
            className="text-medieval-gold hover:text-medieval-darkgold transition-colors font-pixel-body text-xs uppercase tracking-wide min-h-[44px] py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'signin'
              ? t('auth.toggleToSignUp')
              : t('auth.toggleToSignIn')
            }
          </button>
        </div>
      </div>
    </div>
  )
}