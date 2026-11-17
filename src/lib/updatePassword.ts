import { isAuthRetryableFetchError, isAuthSessionMissingError } from '@supabase/supabase-js'
import type { TranslationKey } from '../i18n'
import { authFieldError } from './authFieldValidation.ts'
import { parseAuthMode, type AuthMode } from './authMode.ts'

/**
 * How long the recovery card waits before it says it is checking the link.
 * A faster answer shows the form or the invalid link with no message in between.
 */
export const UPDATE_PASSWORD_CHECKING_MS = 300

/**
 * The new-password card. The phases are exclusive: a boolean for each one
 * would allow "saving" and "invalid" at the same time.
 */
export type UpdatePasswordState =
  | { status: 'checking' }
  | { status: 'invalid' }
  | { status: 'form'; email: string; fieldError: TranslationKey | null }
  | { status: 'saving'; email: string }
  | { status: 'done' }

export type UpdatePasswordAction =
  | { type: 'resolved'; signedIn: boolean; email: string }
  | { type: 'submit'; password: string }
  | { type: 'saved' }
  | { type: 'failed'; error: unknown }

interface SessionInput {
  initializing: boolean
  signedIn: boolean
  email: string
}

export function beginUpdatePassword(input: SessionInput): UpdatePasswordState {
  if (input.initializing) return { status: 'checking' }
  return resolveSession(input.signedIn, input.email)
}

export function updatePasswordReducer(
  state: UpdatePasswordState,
  action: UpdatePasswordAction,
): UpdatePasswordState {
  if (action.type === 'resolved') {
    if (state.status !== 'checking') return state
    return resolveSession(action.signedIn, action.email)
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

/** Names the signed-in email. An empty address drops the "for {email}" phrase. */
export function updatePasswordHelp(email: string): { key: TranslationKey; email?: string } {
  const trimmed = email.trim()
  if (!trimmed) return { key: 'auth.updatePasswordHelpNoEmail' }
  return { key: 'auth.updatePasswordHelp', email: trimmed }
}

export type PasswordUpdateFailure =
  | { outcome: 'invalid-session' }
  | { outcome: 'field'; messageKey: TranslationKey }

/**
 * Map a failed `updateUser({ password })` onto the card.
 *
 * auth-js 2.114 turns a GoTrue `session_not_found` into `AuthSessionMissingError`
 * (status 400, no code) before this runs. A raw 401 is the other expiry that
 * leaves the player on the invalid-link card, as do `reauthentication_needed`
 * and a 403 `forbidden`. `same_password` and `weak_password`
 * stay on the field. A dropped connection and a 429 reuse the recovery copy.
 */
export function passwordUpdateFailure(error: unknown): PasswordUpdateFailure {
  if (isAuthSessionMissingError(error)) return { outcome: 'invalid-session' }
  const status = (error as { status?: unknown } | null)?.status
  const code = (error as { code?: unknown } | null)?.code
  if (
    status === 401
    || status === 403
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

/**
 * Signed-in players leave `/auth` for the game, except on the recovery card
 * and while a `PASSWORD_RECOVERY` hold is set.
 *
 * The URL has to be enough on its own. auth-js saves the recovery session and
 * emits `INITIAL_SESSION` before `PASSWORD_RECOVERY` (the recovery notify is a
 * `setTimeout(0)` in `GoTrueClient._initialize`). Redirecting on the first
 * event would send the player to `/game` before the recovery event arrives.
 */
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

/**
 * `PASSWORD_RECOVERY` starts the hold. Later session events must not clear it:
 * `INITIAL_SESSION` can be observed first, and `USER_UPDATED` follows a save.
 * No session, including sign-out, drops the hold.
 */
export function recoveryHoldAfterAuthEvent(input: {
  event: string
  hasSession: boolean
  held: boolean
}): boolean {
  if (!input.hasSession) return false
  if (input.event === 'PASSWORD_RECOVERY') return true
  return input.held
}

/**
 * The hold has to survive the events that follow a save, and it has to stay
 * down after the player leaves the card. A token refresh must not put it back.
 */
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
    /** Read when a deferred auth update lands. Do not apply the old event again. */
    current(): boolean {
      return held
    },
  }
}

/**
 * The card has already dropped the local session. Waiting on the network
 * would leave the button on "Saving…".
 */
export function signOutInBackground(
  signOut: () => Promise<unknown>,
  onError: (error: unknown) => void,
): void {
  void Promise.resolve()
    .then(signOut)
    .catch(onError)
}

/** Keep the draft while the player is still on the form. Drop it after save or an invalid link. */
export function retainedPassword(status: UpdatePasswordState['status'], draft: string): string {
  if (status === 'done' || status === 'invalid') return ''
  return draft
}

function resolveSession(signedIn: boolean, email: string): UpdatePasswordState {
  if (!signedIn) return { status: 'invalid' }
  return { status: 'form', email, fieldError: null }
}
