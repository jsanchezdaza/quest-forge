import { useRef, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Input, PasswordInput, Button, ErrorMessage } from '../ui'
import { VALIDATION_RULES } from '../../constants/validation'
import { useTranslation } from '../../i18n'
import { authErrorMessageKey } from '../../lib/authErrors'
import {
  authFieldError,
  firstInvalidAuthField,
  type AuthField,
} from '../../lib/authFieldValidation'
import type { AuthMode } from '../../lib/authMode'
import PasswordRequirements from './PasswordRequirements'

interface AuthFailure {
  mode: AuthMode
  message: string
}

interface AuthFormProps {
  mode: AuthMode
  onToggleMode: () => void
}

const authLabelClassName =
  'block text-xs font-pixel-body text-gray-200 uppercase tracking-wide'

const PASSWORD_REQUIREMENTS_ID = 'password-requirements'

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const { signIn, signUp, loading } = useAuthStore()
  const { t } = useTranslation()
  const error = failure?.mode === mode ? failure.message : ''
  const values = { email, username, password }
  const fieldRefs = { email: emailRef, username: usernameRef, password: passwordRef }

  const touch = (field: AuthField) => {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }))
  }

  const fieldMessage = (field: AuthField): string => {
    if (!submitted && !touched[field]) return ''
    const key = authFieldError(field, values[field], mode)
    if (!key) return ''
    return t(key, {
      min: field === 'password'
        ? VALIDATION_RULES.PASSWORD_MIN_LENGTH
        : VALIDATION_RULES.USERNAME_MIN_LENGTH,
      max: VALIDATION_RULES.USERNAME_MAX_LENGTH,
    })
  }

  const handleToggleMode = () => {
    setFailure(null)
    setTouched({})
    setSubmitted(false)
    onToggleMode()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setFailure(null)

    const firstInvalid = firstInvalidAuthField(values, mode)
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus()
      return
    }

    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, username.trim())
      } else {
        await signIn(email.trim(), password)
      }
    } catch (cause) {
      setFailure({ mode, message: t(authErrorMessageKey(cause)) })
    }
  }

  return (
    <div className="w-full px-4">
      <div className="relative mx-auto w-full max-w-auth-card border-2 border-medieval-gold/40 rounded-xl bg-white/20 backdrop-blur-sm shadow-2xl shadow-black/50 p-card-pad-mobile sm:p-card-pad">
        {/* The checklist needs the room the title gives up on a short sign-up screen. */}
        <div className={[
          'text-center mb-6 sm:mb-8',
          mode === 'signup' ? '[@media(max-height:800px)]:mb-0' : '[@media(max-height:800px)]:mb-2',
        ].join(' ')}>
          <h1 className={[
            'dnd-title text-3xl sm:text-4xl md:text-5xl mb-6 sm:mb-8 leading-tight',
            mode === 'signup'
              ? '[@media(max-height:800px)]:mb-0 [@media(max-height:800px)]:md:text-3xl [@media(max-height:800px)]:md:leading-none'
              : '[@media(max-height:800px)]:mb-2 [@media(max-height:800px)]:md:text-4xl',
          ].join(' ')}>
            {t('app.title')}
          </h1>
          <p className={[
            'font-pixel-body text-sm text-gray-300',
            mode === 'signup' ? '[@media(max-height:800px)]:leading-none' : '',
          ].join(' ')}>
            {mode === 'signin' ? t('auth.welcomeReturning') : t('auth.welcomeNew')}
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-field-gap">
          <Input
            ref={emailRef}
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => touch('email')}
            label={t('form.emailLabel')}
            placeholder={t('form.emailPlaceholder')}
            labelClassName={authLabelClassName}
            error={fieldMessage('email')}
            required={VALIDATION_RULES.EMAIL_REQUIRED}
          />

          {mode === 'signup' && (
            <Input
              ref={usernameRef}
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              onBlur={() => touch('username')}
              label={t('form.usernameLabel')}
              placeholder={t('form.usernamePlaceholder')}
              labelClassName={authLabelClassName}
              error={fieldMessage('username')}
              required={VALIDATION_RULES.USERNAME_REQUIRED}
              minLength={VALIDATION_RULES.USERNAME_MIN_LENGTH}
            />
          )}

          <PasswordInput
            ref={passwordRef}
            id="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => touch('password')}
            label={t('form.passwordLabel')}
            placeholder={t('form.passwordPlaceholder')}
            labelClassName={authLabelClassName}
            error={fieldMessage('password')}
            required={true}
            minLength={mode === 'signup' ? VALIDATION_RULES.PASSWORD_MIN_LENGTH : undefined}
            aria-describedby={mode === 'signup' ? PASSWORD_REQUIREMENTS_ID : undefined}
            details={
              mode === 'signup' ? (
                <PasswordRequirements id={PASSWORD_REQUIREMENTS_ID} password={password} />
              ) : undefined
            }
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

        <div className={[
          'mt-4 text-center sm:mt-6',
          mode === 'signup' ? '[@media(max-height:800px)]:mt-0' : '[@media(max-height:800px)]:mt-1',
        ].join(' ')}>
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