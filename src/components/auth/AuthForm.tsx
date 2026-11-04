import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Input, PasswordInput, Button, ErrorMessage } from '../ui'
import { VALIDATION_RULES } from '../../constants/validation'
import { useTranslation } from '../../i18n'
import { authErrorMessageKey } from '../../lib/authErrors'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

const authLabelClassName =
  'block text-xs font-pixel-body text-gray-200 uppercase tracking-wide'

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
    <div className="w-full px-4">
      <div className="relative mx-auto w-full max-w-auth-card border-2 border-medieval-gold/40 rounded-xl bg-white/20 backdrop-blur-sm shadow-2xl shadow-black/50 p-card-pad-mobile sm:p-card-pad">
        <div className="text-center mb-6 sm:mb-8 [@media(max-height:800px)]:mb-5">
          <h1 className="dnd-title text-3xl sm:text-4xl md:text-5xl [@media(max-height:800px)]:md:text-4xl mb-6 sm:mb-8 [@media(max-height:800px)]:mb-4 leading-tight">
            {t('app.title')}
          </h1>
          <p className="font-pixel-body text-sm text-gray-300">
            {mode === 'signin' ? t('auth.welcomeReturning') : t('auth.welcomeNew')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-field-gap">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            label={t('form.emailLabel')}
            placeholder={t('form.emailPlaceholder')}
            labelClassName={authLabelClassName}
            required={VALIDATION_RULES.EMAIL_REQUIRED}
          />

          {mode === 'signup' && (
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              label={t('form.usernameLabel')}
              placeholder={t('form.usernamePlaceholder')}
              labelClassName={authLabelClassName}
              required={VALIDATION_RULES.USERNAME_REQUIRED}
              minLength={VALIDATION_RULES.USERNAME_MIN_LENGTH}
            />
          )}

          <PasswordInput
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            label={t('form.passwordLabel')}
            placeholder={t('form.passwordPlaceholder')}
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

        <div className="mt-4 sm:mt-6 [@media(max-height:800px)]:mt-4 text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            disabled={loading}
            className="text-medieval-gold-light hover:underline focus-visible:underline font-pixel-body text-sm min-h-[44px] py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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