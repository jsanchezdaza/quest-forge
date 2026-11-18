import { useEffect, useLayoutEffect, useReducer, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Hourglass, Key, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { VALIDATION_RULES } from '../../constants/validation'
import { useTranslation } from '../../i18n'
import {
  armRecoveryCheckTimeout,
  classifyRecoveryFailure,
  nextRecoveryLocation,
  postRecoveryCode,
  readRecoveryUrl,
  readStoredVerifier,
  recoveryArrival,
  recoveryVerifierRaw,
  type RecoveryCheckResult,
  type RecoveryUrl,
} from '../../lib/recoveryLink'
import { supabase } from '../../lib/supabase'
import {
  UPDATE_PASSWORD_CHECKING_MS,
  beginUpdatePassword,
  passwordUpdateFailure,
  showUpdatePasswordChecking,
  retainedPassword,
  updatePasswordHelp,
  updatePasswordReducer,
  type UpdatePasswordState,
} from '../../lib/updatePassword'
import { useReleaseOnUnmount } from '../../lib/useReleaseOnUnmount'
import { useAuthStore } from '../../store/authStore'
import { Button, PasswordInput, narrowAuthButtonClassName } from '../ui'
import PasswordRequirements from './PasswordRequirements'

const REQUIREMENTS_ID = 'password-requirements'
const HELP_ID = 'update-password-help'

const labelClassName =
  'block text-xs font-pixel-body text-gray-200 uppercase tracking-wide'

const titleClassName =
  'mt-1 font-pixel-body text-sm font-semibold normal-case tracking-normal text-gray-300 text-balance sm:mt-0'

const modeLinkClassName =
  'text-shadow-legible text-medieval-gold-light hover:underline focus-visible:underline font-pixel-body text-sm min-h-[44px] py-2'

// Resting field border below 768. Same token as the login fields.
const restingInputBorderClassName =
  'max-sm:not-focus-visible:not-aria-invalid:border-auth-input-border-mobile'

const noticeTitleClassName =
  'font-pixel-body text-base font-normal normal-case tracking-normal text-gray-100 text-balance'

const actionClassName = `w-full whitespace-nowrap ${narrowAuthButtonClassName}`

function focusHeading(heading: HTMLHeadingElement | null) {
  if (!heading) return
  heading.focus({ preventScroll: true, focusVisible: true })
}

function headingKey(state: UpdatePasswordState, checkingVisible: boolean): string | null {
  if (state.status === 'checking') return checkingVisible ? 'checking' : null
  if (state.status === 'saving') return 'form'
  if (state.status === 'unreachable') return 'unreachable'
  return state.status
}

export default function UpdatePasswordPanel({
  onSignIn,
  onRequestReset,
}: {
  onSignIn: () => void
  onRequestReset: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const initializing = useAuthStore((state) => state.initializing)
  const updatePassword = useAuthStore((state) => state.updatePassword)
  const clearPasswordRecovery = useAuthStore((state) => state.clearPasswordRecovery)
  const endRecoverySession = useAuthStore((state) => state.endRecoverySession)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const linkRef = useRef(readRecoveryUrl(window.location.href))
  const [state, dispatch] = useReducer(
    updatePasswordReducer,
    undefined,
    () => beginUpdatePassword({
      initializing,
      signedIn: user !== null,
      email: user?.email ?? '',
      arrival: recoveryArrival(window.location.href),
    }),
  )
  const [password, setPassword] = useState('')
  const [elapsedMs, setElapsedMs] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)
  const requestRef = useRef(0)
  const generation = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const [attempt, setAttempt] = useState(0)
  const linkPending = linkRef.current.kind === 'code' || linkRef.current.kind === 'implicit'
  const checkPending = state.status === 'checking' || (state.status === 'unreachable' && state.retrying)
  const userRef = useRef(user)
  const initializingRef = useRef(initializing)
  userRef.current = user
  initializingRef.current = initializing

  useEffect(() => {
    if (initializing) return
    dispatch({
      type: 'resolved',
      signedIn: user !== null,
      email: user?.email ?? '',
      linkPending,
    })
  }, [initializing, user, linkPending])

  useEffect(() => {
    if (state.status !== 'checking') return
    const id = window.setTimeout(() => setElapsedMs(UPDATE_PASSWORD_CHECKING_MS), UPDATE_PASSWORD_CHECKING_MS)
    return () => {
      window.clearTimeout(id)
      setElapsedMs(0)
    }
  }, [state.status])

  useEffect(() => {
    if (!checkPending) return
    const current = generation.current
    return armRecoveryCheckTimeout(() => {
      if (generation.current !== current) return
      generation.current += 1
      abortRef.current?.abort()
      dispatch({ type: 'timed-out' })
    })
  }, [checkPending, attempt])

  useEffect(() => {
    const link = linkRef.current
    const needsNetwork = link.kind === 'code' || link.kind === 'implicit'
    if (!needsNetwork && attempt === 0) return
    const current = generation.current
    const controller = new AbortController()
    abortRef.current = controller

    const apply = (result: RecoveryCheckResult) => {
      if (generation.current !== current || result.status === 'aborted') return
      generation.current += 1
      if (result.status === 'session') {
        dispatch({ type: 'checked', outcome: 'session', email: result.email })
        return
      }
      dispatch({ type: 'checked', outcome: result.status })
    }

    if (!needsNetwork) {
      const currentUser = userRef.current
      if (!initializingRef.current) {
        apply(currentUser
          ? { status: 'session', email: currentUser.email, accessToken: '', refreshToken: '' }
          : { status: 'invalid' })
      }
      return () => controller.abort()
    }

    void checkRecoveryLink(link, controller.signal).then(apply)
    return () => controller.abort()
  }, [attempt])

  const checkingVisible = showUpdatePasswordChecking(state, elapsedMs)
  const shownHeading = headingKey(state, checkingVisible)

  useLayoutEffect(() => {
    if (!shownHeading) return
    focusHeading(headingRef.current)
  }, [shownHeading])

  useReleaseOnUnmount(clearPasswordRecovery)

  useEffect(() => {
    const status = state.status === 'saving' ? 'form' : state.status
    if (status !== 'expired' && status !== 'form' && status !== 'done') return
    const next = nextRecoveryLocation(window.location.href, status)
    if (!next) return
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (next === current) return
    window.history.replaceState(window.history.state, '', next)
  }, [state.status])

  useEffect(() => {
    setPassword((draft) => retainedPassword(state.status, draft))
  }, [state.status])

  const enterGame = () => {
    navigate('/game')
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (savingRef.current || state.status !== 'form') return
    const next = updatePasswordReducer(state, { type: 'submit', password })
    dispatch({ type: 'submit', password })
    if (next.status !== 'saving') {
      passwordRef.current?.focus()
      return
    }

    const requestId = ++requestRef.current
    savingRef.current = true
    try {
      await updatePassword(password)
      if (requestId !== requestRef.current) return
      dispatch({ type: 'saved' })
    } catch (cause) {
      if (requestId !== requestRef.current) return
      if (passwordUpdateFailure(cause).outcome === 'invalid-session') {
        endRecoverySession()
      }
      dispatch({ type: 'failed', error: cause })
      passwordRef.current?.focus()
    } finally {
      if (requestId === requestRef.current) savingRef.current = false
    }
  }

  const retry = () => {
    if (state.status !== 'unreachable' || state.retrying) return
    dispatch({ type: 'retry' })
    setAttempt((value) => value + 1)
  }

  if (state.status === 'checking') {
    if (!checkingVisible) return null
    return (
      <div role="status">
        <h2 ref={headingRef} tabIndex={-1} className={titleClassName}>
          {t('auth.updatePasswordChecking')}
        </h2>
      </div>
    )
  }

  if (state.status === 'invalid' || state.status === 'expired') {
    const expired = state.status === 'expired'
    return (
      <RecoveryNotice
        headingRef={headingRef}
        icon={expired ? <Hourglass aria-hidden className="mx-auto mb-3 text-medieval-gold" size={32} /> : null}
        title={t(expired ? 'auth.updatePasswordExpiredTitle' : 'auth.updatePasswordInvalidTitle')}
        body={t(expired ? 'auth.updatePasswordExpiredBody' : 'auth.updatePasswordInvalidBody')}
        primary={t('auth.updatePasswordRequest')}
        onPrimary={onRequestReset}
        secondary={t('auth.resetBack')}
        onSecondary={onSignIn}
      />
    )
  }

  if (state.status === 'unreachable') {
    const retrying = state.retrying
    return (
      <RecoveryNotice
        headingRef={headingRef}
        icon={<WifiOff aria-hidden className="mx-auto mb-3 text-medieval-gold" size={32} />}
        title={t('auth.updatePasswordUnreachableTitle')}
        body={t('auth.updatePasswordUnreachableBody')}
        primary={retrying ? t('auth.updatePasswordRetrying') : t('auth.updatePasswordTryAgain')}
        primaryDisabled={retrying}
        onPrimary={retry}
        secondary={t('auth.updatePasswordRequest')}
        onSecondary={onRequestReset}
      />
    )
  }

  if (state.status === 'done') {
    return (
      <div>
        <div className="-mx-1.5 bg-background-darker/55 px-1.5 py-4 text-center">
          <Key aria-hidden className="mx-auto mb-3 text-medieval-gold" size={32} />
          <h2 ref={headingRef} tabIndex={-1} className="font-pixel-body text-base font-normal normal-case tracking-normal text-gray-100">
            {t('auth.updatePasswordDoneTitle')}
          </h2>
          <p className="mt-2 font-pixel-body text-sm leading-5 text-gray-100">
            {t('auth.updatePasswordDoneBody')}
          </p>
        </div>
        <Button type="button" variant="primary" className={`mt-4 ${actionClassName}`} onClick={enterGame}>
          {t('auth.updatePasswordEnter')}
        </Button>
      </div>
    )
  }

  const email = state.email
  const help = updatePasswordHelp(email)
  const saving = state.status === 'saving'
  const fieldError = state.status === 'form' ? state.fieldError : null
  const errorText = fieldError
    ? t(fieldError, { min: VALIDATION_RULES.PASSWORD_MIN_LENGTH })
    : ''

  return (
    <div>
      <div className="mb-4 text-center">
        <h2 ref={headingRef} tabIndex={-1} className={titleClassName}>
          {t('auth.updatePasswordTitle')}
        </h2>
        <p id={HELP_ID} className="mt-1 font-pixel-body text-sm text-gray-300 [@media(max-height:450px)]:sr-only">
          {t(help.key, help.email ? { email: help.email } : undefined)}
        </p>
      </div>
      <form noValidate onSubmit={save} aria-busy={saving || undefined} className="flex flex-col gap-field-gap">
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={email}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
        <PasswordInput
          ref={passwordRef}
          id="password"
          autoComplete="new-password"
          readOnly={saving}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          label={t('auth.updatePasswordLabel')}
          placeholder={t('form.passwordPlaceholder')}
          labelClassName={labelClassName}
          className={restingInputBorderClassName}
          error={errorText}
          required
          aria-describedby={REQUIREMENTS_ID}
          details={<PasswordRequirements id={REQUIREMENTS_ID} password={password} />}
        />
        <Button
          type="submit"
          variant="primary"
          aria-disabled={saving ? true : undefined}
          className={actionClassName}
        >
          {saving ? t('auth.updatePasswordSaving') : t('auth.updatePasswordSave')}
        </Button>
      </form>
    </div>
  )
}

function RecoveryNotice({
  headingRef,
  icon,
  title,
  body,
  primary,
  primaryDisabled = false,
  onPrimary,
  secondary,
  onSecondary,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  icon: ReactNode
  title: string
  body: string
  primary: string
  primaryDisabled?: boolean
  onPrimary: () => void
  secondary: string
  onSecondary: () => void
}) {
  return (
    <div>
      <div className="-mx-1.5 bg-background-darker/55 px-1.5 py-4 text-center">
        {icon}
        <h2 ref={headingRef} tabIndex={-1} className={noticeTitleClassName}>
          {title}
        </h2>
        <p className="mt-2 font-pixel-body text-sm leading-5 text-gray-100">
          {body}
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        aria-disabled={primaryDisabled ? true : undefined}
        className={`mt-4 ${actionClassName}`}
        onClick={onPrimary}
      >
        {primary}
      </Button>
      <div className="mt-4 text-center">
        <button type="button" onClick={onSecondary} className={modeLinkClassName}>
          {secondary}
        </button>
      </div>
    </div>
  )
}

async function checkRecoveryLink(link: RecoveryUrl, signal: AbortSignal): Promise<RecoveryCheckResult> {
  if (link.kind === 'implicit') {
    const { data, error } = await supabase.auth.setSession({
      access_token: link.accessToken,
      refresh_token: link.refreshToken,
    })
    if (signal.aborted) return { status: 'aborted' }
    if (error) return { status: classifyRecoveryFailure(error) }
    return { status: 'session', email: data.session?.user.email ?? '', accessToken: link.accessToken, refreshToken: link.refreshToken }
  }

  if (link.kind !== 'code') return { status: 'invalid' }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return { status: 'unreachable' }
  const verifier = readStoredVerifier(recoveryVerifierRaw(
    (key) => localStorage.getItem(key),
    supabaseUrl,
    link.flowId,
  ))
  if (!verifier) return { status: 'invalid' }

  const result = await postRecoveryCode({
    supabaseUrl,
    supabaseKey,
    code: link.code,
    verifier,
    signal,
  })
  if (result.status !== 'session' || signal.aborted) return result.status === 'session' ? { status: 'aborted' } : result
  await rememberRecoverySession(result.accessToken, result.refreshToken, signal)
  return signal.aborted ? { status: 'aborted' } : result
}

/** The code is already spent. A storage failure still shows the form. */
async function rememberRecoverySession(accessToken: string, refreshToken: string, signal: AbortSignal) {
  try {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (signal.aborted) return
    if (error) console.error('Failed to store the recovery session:', error)
  } catch (error) {
    if (signal.aborted) return
    console.error('Failed to store the recovery session:', error)
  }
}
