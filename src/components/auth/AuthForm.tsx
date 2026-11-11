import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
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
import { recoveryConcealsAccount, recoveryErrorMessageKey } from '../../lib/passwordRecovery'
import PasswordRequirements from './PasswordRequirements'

interface AuthFailure {
  mode: AuthMode
  message: string
}

interface AuthFormProps {
  mode: AuthMode
  onToggleMode: () => void
  onForgotPassword: () => void
}

const authLabelClassName =
  'block text-xs font-pixel-body text-gray-200 uppercase tracking-wide'

const modeLinkClassName =
  'text-medieval-gold-light hover:underline focus-visible:underline font-pixel-body text-sm min-h-[44px] py-2 disabled:opacity-50 disabled:cursor-not-allowed'

const forgotPasswordClassName =
  'forgot-password-link font-pixel-body text-sm text-medieval-gold-light underline underline-offset-2 hover:decoration-2'

const PASSWORD_REQUIREMENTS_ID = 'password-requirements'
const RESET_HELP_ID = 'reset-help'

function focusHeading(heading: HTMLHeadingElement | null) {
  heading?.focus({ preventScroll: true })
}

export default function AuthForm({ mode, onToggleMode, onForgotPassword }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const resetHeadingRef = useRef<HTMLHeadingElement>(null)
  const confirmedHeadingRef = useRef<HTMLHeadingElement>(null)
  const sendingRef = useRef(false)
  const requestRef = useRef(0)

  const { signIn, signUp, requestPasswordReset, loading } = useAuthStore()
  const { t } = useTranslation()
  const error = failure?.mode === mode ? failure.message : ''
  const values = { email, username, password }
  const fieldRefs = { email: emailRef, username: usernameRef, password: passwordRef }
  const showResetForm = mode === 'reset' && !confirmed

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

  const cancelResetRequest = () => {
    requestRef.current += 1
    sendingRef.current = false
    setSending(false)
  }

  useEffect(() => {
    if (mode === 'reset') return
    requestRef.current += 1
    sendingRef.current = false
    setSending(false)
  }, [mode])

  useLayoutEffect(() => {
    if (mode !== 'reset') return
    focusHeading(confirmed ? confirmedHeadingRef.current : resetHeadingRef.current)
  }, [mode, confirmed])

  const handleToggleMode = () => {
    setFailure(null)
    setTouched({})
    setSubmitted(false)
    onToggleMode()
  }

  const handleForgotPassword = () => {
    cancelResetRequest()
    setConfirmed(false)
    setFailure(null)
    setTouched({})
    setSubmitted(false)
    onForgotPassword()
  }

  const handleDifferentEmail = () => {
    setConfirmed(false)
    setFailure(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sendingRef.current) return
    setSubmitted(true)
    setFailure(null)

    const firstInvalid = firstInvalidAuthField(values, mode)
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus()
      return
    }

    if (mode === 'reset') {
      const requestId = ++requestRef.current
      sendingRef.current = true
      setSending(true)
      try {
        await requestPasswordReset(email.trim())
        if (requestId !== requestRef.current) return
        setConfirmed(true)
      } catch (cause) {
        if (requestId !== requestRef.current) return
        if (recoveryConcealsAccount(cause)) {
          setConfirmed(true)
          return
        }
        setFailure({ mode, message: t(recoveryErrorMessageKey(cause)) })
      } finally {
        if (requestId === requestRef.current) {
          sendingRef.current = false
          setSending(false)
        }
      }
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
      <div className="relative mx-auto w-full max-w-auth-card border-2 border-medieval-gold/40 rounded-xl bg-white/20 backdrop-blur-sm shadow-2xl shadow-black/50 p-card-pad-mobile sm:p-card-pad [@media(max-height:450px)]:py-card-pad-mobile [@media(max-height:450px)]:sm:py-card-pad-mobile">
        {/* The checklist needs the room the title gives up on a short sign-up screen. */}
        <div className={[
          'text-center',
          mode === 'reset'
            ? 'mb-4'
            : 'mb-4 sm:mb-8 [@media(min-width:1024px)_and_(max-height:800px)_and_(min-height:451px)]:mb-2 [@media(max-height:450px)]:mb-4',
        ].join(' ')}>
          <h1 className={[
            'dnd-title text-3xl sm:text-4xl md:text-5xl mb-0 sm:mb-8 leading-tight',
            mode === 'signup'
              ? '[@media(min-width:1024px)_and_(max-height:800px)_and_(min-height:451px)]:mb-0 [@media(min-width:1024px)_and_(max-height:800px)_and_(min-height:451px)]:md:text-3xl [@media(min-width:1024px)_and_(max-height:800px)_and_(min-height:451px)]:md:leading-none'
              : '[@media(min-width:1024px)_and_(max-height:800px)_and_(min-height:451px)]:mb-2 [@media(min-width:1024px)_and_(max-height:800px)_and_(min-height:451px)]:md:text-4xl',
            '[@media(max-height:450px)]:mb-3 [@media(max-height:450px)]:text-2xl [@media(max-height:450px)]:sm:text-2xl [@media(max-height:450px)]:md:text-2xl',
          ].join(' ')}>
            {t('app.title')}
          </h1>
          {showResetForm ? (
            <>
              <h2
                ref={resetHeadingRef}
                tabIndex={-1}
                className="mt-1 font-pixel-body text-sm font-semibold normal-case tracking-normal text-gray-300 sm:mt-0"
              >
                {t('auth.resetTitle')}
              </h2>
              <p
                id={RESET_HELP_ID}
                className="mt-1 font-pixel-body text-sm text-gray-300 [@media(max-height:450px)]:sr-only"
              >
                {t('auth.resetHelp')}
              </p>
            </>
          ) : mode !== 'reset' ? (
            <p className={[
              'mt-1 font-pixel-body text-sm text-gray-300 sm:mt-0',
              mode === 'signup'
                ? '[@media(min-width:1024px)_and_(max-height:800px)]:leading-none'
                : '[@media(max-height:450px)]:hidden',
            ].join(' ')}>
              {mode === 'signin' ? t('auth.welcomeReturning') : t('auth.welcomeNew')}
            </p>
          ) : null}
        </div>

        {mode === 'reset' && confirmed ? (
          <ResetConfirmation
            headingRef={confirmedHeadingRef}
            onBack={handleToggleMode}
            onDifferentEmail={handleDifferentEmail}
          />
        ) : (
          <>
            <form
              noValidate
              onSubmit={handleSubmit}
              aria-busy={sending || undefined}
              className="flex flex-col gap-field-gap [@media(max-height:450px)]:gap-3"
            >
              <Input
                ref={emailRef}
                id="email"
                type="email"
                inputMode={mode === 'reset' ? 'email' : undefined}
                autoComplete="email"
                readOnly={sending}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => touch('email')}
                label={t('form.emailLabel')}
                placeholder={t('form.emailPlaceholder')}
                labelClassName={authLabelClassName}
                error={fieldMessage('email')}
                required={VALIDATION_RULES.EMAIL_REQUIRED}
                aria-describedby={mode === 'reset' ? RESET_HELP_ID : undefined}
              />

              {mode === 'signup' && (
                <Input
                  ref={usernameRef}
                  id="username"
                  type="text"
                  autoComplete="nickname"
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

              {mode !== 'reset' && (
                mode === 'signin' ? (
                  <div className="relative flex w-full flex-col">
                    <PasswordInput
                      ref={passwordRef}
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onBlur={() => touch('password')}
                      label={t('form.passwordLabel')}
                      placeholder={t('form.passwordPlaceholder')}
                      labelClassName={authLabelClassName}
                      error={fieldMessage('password')}
                      required={true}
                    />
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className={forgotPasswordClassName}
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                ) : (
                  <PasswordInput
                    ref={passwordRef}
                    id="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onBlur={() => touch('password')}
                    label={t('form.passwordLabel')}
                    placeholder={t('form.passwordPlaceholder')}
                    labelClassName={authLabelClassName}
                    error={fieldMessage('password')}
                    required={true}
                    minLength={VALIDATION_RULES.PASSWORD_MIN_LENGTH}
                    aria-describedby={PASSWORD_REQUIREMENTS_ID}
                    details={
                      <PasswordRequirements id={PASSWORD_REQUIREMENTS_ID} password={password} />
                    }
                  />
                )
              )}

              <ErrorMessage message={error} />

              <Button
                type="submit"
                variant="primary"
                isLoading={mode !== 'reset' && loading}
                aria-disabled={sending ? true : undefined}
                className={mode === 'reset' ? 'w-full whitespace-nowrap' : 'w-full'}
              >
                {mode === 'signin' && t('auth.signInButton')}
                {mode === 'signup' && t('auth.signUpButton')}
                {mode === 'reset' && (sending ? t('auth.resetSending') : t('auth.resetSend'))}
              </Button>
            </form>

            <div className={[
              'mt-4 text-center sm:mt-6',
              mode === 'signup'
                ? '[@media(max-height:800px)_and_(min-height:451px)]:mt-0'
                : '[@media(max-height:800px)_and_(min-height:451px)]:mt-1',
              '[@media(max-height:450px)]:mt-3',
            ].join(' ')}>
              <button
                type="button"
                onClick={handleToggleMode}
                disabled={loading}
                className={modeLinkClassName}
              >
                {mode === 'signin' && t('auth.toggleToSignUp')}
                {mode === 'signup' && t('auth.toggleToSignIn')}
                {mode === 'reset' && t('auth.resetBack')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ResetConfirmation({
  headingRef,
  onBack,
  onDifferentEmail,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onBack: () => void
  onDifferentEmail: () => void
}) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="-mx-1.5 bg-background-darker/55 px-1.5 py-4 text-center">
        <Mail aria-hidden className="mx-auto mb-3 text-medieval-gold" size={32} />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-pixel-body text-base font-normal normal-case tracking-normal text-gray-100"
        >
          {t('auth.resetConfirmedTitle')}
        </h2>
        <p className="mt-2 font-pixel-body text-sm leading-5 text-gray-100">
          {t('auth.resetConfirmedBody')}
        </p>
      </div>
      <Button type="button" variant="secondary" className="mt-4 w-full" onClick={onBack}>
        {t('auth.resetBack')}
      </Button>
      <div className="mt-4 text-center">
        <button type="button" onClick={onDifferentEmail} className={modeLinkClassName}>
          {t('auth.resetDifferentEmail')}
        </button>
      </div>
    </div>
  )
}
