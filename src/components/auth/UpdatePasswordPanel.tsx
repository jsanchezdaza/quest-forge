import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { Key } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { VALIDATION_RULES } from '../../constants/validation'
import { useTranslation } from '../../i18n'
import {
  UPDATE_PASSWORD_CHECKING_MS,
  beginUpdatePassword,
  passwordUpdateFailure,
  showUpdatePasswordChecking,
  updatePasswordHelp,
  updatePasswordReducer,
  type UpdatePasswordState,
} from '../../lib/updatePassword'
import { useAuthStore } from '../../store/authStore'
import { Button, PasswordInput } from '../ui'
import PasswordRequirements from './PasswordRequirements'

const REQUIREMENTS_ID = 'password-requirements'
const HELP_ID = 'update-password-help'

const labelClassName =
  'block text-xs font-pixel-body text-gray-200 uppercase tracking-wide'

const titleClassName =
  'mt-1 font-pixel-body text-sm font-semibold normal-case tracking-normal text-gray-300 text-balance sm:mt-0'

const modeLinkClassName =
  'text-medieval-gold-light hover:underline focus-visible:underline font-pixel-body text-sm min-h-[44px] py-2'

function focusHeading(heading: HTMLHeadingElement | null) {
  if (!heading) return
  heading.focus({ preventScroll: true, focusVisible: true })
}

function headingKey(state: UpdatePasswordState, checkingVisible: boolean): string | null {
  if (state.status === 'checking') return checkingVisible ? 'checking' : null
  if (state.status === 'saving') return 'form'
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
  const [state, dispatch] = useReducer(
    updatePasswordReducer,
    { initializing, signedIn: user !== null, email: user?.email ?? '' },
    beginUpdatePassword,
  )
  const [password, setPassword] = useState('')
  const [elapsedMs, setElapsedMs] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)
  const requestRef = useRef(0)

  useEffect(() => {
    if (initializing) return
    dispatch({ type: 'resolved', signedIn: user !== null, email: user?.email ?? '' })
  }, [initializing, user])

  useEffect(() => {
    if (state.status !== 'checking') return
    const id = window.setTimeout(() => setElapsedMs(UPDATE_PASSWORD_CHECKING_MS), UPDATE_PASSWORD_CHECKING_MS)
    return () => {
      window.clearTimeout(id)
      setElapsedMs(0)
    }
  }, [state.status])

  const checkingVisible = showUpdatePasswordChecking(state, elapsedMs)
  const shownHeading = headingKey(state, checkingVisible)

  useLayoutEffect(() => {
    if (!shownHeading) return
    focusHeading(headingRef.current)
  }, [shownHeading])

  const enterGame = () => {
    clearPasswordRecovery()
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
        await endRecoverySession()
      }
      dispatch({ type: 'failed', error: cause })
      passwordRef.current?.focus()
    } finally {
      if (requestId === requestRef.current) savingRef.current = false
    }
  }

  if (state.status === 'checking') {
    if (!checkingVisible) return null
    return (
      <h2 ref={headingRef} tabIndex={-1} className={titleClassName}>
        {t('auth.updatePasswordChecking')}
      </h2>
    )
  }

  if (state.status === 'invalid') {
    return (
      <div>
        <div className="-mx-1.5 bg-background-darker/55 px-1.5 py-4 text-center">
          <h2 ref={headingRef} tabIndex={-1} className="font-pixel-body text-base font-normal normal-case tracking-normal text-gray-100 text-balance">
            {t('auth.updatePasswordInvalidTitle')}
          </h2>
          <p className="mt-2 font-pixel-body text-sm leading-5 text-gray-100">
            {t('auth.updatePasswordInvalidBody')}
          </p>
        </div>
        <Button type="button" variant="primary" className="mt-4 w-full whitespace-nowrap" onClick={onRequestReset}>
          {t('auth.updatePasswordRequest')}
        </Button>
        <div className="mt-4 text-center">
          <button type="button" onClick={onSignIn} className={modeLinkClassName}>
            {t('auth.resetBack')}
          </button>
        </div>
      </div>
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
        <Button type="button" variant="primary" className="mt-4 w-full whitespace-nowrap" onClick={enterGame}>
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
          hidden
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
          error={errorText}
          required
          aria-describedby={REQUIREMENTS_ID}
          details={<PasswordRequirements id={REQUIREMENTS_ID} password={password} />}
        />
        <Button
          type="submit"
          variant="primary"
          aria-disabled={saving ? true : undefined}
          className="w-full whitespace-nowrap"
        >
          {saving ? t('auth.updatePasswordSaving') : t('auth.updatePasswordSave')}
        </Button>
      </form>
    </div>
  )
}
