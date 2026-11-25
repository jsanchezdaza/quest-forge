import { isAuthRetryableFetchError, isAuthSessionMissingError } from '@supabase/supabase-js'
import type { TranslationKey } from '../i18n'
import { authFieldError } from './authFieldValidation.ts'
import { parseAuthMode, type AuthMode } from './authMode.ts'
import type { RecoveryArrival } from './recoveryLink.ts'

export const UPDATE_PASSWORD_CHECKING_MS = 300

export type UpdatePasswordState =
  | { status: 'checking' }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'unreachable'; retrying: boolean }
  | { status: 'form'; email: string; fieldError: TranslationKey | null }
  | { status: 'saving'; email: string }
  | { status: 'done' }

export type UpdatePasswordAction =
  | { type: 'resolved'; signedIn: boolean; email: string; linkPending?: boolean }
  | { type: 'checked'; outcome: 'expired' | 'unreachable' | 'invalid' | 'session'; email?: string }
  | { type: 'retry' }
  | { type: 'timed-out' }
  | { type: 'submit'; password: string }
  | { type: 'saved' }
  | { type: 'failed'; error: unknown }

interface SessionInput {
  initializing: boolean
  signedIn: boolean
  email: string
  arrival?: RecoveryArrival
}

export function beginUpdatePassword(input: SessionInput): UpdatePasswordState {
  if (input.arrival === 'expired') return { status: 'expired' }
  if (input.arrival === 'invalid') return { status: 'invalid' }
  if (input.arrival === 'check' || input.initializing) return { status: 'checking' }
  return resolveSession(input.signedIn, input.email)
}

export function updatePasswordReducer(
  state: UpdatePasswordState,
  action: UpdatePasswordAction,
): UpdatePasswordState {
  if (action.type === 'resolved') {
    if (state.status !== 'checking') return state
    if (!action.signedIn && action.linkPending) return state
    return resolveSession(action.signedIn, action.email)
  }
  if (action.type === 'checked') {
    if (!checkInFlight(state)) return state
    if (action.outcome === 'session') return { status: 'form', email: action.email ?? '', fieldError: null }
    if (action.outcome === 'expired') return { status: 'expired' }
    if (action.outcome === 'unreachable') return { status: 'unreachable', retrying: false }
    return { status: 'invalid' }
  }
  if (action.type === 'retry') {
    if (state.status !== 'unreachable' || state.retrying) return state
    return { status: 'unreachable', retrying: true }
  }
  if (action.type === 'timed-out') {
    if (state.status === 'checking') return { status: 'unreachable', retrying: false }
    if (state.status === 'unreachable' && state.retrying) return { ...state, retrying: false }
    return state
  }
  if (action.type === 'submit') {
    if (state.status !== 'form') return state
    const fieldError = authFieldError('password', action.password, 'update-password')
    if (fieldError) return { ...state, fieldError }
    return { status: 'saving', email: state.email }
  }
  if (action.type === 'saved') {
    if (state.status !== 'saving') return state
    return { status: 'done' }
  }
  if (state.status !== 'saving') return state
  const failure = passwordUpdateFailure(action.error)
  if (failure.outcome === 'invalid-session') return { status: 'invalid' }
  return { status: 'form', email: state.email, fieldError: failure.messageKey }
}

export function showUpdatePasswordChecking(state: UpdatePasswordState, elapsedMs: number): boolean {
  return state.status === 'checking' && elapsedMs >= UPDATE_PASSWORD_CHECKING_MS
}

export function updatePasswordHelp(email: string): { key: TranslationKey; email?: string } {
  const trimmed = email.trim()
  if (!trimmed) return { key: 'auth.updatePasswordHelpNoEmail' }
  return { key: 'auth.updatePasswordHelp', email: trimmed }
}

export type PasswordUpdateFailure =
  | { outcome: 'invalid-session' }
  | { outcome: 'field'; messageKey: TranslationKey }

export function passwordUpdateFailure(error: unknown): PasswordUpdateFailure {
  if (isAuthSessionMissingError(error)) return { outcome: 'invalid-session' }
  const status = (error as { status?: unknown } | null)?.status
  const code = (error as { code?: unknown } | null)?.code
  if (
    status === 401
    || code === 'session_not_found'
    || code === 'reauthentication_needed'
    || code === 'forbidden'
  ) return { outcome: 'invalid-session' }
  if (code === 'same_password') return { outcome: 'field', messageKey: 'auth.updatePasswordSame' }
  if (code === 'weak_password') return { outcome: 'field', messageKey: 'error.weakPassword.message' }
  if (
    status === 429
    || code === 'over_email_send_rate_limit'
    || code === 'over_request_rate_limit'
  ) {
    return { outcome: 'field', messageKey: 'auth.resetTooManyAttempts' }
  }
  if (isAuthRetryableFetchError(error) && error.status === 0) {
    return { outcome: 'field', messageKey: 'auth.resetSendFailed' }
  }
  return { outcome: 'field', messageKey: 'error.authError.message' }
}

export function shouldRedirectSignedInToGame(input: {
  signedIn: boolean
  mode: AuthMode
  passwordRecovery: boolean
}): boolean {
  if (!input.signedIn) return false
  if (input.passwordRecovery) return false
  if (input.mode === 'update-password') return false
  return true
}

export function isUpdatePasswordSearch(search: string): boolean {
  const query = search.startsWith('?') ? search.slice(1) : search
  return parseAuthMode(new URLSearchParams(query).get('mode')) === 'update-password'
}

export function showFullScreenInitializing(initializing: boolean, search: string): boolean {
  return initializing && !isUpdatePasswordSearch(search)
}

export function recoveryHoldAfterAuthEvent(input: {
  event: string
  hasSession: boolean
  held: boolean
}): boolean {
  if (!input.hasSession) return false
  if (input.event === 'PASSWORD_RECOVERY') return true
  return input.held
}

export function createRecoveryHold() {
  let held = false
  return {
    apply(event: string, hasSession: boolean): boolean {
      held = recoveryHoldAfterAuthEvent({ event, hasSession, held })
      return held
    },
    release(): boolean {
      held = false
      return held
    },
    current(): boolean {
      return held
    },
  }
}

export function signOutLocalSession<T>(
  signOut: (options: { scope: 'local' }) => Promise<T>,
): Promise<T> {
  return signOut({ scope: 'local' })
}

export function signOutInBackground(
  signOut: () => Promise<unknown>,
  onError: (error: unknown) => void,
): void {
  void Promise.resolve()
    .then(signOut)
    .catch(onError)
}

export function retainedPassword(status: UpdatePasswordState['status'], draft: string): string {
  if (status === 'done' || status === 'invalid' || status === 'expired' || status === 'unreachable') return ''
  return draft
}

function checkInFlight(state: UpdatePasswordState): boolean {
  return state.status === 'checking' || (state.status === 'unreachable' && state.retrying)
}

function resolveSession(signedIn: boolean, email: string): UpdatePasswordState {
  if (!signedIn) return { status: 'invalid' }
  return { status: 'form', email, fieldError: null }
}
