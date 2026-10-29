import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Input, Button, ErrorMessage } from '../ui'
import { VALIDATION_RULES } from '../../constants/validation'
import { useTranslation } from '../../i18n'
import { authErrorMessageKey } from '../../lib/authErrors'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

// Current auth label treatment. Later stories change case and contrast.
const authLabelClassName =
  'block text-xs font-pixel-body text-gray-300 mb-2 uppercase tracking-wide'

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
      setError(t(authErrorMessageKey(cause)))
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="relative border-2 border-medieval-gold/40 rounded-xl bg-white/20 backdrop-blur-sm shadow-2xl shadow-black/50 p-4 sm:p-6">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="dnd-title text-3xl sm:text-4xl md:text-5xl mb-6 sm:mb-8 leading-tight">
            {t('app.title')}
          </h1>
          <p className="font-pixel-body text-xs sm:text-sm text-gray-400 uppercase tracking-wide">
            {mode === 'signin' ? t('auth.welcomeReturning') : t('auth.welcomeNew')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            label={t('form.emailLabel').toUpperCase()}
            placeholder={t('form.emailPlaceholder').toUpperCase()}
            labelClassName={authLabelClassName}
            required={VALIDATION_RULES.EMAIL_REQUIRED}
          />

          {mode === 'signup' && (
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              label={t('form.usernameLabel').toUpperCase()}
              placeholder={t('form.usernamePlaceholder').toUpperCase()}
              labelClassName={authLabelClassName}
              required={VALIDATION_RULES.USERNAME_REQUIRED}
              minLength={VALIDATION_RULES.USERNAME_MIN_LENGTH}
            />
          )}

          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            label={t('form.passwordLabel').toUpperCase()}
            placeholder={t('form.passwordPlaceholder').toUpperCase()}
            labelClassName={authLabelClassName}
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